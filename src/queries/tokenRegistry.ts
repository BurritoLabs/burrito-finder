import axios from "axios";
import { isClassicMainnetChainID } from "../contexts/ChainsContext";
import { proxyAssetIcon } from "./finderAssets";
import { BURRITO_API_URL } from "./mintscan";

type RegistryChain = "lunc" | "luna";

type VerifiedRegistryAsset = {
  chainId?: string;
  type?: "cw20" | "ibc";
  assetKey?: string;
  name?: string | null;
  symbol?: string | null;
  decimals?: number | null;
  logoUrl?: string | null;
  baseDenom?: string;
  path?: string;
};

type RegistryResponse = {
  assets?: VerifiedRegistryAsset[];
};

export type VerifiedTokenRegistry = {
  cw20: Record<string, Whitelist>;
  ibc: Record<string, IBCWhitelist>;
};

const EMPTY_REGISTRY: VerifiedTokenRegistry = { cw20: {}, ibc: {} };
const TERRA_ADDRESS = /^terra1[023456789acdefghjklmnpqrstuvwxyz]{38,90}$/;
const IBC_HASH = /^[A-F0-9]{64}$/;

const registryChainFor = (chainID: string): RegistryChain | undefined => {
  if (isClassicMainnetChainID(chainID)) return "lunc";
  if (chainID === "phoenix-1") return "luna";
  return undefined;
};

const validDecimals = (value?: number | null) =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 30
    ? Number(value)
    : 6;

const cleanText = (value?: string | null) => value?.trim() || undefined;

export const mapVerifiedRegistryAssets = (
  assets: VerifiedRegistryAsset[]
): VerifiedTokenRegistry => {
  const result: VerifiedTokenRegistry = { cw20: {}, ibc: {} };

  assets.forEach(asset => {
    if (asset.type === "cw20") {
      const contract = asset.assetKey?.trim().toLowerCase() ?? "";
      if (!TERRA_ADDRESS.test(contract)) return;
      const symbol = cleanText(asset.symbol);
      if (!symbol) return;
      result.cw20[contract] = {
        token: contract,
        symbol,
        name: cleanText(asset.name) ?? symbol,
        protocol: cleanText(asset.name) ?? symbol,
        decimals: validDecimals(asset.decimals),
        icon: proxyAssetIcon(cleanText(asset.logoUrl))
      };
      return;
    }

    if (asset.type === "ibc") {
      const hash = (asset.assetKey ?? "")
        .replace(/^ibc\//i, "")
        .trim()
        .toUpperCase();
      const symbol = cleanText(asset.symbol);
      if (!IBC_HASH.test(hash) || !symbol) return;
      result.ibc[hash] = {
        denom: `ibc/${hash}`,
        base_denom: cleanText(asset.baseDenom) ?? `ibc/${hash}`,
        symbol,
        name: cleanText(asset.name) ?? symbol,
        decimals: validDecimals(asset.decimals),
        icon: proxyAssetIcon(cleanText(asset.logoUrl)),
        path: cleanText(asset.path)
      };
    }
  });

  return result;
};

export const fetchVerifiedTokenRegistry = async (
  chainID: string
): Promise<VerifiedTokenRegistry> => {
  const chain = registryChainFor(chainID);
  if (!chain) return EMPTY_REGISTRY;

  const { data } = await axios.get<RegistryResponse>(
    `${BURRITO_API_URL}/v1/registry/assets`,
    {
      params: { chain, limit: 1000 },
      timeout: 5000
    }
  );
  return mapVerifiedRegistryAssets(data.assets ?? []);
};
