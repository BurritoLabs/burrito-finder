import { useMemo } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import { Dictionary } from "lodash";
import { useCurrentChain } from "../contexts/ChainsContext";
import { parseCommonJsArray } from "../scripts/cjsRegistry";
import {
  axiosGetWithEndpointFallback,
  getClassicLcdFallbackBases,
  getLcdFallbackBases
} from "../queries/endpointFallback";
import { fetchMintscanAssets, fetchMintscanCw20 } from "../queries/mintscan";

const fetchAsset = async <T>(path: string) => {
  const { data } = await axios.get<T>(`https://assets.terra.dev/${path}`);
  return data;
};

const useTerraAssets = <T = any>(path: string) =>
  useQuery([path, "terraAssets"], () => fetchAsset<T>(path));

export default useTerraAssets;

export type TokenList = Dictionary<Whitelist>;
export type IBCTokenList = Dictionary<IBCWhitelist>;
export type ContractList = Dictionary<Contracts>;
export type NFTContractList = Dictionary<NFTContracts>;

type HexxagonCw20Token = {
  protocol?: string;
  symbol?: string;
  token?: string;
  icon?: string;
  decimals?: number | string;
  decimal?: number | string;
  name?: string;
};

type HexxagonCw20Contract = {
  contract?: string;
  protocol?: string;
  name?: string;
  icon?: string;
};

type Cw20TokenInfoResponse = {
  data?: {
    name?: string;
    symbol?: string;
    decimals?: number | string;
  };
};

type Cw20MarketingLogo = { url?: string } | { embedded?: unknown } | null;

type Cw20MarketingInfoResponse = {
  data?: {
    logo?: Cw20MarketingLogo;
  };
};

type IbcTraceResponse = {
  denom_trace?: {
    path?: string;
    base_denom?: string;
  };
};

type BankMetadataResponse = {
  metadata?: {
    base?: string;
    display?: string;
    name?: string;
    symbol?: string;
    uri?: string;
    denom_units?: Array<{
      denom?: string;
      exponent?: number;
    }>;
  };
};

type LaunchRegistryLaunch = {
  id: number;
  token_contract?: string;
};

const HEXXAGON_REGISTRY_URL =
  "https://raw.githubusercontent.com/hexxagon-io/chain-registry/main";
const LOCAL_CW20_TOKEN_OVERRIDES: Record<string, Partial<Whitelist>> = {
  terra15p8su45k45axng8ue59rl6zph4at27s49u3agr6uqrx3dhcxpg3qt0ekdt: {
    symbol: "DO",
    name: "DO",
    protocol: "DO",
    icon: "/system/do-cookie.jpg"
  }
};
const LAUNCHPAD_REGISTRY_ADDRESS =
  process.env.REACT_APP_LAUNCHPAD_REGISTRY_ADDRESS?.trim();
const isLaunchRegistryConfigured = Boolean(LAUNCHPAD_REGISTRY_ADDRESS);

const CW20_TOKEN_INFO_CACHE_TTL = 24 * 60 * 60 * 1000;
const IBC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const normalizeAddress = (address?: string) =>
  address?.trim().toLowerCase() ?? "";

const normalizeIbcHash = (denom: string) =>
  denom
    .replace(/^ibc\//i, "")
    .trim()
    .toUpperCase();

const fetchHexxagonArray = async <T>(path: string): Promise<T[]> => {
  const { data } = await axios.get<string>(`${HEXXAGON_REGISTRY_URL}/${path}`, {
    transformResponse: value => value
  });
  return parseCommonJsArray<T>(data, "hexxagon CJS");
};

const safeIcon = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\/whitelist\.anchorprotocol\.com\//i.test(trimmed)) {
    return undefined;
  }
  if (trimmed.startsWith("/") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
};

const parseDecimals = (value: number | string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const loadTimedCache = <T>(key: string, ttl: number): T | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (!parsed?.ts || Date.now() - parsed.ts > ttl) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
};

const saveTimedCache = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore localStorage failures.
  }
};

