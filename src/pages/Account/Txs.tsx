import { useEffect, useMemo, useState } from "react";
import { isEmpty } from "lodash";
import {
  LogFinderAmountResult,
  getTxAmounts,
  createLogMatcherForAmounts
} from "@terra-money/log-finder-ruleset";
import { TxInfo } from "@terra-money/terra.js";
import Pagination from "../../components/Pagination";
import FlexTable from "../../components/FlexTable";
import Card from "../../components/Card";
import Info from "../../components/Info";
import Icon from "../../components/Icon";
import Finder from "../../components/Finder";
import Loading from "../../components/Loading";
import Coin from "../../components/Coin";
import { useCurrentChain, useIsClassic } from "../../contexts/ChainsContext";
import {
  fromISOTime,
  sliceMsgType,
  splitCoinData
} from "../../scripts/utility";
import format from "../../scripts/format";
import { useLogfinderAmountRuleSet } from "../../hooks/useLogfinder";
import useRequest from "../../hooks/useRequest";
import { useGetQueryURL } from "../../queries/query";
import TxAmount from "../Tx/TxAmount";
import { transformTx } from "../Tx/transform";
import TaxRateAmount from "../Tx/TaxRateAmount";
import CsvExport from "./CSVExport";
import s from "./Txs.module.scss";
import { useQuery } from "react-query";
import apiClient from "../../apiClient";

type Fee = {
  denom: string;
  amount: string;
};

export const getTxFee = (prop: Fee, isClassic?: boolean) =>
  prop &&
  `${format.amount(prop.amount)} ${format.denom(prop.denom, isClassic)}`;

const getRenderAmount = (
  amountList: string[] | undefined,
  amountArray: JSX.Element[]
) => {
  amountList?.forEach(amount => {
    const coin = splitCoinData(amount.trim());
    if (coin) {
      const { amount, denom } = coin;
      const element = <Coin amount={amount} denom={denom} />;

      amountArray.push(element);
    }
  });
};

const getAmount = (
  address: string,
  matchedMsg?: LogFinderAmountResult[][],
  rowLimit?: number
) => {
  const amountIn: JSX.Element[] = [];
  const amountOut: JSX.Element[] = [];
  matchedMsg?.forEach(matchedLog => {
    matchedLog?.forEach(log => {
      const amounts = log.transformed?.amount?.split(",");
      const sender = log.transformed?.sender;
      const recipient = log.transformed?.recipient;

      if (address === sender) {
        getRenderAmount(amounts, amountOut);
      }

      if (address === recipient) {
        getRenderAmount(amounts, amountIn);
      }
    });
  });

  //amount row limit
  if (rowLimit) {
    return [amountIn.slice(0, 3), amountOut.slice(0, 3)];
  }

  return [amountIn, amountOut];
};

