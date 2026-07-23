import {
  axiosGetWithEndpointFallback,
  getClassicTestnetLcdFallbackBases,
  getLcdFallbackBases
} from "./endpointFallback";

type ClassicTestnetTxPayload = {
  txs?: any[];
  tx_responses?: any[];
};

type ClassicTestnetTxDetailPayload = {
  tx?: any;
  tx_response?: any;
};

type ClassicTestnetBlockPayload = {
  block?: {
    header?: {
      chain_id?: string;
      height?: string;
      time?: string;
      proposer_address?: string;
    };
  };
};

type ClassicTestnetValidator = {
  operator_address: string;
  consensus_pubkey?: { key?: string };
  description?: { moniker?: string };
};

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const consensusAddress = async (publicKey?: string) => {
  if (!publicKey || !globalThis.crypto?.subtle) return undefined;
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    base64ToBytes(publicKey)
  );
  return bytesToHex(new Uint8Array(digest).slice(0, 20));
};

export const normalizeClassicTestnetTx = (
  payload: { tx?: any; tx_response?: any },
  chainID: string
) => ({
  ...payload.tx_response,
  tx: payload.tx,
  chainId: chainID
});

const normalizeClassicTestnetTxs = (
  payload: ClassicTestnetTxPayload,
  chainID: string
) =>
  (payload.tx_responses ?? []).map((response, index) => ({
    ...response,
    tx: payload.txs?.[index],
    chainId: chainID
  }));

export const fetchClassicTestnetTx = async (
  lcd: string,
  chainID: string,
  hash: string
) => {
  const { data } =
    await axiosGetWithEndpointFallback<ClassicTestnetTxDetailPayload>(
      `${lcd}/cosmos/tx/v1beta1/txs/${hash}`,
      {},
      getClassicTestnetLcdFallbackBases(lcd)
    );
  return normalizeClassicTestnetTx(data, chainID);
};

export const fetchCosmosBlock = async (
  lcd: string,
  chainID: string,
  height: string
): Promise<Block> => {
  const fallbackBases = getLcdFallbackBases(lcd, chainID);
  const [blockResponse, txResponse, validatorsResponse] = await Promise.all([
    axiosGetWithEndpointFallback<ClassicTestnetBlockPayload>(
      `${lcd}/cosmos/base/tendermint/v1beta1/blocks/${height}`,
      {},
      fallbackBases
    ),
    axiosGetWithEndpointFallback<ClassicTestnetTxPayload>(
      `${lcd}/cosmos/tx/v1beta1/txs`,
      {
        params: {
          query: `tx.height=${height}`,
          "pagination.limit": "100"
        }
      },
      fallbackBases
    ),
    axiosGetWithEndpointFallback<{
      validators?: ClassicTestnetValidator[];
    }>(
      `${lcd}/cosmos/staking/v1beta1/validators`,
      {
        params: {
          status: "BOND_STATUS_BONDED",
          "pagination.limit": "200"
        }
      },
      fallbackBases
    )
  ]);

  const header = blockResponse.data?.block?.header;
  const proposerAddress = header?.proposer_address
    ? bytesToHex(base64ToBytes(header.proposer_address))
    : undefined;
  const validators = validatorsResponse.data?.validators ?? [];
  const addresses = await Promise.all(
    validators.map(validator =>
      consensusAddress(validator.consensus_pubkey?.key)
    )
  );
  const proposerIndex = addresses.findIndex(
    address => address === proposerAddress
  );
  const proposer = validators[proposerIndex];

  return {
    chainId: header?.chain_id ?? chainID,
    height: Number(header?.height ?? height),
    timestamp: header?.time ?? "",
    proposer: {
      moniker: proposer?.description?.moniker ?? "Unknown validator",
      operatorAddress: proposer?.operator_address ?? ""
    },
    txs: normalizeClassicTestnetTxs(txResponse.data, chainID)
  };
};

export const fetchClassicTestnetBlock = (
  lcd: string,
  chainID: string,
  height: string
) => fetchCosmosBlock(lcd, chainID, height);