const mergeCw20TokenMetadata = ({
  contract,
  fallback,
  onChain
}: {
  contract: string;
  fallback?: Whitelist;
  onChain?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    icon?: string;
  };
}): Whitelist => {
  const localOverride = LOCAL_CW20_TOKEN_OVERRIDES[contract];
  const symbol =
    localOverride?.symbol?.trim() ||
    fallback?.symbol?.trim() ||
    onChain?.symbol?.trim() ||
    contract.slice(0, 6).toUpperCase();
  const name =
    localOverride?.name?.trim() ||
    fallback?.name?.trim() ||
    fallback?.protocol?.trim() ||
    onChain?.name?.trim() ||
    onChain?.symbol?.trim() ||
    symbol;

  return {
    token: contract,
    symbol,
    name,
    protocol:
      localOverride?.protocol?.trim() || fallback?.protocol?.trim() || name,
    icon: safeIcon(localOverride?.icon ?? fallback?.icon ?? onChain?.icon),
    decimals:
      localOverride?.decimals ?? onChain?.decimals ?? fallback?.decimals ?? 6
  };
};

const extractCw20MarketingLogo = (logo?: Cw20MarketingLogo) => {
  if (!logo || typeof logo !== "object" || !("url" in logo)) return undefined;
  return safeIcon(logo.url);
};

const getDecimalsFromMetadata = (
  metadata?: BankMetadataResponse["metadata"]
) => {
  if (!metadata?.denom_units?.length) return undefined;
  const display = metadata.display;
  const displayUnit = metadata.denom_units.find(unit => unit.denom === display);
  if (displayUnit && Number.isFinite(displayUnit.exponent)) {
    return Number(displayUnit.exponent);
  }
  const nonZero = metadata.denom_units.find(
    unit => Number.isFinite(unit.exponent) && Number(unit.exponent) > 0
  );
  return nonZero && Number.isFinite(nonZero.exponent)
    ? Number(nonZero.exponent)
    : undefined;
};

const deriveSymbolFromDenom = (denom?: string) => {
  if (!denom) return "IBC";
  if (denom === "uluna") return "LUNC";
  if (denom === "uusd") return "USTC";
  if (denom.startsWith("u")) {
    const base = denom.slice(1);
    if (base.length === 3) return `${base.slice(0, 2).toUpperCase()}TC`;
    return base.toUpperCase();
  }
  return (denom.split("/").pop() ?? denom).toUpperCase();
};

const fetchCw20TokenInfos = async (
  lcd: string,
  contracts: string[],
  fallback: Record<string, Whitelist> = {},
  fallbackBases: string[] = [lcd]
) => {
  const normalized = Array.from(
    new Set(contracts.map(normalizeAddress).filter(Boolean))
  );
  if (!normalized.length) return {};

  const results: Record<string, Whitelist> = {};
  const missing: string[] = [];

  normalized.forEach(contract => {
    const cached = loadTimedCache<{
      name?: string;
      symbol?: string;
      decimals?: number;
      icon?: string;
    }>(`cw20TokenInfo:v2:${contract}`, CW20_TOKEN_INFO_CACHE_TTL);
    if (cached) {
      results[contract] = mergeCw20TokenMetadata({
        contract,
        fallback: fallback[contract],
        onChain: cached
      });
      return;
    }
    missing.push(contract);
  });

  let index = 0;
  const limit = 8;
  const workers = Array.from(
    { length: Math.min(limit, missing.length) },
    async () => {
      while (index < missing.length) {
        const current = index;
        index += 1;
        const contract = missing[current];
        try {
          const query = btoa(JSON.stringify({ token_info: {} }));
          const { data } =
            await axiosGetWithEndpointFallback<Cw20TokenInfoResponse>(
              `${lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${query}`,
              {},
              fallbackBases
            );
          const tokenInfo = data?.data;
          const symbol = tokenInfo?.symbol?.trim();
          const name = tokenInfo?.name?.trim();
          const decimals = parseDecimals(tokenInfo?.decimals);
          let icon: string | undefined;

          try {
            const marketingQuery = btoa(JSON.stringify({ marketing_info: {} }));
            const marketing =
              await axiosGetWithEndpointFallback<Cw20MarketingInfoResponse>(
                `${lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${marketingQuery}`,
                {},
                fallbackBases
              );
            icon = extractCw20MarketingLogo(marketing.data?.data?.logo);
          } catch {
            icon = undefined;
          }

          const onChain = { symbol, name, decimals, icon };
          if (!symbol && !name && decimals === undefined && !icon) continue;

          saveTimedCache(`cw20TokenInfo:v2:${contract}`, onChain);
          results[contract] = mergeCw20TokenMetadata({
            contract,
            fallback: fallback[contract],
            onChain
          });
        } catch {
          // Ignore per-contract failures so one bad contract cannot hide others.
        }
      }
    }
  );

  await Promise.all(workers);
  return results;
};