const Txs = ({
  address,
  isContract,
  sortAscending
}: {
  address: string;
  isContract?: boolean;
  sortAscending?: boolean;
}) => {
  const { chainID, lcd } = useCurrentChain();
  const [offset, setOffset] = useState<number>(0);
  const isClassic = useIsClassic();
  const isPhoenix = chainID === "phoenix-1";
  const limit = 50;
  const contractLimit = 20;

  const params = { offset, limit: 100, account: address };
  const url = useGetQueryURL("/v1/txs");
  const { data: fcdData, isLoading: fcdLoading } = useRequest<{
    next: number;
    txs: TxInfo[];
  }>({ url, params });

  const shouldUseLcd =
    isPhoenix && !fcdLoading && (!fcdData?.txs || fcdData.txs.length === 0);
  const shouldUseClassicContractLcd = isClassic && isContract && !!lcd;

  const { data: lcdData, isLoading: lcdLoading } = useQuery<{
    next?: number;
    txs: TxInfo[];
  }>(
    ["phoenix-txs", lcd, address, offset],
    async () => {
      const fetchByEvent = async (eventKey: string) => {
        const search = new URLSearchParams();
        search.set("pagination.limit", String(contractLimit));
        search.set("pagination.offset", String(offset));
        search.append("events", `${eventKey}=${address}`);
        const endpoint = `${lcd}/cosmos/tx/v1beta1/txs?${search.toString()}`;
        try {
          const { data } = await apiClient.get(endpoint);
          return data;
        } catch {
          const quoted = new URLSearchParams(search);
          quoted.set("events", `${eventKey}='${address}'`);
          const fallbackEndpoint = `${lcd}/cosmos/tx/v1beta1/txs?${quoted.toString()}`;
          const { data } = await apiClient.get(fallbackEndpoint);
          return data;
        }
      };

      const [sender, recipient] = await Promise.all([
        fetchByEvent("message.sender"),
        fetchByEvent("transfer.recipient")
      ]);
      const messageRecipient = await fetchByEvent("message.recipient");

      const toTxs = (payload: any) =>
        (payload?.tx_responses ?? []).map((resp: any, index: number) => ({
          ...resp,
          tx: payload?.txs?.[index]
        }));

      const merged = [
        ...toTxs(sender),
        ...toTxs(recipient),
        ...toTxs(messageRecipient)
      ];
      const unique = new Map<string, any>();
      merged.forEach(tx => {
        if (tx?.txhash) {
          unique.set(tx.txhash, tx);
        }
      });

      const txs = Array.from(unique.values()).sort(
        (a, b) => Number(b.height) - Number(a.height)
      );

      const senderTotal = Number(sender?.pagination?.total ?? 0);
      const recipientTotal = Number(recipient?.pagination?.total ?? 0);
      const total = Math.max(senderTotal, recipientTotal);
      const next = total > offset + limit ? offset + limit : undefined;

      return { txs, next };
    },
    {
      enabled: shouldUseLcd,
      staleTime: 1000 * 60,
      cacheTime: 1000 * 60
    }
  );

  const { data: classicContractData, isLoading: classicContractLoading } =
    useQuery<{
      next?: number;
      txs: TxInfo[];
    }>(
      ["classic-contract-txs", lcd, address, offset],
      async () => {
        const search = new URLSearchParams();
        search.set("pagination.limit", String(limit));
        search.set("pagination.offset", String(offset));
        search.append("events", `wasm._contract_address='${address}'`);
        const endpoint = `${lcd}/cosmos/tx/v1beta1/txs?${search.toString()}`;
        const { data } = await apiClient.get(endpoint);
        const txs = (data?.tx_responses ?? []).map(
          (resp: any, index: number) => ({
            ...resp,
            tx: data?.txs?.[index]
          })
        );
        const total = Number(data?.pagination?.total ?? 0);
        const next =
          total > offset + contractLimit ? offset + contractLimit : undefined;
        return { txs, next };
      },
      {
        enabled: shouldUseClassicContractLcd,
        staleTime: 1000 * 60,
        cacheTime: 1000 * 60
      }
    );

  const [txsRow, setTxsRow] = useState<JSX.Element[][]>([]);

  const ruleSet = useLogfinderAmountRuleSet();
  const logMatcher = useMemo(
    () => createLogMatcherForAmounts(ruleSet),
    [ruleSet]
  );

  const data = shouldUseClassicContractLcd
    ? classicContractData
    : shouldUseLcd
    ? lcdData
    : fcdData;
  const isLoading = shouldUseClassicContractLcd
    ? classicContractLoading
    : shouldUseLcd
    ? lcdLoading
    : fcdLoading;

  useEffect(() => {
    setTxsRow([]);
  }, [address, chainID]);

  useEffect(() => {
    if (data?.txs) {
      const orderedTxs = sortAscending
        ? [...data.txs].sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        : data.txs;
      const txRow = orderedTxs.map((tx: any) => {
        const txData: TxResponse = transformTx(tx, chainID);
        const matchedLogs = getTxAmounts(
          JSON.stringify(txData),
          logMatcher,
          address
        );
        return getRow(txData, chainID, address, matchedLogs, isClassic);
      });
      setTxsRow(stack => [...stack, ...txRow]);
    }
    // eslint-disable-next-line
  }, [data, chainID, address]);

  const head = [
    `Tx hash`,
    `Type`,
    `Block`,
    `Amount (Out)`,
    `Amount (In)`,
    `Timestamp`,
    `Fee`,
    isClassic ? "Tax" : null
  ];

  return (
    <Card title="Transactions" bordered headerClassName={s.cardTitle}>
      {!isEmpty(txsRow) ? (
        <div className={s.exportCsvWrapper}>
          <CsvExport address={address} />
        </div>
      ) : null}

      <Pagination
        next={data?.next}
        title="transaction"
        action={setOffset}
        loading={isLoading}
      >
        <div className={s.cardBodyContainer}>
          {isEmpty(txsRow) && isLoading ? (
            <Loading />
          ) : !isEmpty(txsRow) ? (
            <FlexTable
              head={head}
              body={txsRow}
              tableStyle={{ border: "none" }}
              headStyle={{ background: "none" }}
            />
          ) : (
            <Card>
              <Info icon="info_outline" title="">
                No more transactions
              </Info>
            </Card>
          )}
        </div>
      </Pagination>
    </Card>
  );
};

export default Txs;

const getRow = (
  response: TxResponse,
  network: string,
  address: string,
  matchedMsg?: LogFinderAmountResult[][],
  isClassic?: boolean
) => {
  const { tx: txBody, txhash, height, timestamp, chainId, logs } = response;
  const isSuccess = !response.code;
  const [amountIn, amountOut] = getAmount(address, matchedMsg, 3);
  const fee = getTxFee(txBody?.value?.fee?.amount?.[0], isClassic);
  const feeData = fee?.split(" ");

  return [
    <span>
      <div className={s.wrapper}>
        <Finder q="tx" network={network} v={txhash}>
          {format.truncate(txhash, [8, 8])}
        </Finder>
        {isSuccess ? (
          <Icon name="check" className={s.success} />
        ) : (
          <Icon name="warning" className={s.fail} />
        )}
      </div>
    </span>,
    <span className="type">{sliceMsgType(txBody?.value?.msg[0].type)}</span>,
    <span>
      <Finder q="blocks" network={network} v={String(height)}>
        {String(height)}
      </Finder>
      <span>({chainId})</span>
    </span>,
    <span className={s.amount}>
      {amountOut.length
        ? amountOut.map((amount, index) => {
            if (index >= 2) {
              return <Finder q="tx" v={txhash} children="..." key={index} />;
            } else {
              return <span key={index}>-{amount}</span>;
            }
          })
        : "-"}
    </span>,
    <span className={s.amount}>
      {amountIn.length
        ? amountIn.map((amount, index) => {
            if (index >= 2) {
              return <Finder q="tx" v={txhash} children="..." key={index} />;
            } else {
              return <span key={index}>+{amount}</span>;
            }
          })
        : "-"}
    </span>,
    <span>{fromISOTime(timestamp.toString())}</span>,
    <span>
      <TxAmount
        amount={feeData?.[0]}
        denom={feeData?.[1]}
        isFormatAmount={true}
      />
    </span>,
    <span>
      <TaxRateAmount logs={logs} />
    </span>
  ];
};
