import axios from "axios";
import { runtimeEnv } from "../config/runtimeEnv";

const DEFAULT_BURRITO_API_URL = "https://api.burrito.money";

export const BURRITO_API_URL = (
  runtimeEnv.burritoApiUrl || DEFAULT_BURRITO_API_URL
).replace(/\/$/, "");

export const MINTSCAN_PROXY_URL = `${BURRITO_API_URL}/v1/finder/mintscan`;
export const MINTSCAN_LCD_URL = `${MINTSCAN_PROXY_URL}/lcd`;

export type MintscanAsset = {
  type?: string;
  denom?: string;
  contract?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
  ibc_info?: {
    path?: string;
    counterparty?: {
      denom?: string;
    };
  };
};

type MintscanAssetsResponse = {
  assets?: MintscanAsset[];
};

export const fetchMintscanAssets = async () => {
  const { data } = await axios.get<MintscanAssetsResponse>(
    `${MINTSCAN_PROXY_URL}/assets`,
    { timeout: 10000 }
  );
  return data.assets ?? [];
};

export const fetchMintscanCw20 = async () => {
  const { data } = await axios.get<MintscanAssetsResponse>(
    `${MINTSCAN_PROXY_URL}/cw20`,
    { timeout: 10000 }
  );
  return data.assets ?? [];
};

export const normalizeMintscanTx = (tx: any, chainID = "phoenix-1") => {
  const typedTx = tx?.tx?.["/cosmos-tx-v1beta1-Tx"] ?? tx?.tx;
  const messages = typedTx?.body?.messages?.map((message: any) => {
    const type = message?.["@type"];
    const payloadKey = Object.keys(message ?? {}).find(key => key !== "@type");
    const payload = payloadKey ? message?.[payloadKey] : undefined;
    return payload && typeof payload === "object"
      ? { "@type": type, ...payload }
      : message;
  });

  return {
    ...tx,
    chainId: tx?.chainId ?? tx?.chain_id ?? chainID,
    tx: typedTx
      ? {
          ...typedTx,
          body: typedTx.body
            ? { ...typedTx.body, messages: messages ?? typedTx.body.messages }
            : typedTx.body
        }
      : typedTx
  };
};