const fetchIbcTraceToken = async (
  lcd: string,
  hash: string,
  fallbackBases: string[] = [lcd]
): Promise<IBCWhitelist | undefined> => {
  const normalizedHash = normalizeIbcHash(hash);
  const cached = loadTimedCache<IBCWhitelist>(
    `ibcTrace:v1:${normalizedHash}`,
    IBC_CACHE_TTL
  );
  if (cached) return cached;

  const { data } = await axiosGetWithEndpointFallback<IbcTraceResponse>(
    `${lcd}/ibc/apps/transfer/v1/denom_traces/${normalizedHash}`,
    {},
    fallbackBases
  );
  const trace = data?.denom_trace;
  const baseDenom = trace?.base_denom;
  if (!baseDenom) return undefined;

  let metadata: BankMetadataResponse["metadata"] | undefined;
  try {
    const metadataResponse =
      await axiosGetWithEndpointFallback<BankMetadataResponse>(
        `${lcd}/cosmos/bank/v1beta1/denoms_metadata/${encodeURIComponent(
          baseDenom
        )}`,
        {},
        fallbackBases
      );
    metadata = metadataResponse.data?.metadata;
  } catch {
    metadata = undefined;
  }

  const symbol = metadata?.symbol?.trim() || deriveSymbolFromDenom(baseDenom);
  const token: IBCWhitelist = {
    denom: `ibc/${normalizedHash}`,
    base_denom: baseDenom,
    symbol,
    name: metadata?.name?.trim() || symbol,
    icon: safeIcon(metadata?.uri),
    decimals: getDecimalsFromMetadata(metadata) ?? 6,
    path: trace?.path
  };

  saveTimedCache(`ibcTrace:v1:${normalizedHash}`, token);
  return token;
};

const queryContractSmart = async <T>(
  lcd: string,
  contract: string,
  query: object
) => {
  const encoded = btoa(JSON.stringify(query));
  const { data } = await axiosGetWithEndpointFallback<{ data?: T }>(
    `${lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`,
    {},
    getClassicLcdFallbackBases(lcd)
  );
  return data?.data as T;
};

export const useLaunchpadCw20Contracts = () => {
  const { lcd, chainID } = useCurrentChain();
  const isClassic = chainID.startsWith("columbus");

  return useQuery(
    ["launchpad-cw20-contracts", lcd, chainID, LAUNCHPAD_REGISTRY_ADDRESS],
    async () => {
      if (!LAUNCHPAD_REGISTRY_ADDRESS || !isClassic) return [];
      const contracts = new Set<string>();
      const limit = 100;
      let startAfter: number | undefined;

      for (let page = 0; page < 10; page += 1) {
        const query: {
          launches: { limit: number; start_after?: number };
        } = { launches: { limit } };
        if (typeof startAfter === "number") {
          query.launches.start_after = startAfter;
        }

        const response = await queryContractSmart<{
          launches?: LaunchRegistryLaunch[];
        }>(lcd, LAUNCHPAD_REGISTRY_ADDRESS, query);
        const launches = response?.launches ?? [];
        launches.forEach(launch => {
          const contract = normalizeAddress(launch.token_contract);
          if (contract) contracts.add(contract);
        });
        if (launches.length < limit) break;
        startAfter = launches[launches.length - 1]?.id;
        if (typeof startAfter !== "number") break;
      }

      return Array.from(contracts);
    },
    {
      enabled: isLaunchRegistryConfigured && isClassic,
      staleTime: 5 * 60 * 1000
    }
  );
};

