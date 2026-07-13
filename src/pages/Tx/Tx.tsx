import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { get, last } from "lodash";
import c from "classnames";
import {
  getTxCanonicalMsgs,
  createLogMatcherForActions
} from "@terra-money/log-finder-ruleset";
import { TxInfo } from "@terra-money/terra.js";
import { formatDistanceToNowStrict } from "date-fns";
import apiClient from "../../apiClient";
import Finder from "../../components/Finder";
import MsgBox from "../../components/MsgBox";
import Copy from "../../components/Copy";
import Icon from "../../components/Icon";
import { useLogfinderActionRuleSet } from "../../hooks/useLogfinder";
import { useCurrentChain } from "../../contexts/ChainsContext";
import { useGetQueryURL } from "../../queries/query";
import format from "../../scripts/format";
import Pending from "./Pending";
import Searching from "./Searching";
import TxAmount from "./TxAmount";
import TaxRateAmount from "./TaxRateAmount";
import { toLogFinderTransaction, transformTx } from "./transform";
import s from "./Tx.module.scss";
import { useIsClassic } from "../../contexts/ChainsContext";
import {
  MINTSCAN_PROXY_URL,
  normalizeMintscanTx
} from "../../queries/mintscan";

const TxComponent = ({ hash }: { hash: string }) => {
  const ruleSet = useLogfinderActionRuleSet();
  const logMatcher = useMemo(
    () => createLogMatcherForActions(ruleSet),
    [ruleSet]
  );
  const isClassic = useIsClassic();
  const { chainID } = useCurrentChain();
  const { data: response, progressState } = usePollTxHash(hash);

  if (!response) {
    return <Searching state={progressState} hash={hash} />;
  }

  const tx = transformTx(response, chainID);

  const isPending = !response?.height;
  const matchedMsg = getTxCanonicalMsgs(toLogFinderTransaction(tx), logMatcher);

  const fee: Amount[] = get(tx, "tx.value.fee.amount");

  // status settings
  const status = isPending ? (
    <span className={c(s.status, s.pending)}>Pending</span>
  ) : !tx.code ? (
    <span className={c(s.status, s.success)}>Success</span>
  ) : (
    <span className={c(s.status, s.fail)}>Failed</span>
  );

  return (
    <>
      <h2 className={s.title}>Transaction Details</h2>
      <div className={s.header}>
        {status}
        <span className={c(s.date, s.sideLine)}>
          {formatDistanceToNowStrict(new Date(response.timestamp.toString()), {
            addSuffix: true
          })}
        </span>
        <span className={c(s.date, s.txTime)}>
          {format.date(tx.timestamp.toString())}
        </span>
      </div>

      {isPending && <Pending timestamp={tx.timestamp} />}
      {tx.code ? (
        <div className={s.failedMsg}>
          <Icon name="error" size={18} className={s.icon} />
          <p>{get(last(tx.logs), "log.message") || get(tx, "raw_log")}</p>
        </div>
      ) : null}

      <div className={s.list}>
        <div className={s.row}>
          <div className={s.head}>Tx Hash</div>
          <div className={s.body}>
            <div>
              {tx.txhash}
              <Copy
                text={tx.txhash}
                style={{ display: "inline-block", position: "absolute" }}
              />
            </div>
          </div>
        </div>

        <div className={s.row}>
          <div className={s.head}>Network</div>
          <div className={s.body}>{tx.chainId}</div>
        </div>

        {isPending ? (
          <></>
        ) : (
          <div className={s.row}>
            <div className={s.head}>Block</div>
            <div className={s.body}>
              <Finder q="blocks" v={String(tx.height)}>
                {String(tx.height)}
              </Finder>
            </div>
          </div>
        )}

        {fee?.length ? (
          <div className={s.row}>
            <div className={s.head}>Transaction fee</div>
            <div className={s.body}>
              {fee.map((fee, key) => (
                <TxAmount index={key} {...fee} key={key} />
              ))}
            </div>
          </div>
        ) : (
          <></>
        )}

        {isClassic ? (
          <div className={s.row}>
            <div className={s.head}>Tax</div>
            <div className={s.body}>
              <TaxRateAmount logs={tx.logs} />
            </div>
          </div>
        ) : (
          <></>
        )}

        {!isPending && (
          <div className={s.row}>
            <div className={s.head}>Gas (Used/Requested)</div>
            <div className={s.body}>
              {parseInt(String(tx.gas_used)).toLocaleString()}/
              {parseInt(String(tx.gas_wanted)).toLocaleString()}
            </div>
          </div>
        )}

        <div className={s.row}>
          <div className={s.head}>Memo</div>
          <div className={s.body}>
            {tx.tx.value?.memo ? tx.tx.value.memo : "-"}
          </div>
        </div>
      </div>

      {tx.tx?.value?.msg.map((msg, index) => {
        const msgInfo = matchedMsg?.[index];

        return (
          <MsgBox
            msg={msg}
            log={response.logs?.[index]}
            info={msgInfo}
            key={index}
          />
        );
      })}
    </>
  );
};

