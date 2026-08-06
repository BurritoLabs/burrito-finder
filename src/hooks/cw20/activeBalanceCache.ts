import type { Token, Tokens } from "./useTokenBalance";

const ACTIVE_BALANCE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const ACTIVE_BALANCE_CACHE_VERSION = "v1";

type ActiveBalanceCache = {
  ts: number;
  contracts: string[];
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

const cacheKey = (address: string, chainID: string) =>
  `cw20balance-active:${ACTIVE_BALANCE_CACHE_VERSION}:${normalize(address)}:${normalize(chainID)}`;

const isContractAddress = (value: string) => /^terra1[0-9a-z]+$/.test(value);

export const loadActiveCw20Contracts = (
  address: string,
  chainID: string
): string[] => {
  if (typeof window === "undefined" || !address || !chainID) return [];

  const key = cacheKey(address, chainID);
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(key) ?? "null"
    ) as ActiveBalanceCache | null;
    if (!cached || Date.now() - cached.ts >= ACTIVE_BALANCE_CACHE_TTL) {
      window.localStorage.removeItem(key);
      return [];
    }

    return Array.from(
      new Set(
        cached.contracts
          .map(normalize)
          .filter(contract => isContractAddress(contract))
      )
    );
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
};

export const savePositiveCw20Contracts = (
  address: string,
  chainID: string,
  balances: Record<string, string>
) => {
  if (typeof window === "undefined" || !address || !chainID) return;

  const positive = Object.entries(balances)
    .filter(([, balance]) => {
      try {
        return BigInt(balance) > 0n;
      } catch {
        return false;
      }
    })
    .map(([contract]) => normalize(contract))
    .filter(contract => isContractAddress(contract));

  if (!positive.length) return;

  const contracts = Array.from(
    new Set([...loadActiveCw20Contracts(address, chainID), ...positive])
  );
  window.localStorage.setItem(
    cacheKey(address, chainID),
    JSON.stringify({ ts: Date.now(), contracts } satisfies ActiveBalanceCache)
  );
};

const placeholder = (contract: string): Token => ({
  symbol: `CW20-${contract.slice(-6).toUpperCase()}`,
  name: "CW20 token",
  protocol: "wallet balance",
  decimals: 6,
  token: contract
});

export const includeActiveCw20Contracts = (
  whitelist: Tokens,
  contracts: string[]
): Tokens => {
  const result = { ...whitelist };
  contracts.forEach(value => {
    const contract = normalize(value);
    if (isContractAddress(contract) && !result[contract]) {
      result[contract] = placeholder(contract);
    }
  });
  return result;
};