export const useIBCWhitelist = (denoms?: string[]): IBCTokenList => {
  const chain = useCurrentChain();
  const { lcd, chainID } = chain;
  const isClassic = chainID.startsWith("columbus");
  const fallbackBases = getLcdFallbackBases(lcd, chainID);
  const { data } = useQuery(["IBCWhitelist", chain], () =>
    fetchAsset<Dictionary<IBCTokenList>>("ibc/tokens.json")
  );
  const { data: mintscanAssets } = useQuery(
    ["mintscan-assets", chainID],
    fetchMintscanAssets,
    {
      enabled: chainID === "phoenix-1",
      staleTime: 6 * 60 * 60 * 1000,
      retry: false
    }
  );

  const base = useMemo(() => {
    const mintscanIbc = (mintscanAssets ?? []).reduce<IBCTokenList>(
      (acc, asset) => {
        if (asset.type !== "ibc" || !asset.denom?.startsWith("ibc/")) {
          return acc;
        }
        const hash = normalizeIbcHash(asset.denom);
        const symbol = asset.symbol?.trim() || "IBC";
        acc[hash] = {
          denom: `ibc/${hash}`,
          base_denom: asset.ibc_info?.counterparty?.denom ?? asset.denom,
          symbol,
          name: asset.name?.trim() || symbol,
          icon: safeIcon(asset.image),
          decimals: parseDecimals(asset.decimals) ?? 6,
          path: asset.ibc_info?.path
        };
        return acc;
      },
      {}
    );
    return {
      ...mintscanIbc,
      ...(pickChainAssets(data, chain.name, chain.chainID) ?? {})
    };
  }, [chain.chainID, chain.name, data, mintscanAssets]);
  const hashes = Array.from(
    new Set(
      (denoms ?? [])
        .filter(denom => denom?.startsWith("ibc/"))
        .map(normalizeIbcHash)
        .filter(Boolean)
    )
  );
  const missingHashes = hashes.filter(hash => !base[hash]);

  const { data: resolved } = useQuery(
    ["IBCWhitelistResolved", lcd, missingHashes.join(",")],
    async () => {
      const entries = await Promise.all(
        missingHashes.map(async hash => {
          const token = await fetchIbcTraceToken(lcd, hash, fallbackBases);
          return token ? ([hash, token] as const) : undefined;
        })
      );
      return Object.fromEntries(
        entries.filter(Boolean) as [string, IBCWhitelist][]
      );
    },
    {
      enabled: missingHashes.length > 0 && !isClassic,
      staleTime: 24 * 60 * 60 * 1000
    }
  );

  return useMemo(() => ({ ...base, ...(resolved ?? {}) }), [base, resolved]);
};

const pickChainAssets = <T>(
  data: Dictionary<T> | undefined,
  name: string,
  chainID: string
) => {
  if (!data) return undefined;
  if (data[name]) return data[name];
  if (data[chainID]) return data[chainID];
  const loweredName = name.toLowerCase();
  const loweredChain = chainID.toLowerCase();
  const match = Object.keys(data).find(
    key =>
      key.toLowerCase() === loweredName || key.toLowerCase() === loweredChain
  );
  if (match) return data[match];
  return (
    data.classic ?? data["columbus-5"] ?? data.mainnet ?? data["phoenix-1"]
  );
};

