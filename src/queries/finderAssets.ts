import axios from "axios";
import { BURRITO_API_URL } from "./mintscan";

export type FinderNetwork = "classic" | "mainnet";

type FinderCw20Asset = {
  contract: string;
  balance?: string;
  status: "ok" | "unavailable";
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    icon?: string;
  };
};

type FinderIbcAsset = {
  hash: string;
  status: "ok" | "unavailable";
  metadata?: {
    denom: string;
    path?: string;
    baseDenom: string;
    symbol: string;
    name: string;
    icon?: string;
    decimals: number;
  };
};

export type FinderAccountAssets = {
  network: FinderNetwork;
  cw20: FinderCw20Asset[];
  ibc: FinderIbcAsset[];
};

export const proxyAssetIcon = (url?: string) => {
  const trimmed = url?.trim();
  if (
    !trimmed ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed || undefined;
  }
  if (!/^https:\/\//i.test(trimmed)) return undefined;
  if (trimmed.startsWith(`${BURRITO_API_URL}/v1/finder/icon?`)) return trimmed;
  return `${BURRITO_API_URL}/v1/finder/icon?url=${encodeURIComponent(trimmed)}`;
};

export const fetchFinderAccountAssets = async (input: {
  network: FinderNetwork;
  address?: string;
  contracts?: string[];
  ibcDenoms?: string[];
}) => {
  const { data } = await axios.post<FinderAccountAssets>(
    `${BURRITO_API_URL}/v1/finder/account-assets`,
    {
      network: input.network,
      address: input.address,
      contracts: input.contracts ?? [],
      ibcDenoms: input.ibcDenoms ?? []
    },
    { timeout: 30000 }
  );
  return {
    ...data,
    cw20: data.cw20.map(asset => ({
      ...asset,
      metadata: asset.metadata
        ? { ...asset.metadata, icon: proxyAssetIcon(asset.metadata.icon) }
        : undefined
    })),
    ibc: data.ibc.map(asset => ({
      ...asset,
      metadata: asset.metadata
        ? { ...asset.metadata, icon: proxyAssetIcon(asset.metadata.icon) }
        : undefined
    }))
  };
};