const Tx = () => {
  const { hash } = useParams();
  if (!hash) {
    throw new Error("Tx hash is not defined");
  }

  return hash ? <TxComponent hash={hash} key={hash} /> : null;
};

export default Tx;

/* hooks */
const INTERVAL = 3000;

const usePollTxHash = (txhash: string) => {
  const { chainID } = useCurrentChain();

  const [stored, setStored] = useState<TxInfo>();
  const [progress, setProgress] = useState<number>(0);

  /* polling tx */
  const [refetchTx, setRefetchTx] = useState<boolean>(true);

  /* polling mempool tx */
  const [refetchMempool, setRefetchMempool] = useState<boolean>(false);

  const txURL = useGetQueryURL(`/v1/tx/${txhash}`);

  /* query: tx */
  const txQuery = useQuery({
    queryKey: [chainID, txhash, "tx"],

    queryFn: async () => {
      try {
        const response = await apiClient.get<TxInfo>(txURL);
        if (response.data) return response;
      } catch (error) {
        if (chainID !== "phoenix-1") throw error;
      }

      if (chainID === "phoenix-1") {
        const { data } = await apiClient.get<any[]>(
          `${MINTSCAN_PROXY_URL}/txs/${txhash}`,
          { timeout: 8000 }
        );
        const tx = data?.[0];
        if (tx) {
          return { data: normalizeMintscanTx(tx, chainID) as TxInfo };
        }
      }

      throw new Error("Transaction not found");
    },

    refetchInterval: INTERVAL,
    refetchOnWindowFocus: false,
    enabled: refetchTx
  });

  const mempoolURL = useGetQueryURL(`/v1/mempool/${txhash}`);

  /* query: mempool tx */
  const mempoolQuery = useQuery({
    queryKey: [chainID, txhash, "mempool"],
    queryFn: () => apiClient.get<TxInfo>(mempoolURL),
    refetchInterval: INTERVAL,
    refetchOnWindowFocus: false,
    enabled: refetchMempool
  });

  // if tx not exists(null or no height), start polling mempool tx
  useEffect(() => {
    if (txQuery.data?.data) {
      setStored(txQuery.data.data);
      setRefetchTx(false);
      setRefetchMempool(false);
    }

    if (!txQuery.isFetching && !txQuery.data?.data) {
      setRefetchMempool(true);
    }

    if (mempoolQuery.data?.data) {
      setStored(mempoolQuery.data.data);
      setRefetchMempool(false);
    }

    setProgress(state => (state + 0.0333) % 1);
  }, [mempoolQuery.data, txQuery.data, txQuery.isFetching, txhash]);

  return {
    data: stored,
    progressState: progress
  };
};