export const useWhitelist = (contracts?: string[]) => {
  const { name, chainID, lcd } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<TokenList>>("cw20/tokens.json");
  const { data: mintscanCw20 } = useQuery(
    ["mintscan-cw20", chainID],
    fetchMintscanCw20,
    {
      enabled: chainID === "phoenix-1",
      staleTime: 6 * 60 * 60 * 1000,
      retry: false
    }
  );
  const { data: hexxagonTokens } = useQuery(
    ["hexxagon-cw20-tokens", chainID],
    async () => {
      if (!chainID.startsWith("columbus")) return {};
      const tokens = await fetchHexxagonArray<HexxagonCw20Token>(
        "cw20/tokens/mainnet/terra.js"
      );
      return tokens.reduce<Record<string, Whitelist>>((acc, token) => {
        const address = normalizeAddress(token.token);
        const symbol = token.symbol?.trim();
        if (!address || !symbol || address.startsWith("ibc/")) return acc;
        const localOverride = LOCAL_CW20_TOKEN_OVERRIDES[address];
        acc[address] = {
          token: address,
          symbol: localOverride?.symbol?.trim() || symbol,
          name: localOverride?.name?.trim() || token.name?.trim() || symbol,
          protocol:
            localOverride?.protocol?.trim() ||
            token.protocol?.trim() ||
            token.name?.trim() ||
            symbol,
          icon: safeIcon(localOverride?.icon ?? token.icon),
          decimals:
            localOverride?.decimals ??
            parseDecimals(token.decimals ?? token.decimal) ??
            6
        };
        return acc;
      }, {});
    },
    { staleTime: 60 * 60 * 1000 }
  );

  const base = useMemo(() => {
    const mintscanTokens = (mintscanCw20 ?? []).reduce<TokenList>(
      (acc, asset) => {
        const address = normalizeAddress(asset.contract);
        const symbol = asset.symbol?.trim();
        if (!address || !symbol) return acc;
        acc[address] = {
          token: address,
          symbol,
          name: asset.name?.trim() || symbol,
          protocol: asset.name?.trim() || symbol,
          icon: safeIcon(asset.image),
          decimals: parseDecimals(asset.decimals) ?? 6
        };
        return acc;
      },
      {}
    );
    return {
      ...mintscanTokens,
      ...(pickChainAssets(data, name, chainID) ?? {}),
      ...(hexxagonTokens ?? {})
    };
  }, [chainID, data, hexxagonTokens, mintscanCw20, name]);
  const normalizedContracts = Array.from(
    new Set((contracts ?? []).map(normalizeAddress).filter(Boolean))
  );
  const missingContracts = normalizedContracts.filter(
    contract => !base[contract]
  );
  const { data: resolved } = useQuery(
    ["cw20-token-info-resolved", lcd, missingContracts.join(",")],
    () =>
      fetchCw20TokenInfos(
        lcd,
        missingContracts,
        base,
        getLcdFallbackBases(lcd, chainID)
      ),
    {
      enabled: missingContracts.length > 0,
      staleTime: 24 * 60 * 60 * 1000
    }
  );

  return useMemo(() => ({ ...base, ...(resolved ?? {}) }), [base, resolved]);
};

export const useContracts = () => {
  const { name, chainID } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<ContractList>>(
    "cw20/contracts.json"
  );
  const { data: hexxagonContracts } = useQuery(
    ["hexxagon-cw20-contracts", chainID],
    async () => {
      if (!chainID.startsWith("columbus")) return {};
      const contracts = await fetchHexxagonArray<HexxagonCw20Contract>(
        "cw20/contracts/mainnet/terra.js"
      );
      return contracts.reduce<Record<string, Contracts>>((acc, contract) => {
        const address = normalizeAddress(contract.contract);
        if (!address) return acc;
        acc[address] = {
          protocol: contract.protocol?.trim() || undefined,
          name: contract.name?.trim() || undefined,
          icon: safeIcon(contract.icon)
        };
        return acc;
      }, {});
    },
    { staleTime: 60 * 60 * 1000 }
  );

  return useMemo(
    () => ({
      ...(pickChainAssets(data, name, chainID) ?? {}),
      ...(hexxagonContracts ?? {})
    }),
    [chainID, data, hexxagonContracts, name]
  );
};

export const useNFTContracts = () => {
  const { name, chainID } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<NFTContractList>>(
    "cw721/contracts.json"
  );
  return pickChainAssets(data, name, chainID);
};
