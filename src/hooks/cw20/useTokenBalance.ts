import { useEffect, useMemo, useState } from "react";
import { Dictionary } from "ramda";
import axios from "axios";
import alias from "./alias";
import { useCurrentChain, useIsClassic } from "../../contexts/ChainsContext";
import {
  useContracts,
  useLaunchpadCw20Contracts,
  useWhitelist
} from "../useTerraAssets";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "../../queries/endpointFallback";
import { fetchFinderAccountAssets } from "../../queries/finderAssets";

export interface Token {
  icon?: string;
  symbol: string;
  protocol?: string;
  decimals?: number;
  token?: string;
  name?: string;
}

export interface TokenBalance extends Token {
  balance: string;
  address?: string;
}

export type Tokens = Dictionary<Token>;

// classic data type is { Result: string }
// v2 data type is { contractQuery: { balance: string } }
type QueryResult = Dictionary<{
  Result: string;
  contractQuery: { balance: string };
}>;

const parseResult = (data: QueryResult, isClassic?: boolean) => {
  const removeEmptyObject = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== null)
  );

  const result = isClassic
    ? Object.entries(removeEmptyObject).reduce(
        (acc, [token, { Result }]) => ({
          ...acc,
          [token]: JSON.parse(Result).balance
        }),
        {}
      )
    : Object.entries(removeEmptyObject).reduce(
        (acc, [token, { contractQuery }]) => ({
          ...acc,
          [token]: contractQuery.balance || "0"
        }),
        {}
      );

  return result;
};

const chunkEntries = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const buildWhitelistSignature = (whitelist: Tokens) => {
  const keys = Object.keys(whitelist)
    .map(key => key.trim().toLowerCase())
    .filter(Boolean)
    .sort();

  let hash = 0;
  keys.forEach(key => {
    for (let index = 0; index < key.length; index += 1) {
      hash = (hash * 33 + key.charCodeAt(index)) >>> 0;
    }
  });

  return `${keys.length}:${hash.toString(16)}`;
};

const useTokenBalance = (
  address: string
): { loading: boolean; whitelist?: Tokens; list?: TokenBalance[] } => {
  const [result, setResult] = useState<Dictionary<string>>();
  const [resolvedMetadata, setResolvedMetadata] = useState<
    Dictionary<Partial<Token>>
  >({});

  const isClassic = useIsClassic();
  const { data: launchpadContracts = [] } = useLaunchpadCw20Contracts();
  const whitelist = useWhitelist(isClassic ? launchpadContracts : undefined);
  const contracts = useContracts();
  const mergedWhitelist = useMemo(() => {
    if (isClassic) {
      return whitelist ?? {};
    }

    return {
      ...(contracts
        ? Object.fromEntries(
            Object.entries(contracts).map(([address, contract]) => [
              address,
              {
                symbol: contract.name ?? contract.protocol ?? address,
                protocol: contract.protocol ?? "contract",
                icon: contract.icon
              }
            ])
          )
        : {}),
      ...(whitelist ?? {})
    };
  }, [contracts, whitelist, isClassic]);
  const { mantle, hive, lcd, chainID } = useCurrentChain();

  useEffect(() => {
    if (!address) {
      setResult(undefined);
      return;
    }

    if (address && Object.keys(mergedWhitelist).length) {
      const whitelistSignature = buildWhitelistSignature(mergedWhitelist);
      const cacheKey = `cw20balance:v2:${address}:${
        isClassic ? "classic" : "mainnet"
      }:${whitelistSignature}`;
      const invalidKey = `cw20invalid:v2:${isClassic ? "classic" : "mainnet"}`;
      const load = async () => {
        try {
          setResult(undefined);
          setResolvedMetadata({});
          if (typeof window !== "undefined") {
            const cached = window.localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached) as {
                ts: number;
                data: Dictionary<string>;
              };
              if (parsed && Date.now() - parsed.ts < 5 * 60 * 1000) {
                setResult(parsed.data);
                return;
              }
            }
          }

          let invalidContracts: Record<string, boolean> = {};
          if (typeof window !== "undefined") {
            const cachedInvalid = window.localStorage.getItem(invalidKey);
            if (cachedInvalid) {
              const parsedInvalid = JSON.parse(cachedInvalid) as {
                ts: number;
                data: Record<string, boolean>;
              };
              if (
                parsedInvalid &&
                Date.now() - parsedInvalid.ts < 5 * 60 * 1000
              ) {
                invalidContracts = parsedInvalid.data ?? {};
              }
            }
          }

          const entries = Object.entries(mergedWhitelist).filter(
            ([contract]) => !invalidContracts[contract]
          );
          const graphUri = isClassic ? undefined : hive ?? mantle;
          let parsed: Dictionary<string> = {};

          try {
            const aggregate = await fetchFinderAccountAssets({
              network: isClassic ? "classic" : "mainnet",
              address,
              contracts: entries.map(([contract]) => contract)
            });
            const metadata: Dictionary<Partial<Token>> = {};
            aggregate.cw20.forEach(asset => {
              if (asset.status !== "ok") return;
              if (asset.balance !== undefined) {
                parsed[asset.contract] = asset.balance;
              }
              if (asset.metadata) metadata[asset.contract] = asset.metadata;
            });
            setResolvedMetadata(metadata);
          } catch {
            // The existing graph/LCD path below remains the client fallback.
          }

          const graphEntries = entries.filter(
            ([contract]) => parsed[contract] === undefined
          );
          const chunks = chunkEntries(graphEntries, 49);
          const queries = chunks.map(chunk =>
            alias(
              chunk.map(([key]) => ({
                contract: key,
                msg: { balance: { address } },
                isClassic,
                address
              }))
            )
          );

          if (graphUri && queries.length) {
            const fetchChunk = async (query: string): Promise<QueryResult> => {
              let lastError: unknown;
              for (let attempt = 0; attempt < 2; attempt += 1) {
                try {
                  const { data } = await axios.post<{
                    data?: QueryResult;
                  }>(graphUri, { query });
                  return data.data ?? {};
                } catch (error) {
                  lastError = error;
                }
              }
              if (lastError) {
                return {};
              }
              return {};
            };

            const limit = 3;
            let index = 0;
            const results: QueryResult[] = [];
            const workers = Array.from(
              { length: Math.min(limit, queries.length) },
              async () => {
                while (index < queries.length) {
                  const current = index;
                  index += 1;
                  results[current] = await fetchChunk(queries[current]);
                }
              }
            );

            await Promise.all(workers);

            const merged = results.reduce<QueryResult>(
              (acc, data) => Object.assign(acc, data),
              {}
            );

            parsed = { ...parsed, ...parseResult(merged, isClassic) };
          }

          const missingBalanceEntries = entries.filter(
            ([contract]) => parsed[contract] === undefined
          );
          if (lcd && missingBalanceEntries.length) {
            const lcdResults: Dictionary<string> = {};
            const limit = 4;
            let lcdIndex = 0;
            const workers = Array.from(
              { length: Math.min(limit, missingBalanceEntries.length) },
              async () => {
                while (lcdIndex < missingBalanceEntries.length) {
                  const current = lcdIndex;
                  lcdIndex += 1;
                  const [contract] = missingBalanceEntries[current];
                  try {
                    const query = btoa(
                      JSON.stringify({ balance: { address } })
                    );
                    const { data } = await axiosGetWithEndpointFallback<{
                      data?: { balance?: string };
                    }>(
                      `${lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${query}`,
                      {},
                      getLcdFallbackBases(lcd, chainID)
                    );
                    lcdResults[contract] = data?.data?.balance ?? "0";
                  } catch (error: any) {
                    const message =
                      error?.response?.data?.message ?? error?.message ?? "";
                    if (
                      typeof message === "string" &&
                      message.includes("no such contract")
                    ) {
                      invalidContracts[contract] = true;
                    }
                    lcdResults[contract] = "0";
                  }
                }
              }
            );
            await Promise.all(workers);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                invalidKey,
                JSON.stringify({ ts: Date.now(), data: invalidContracts })
              );
            }
            parsed = { ...lcdResults, ...parsed };
          }

          setResult(parsed);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({ ts: Date.now(), data: parsed })
            );
          }
        } catch (error) {
          setResult({});
        }
      };

      load();
    }
  }, [address, mergedWhitelist, lcd, mantle, hive, isClassic, chainID]);

  return {
    loading: Object.keys(mergedWhitelist).length > 0 && !result,
    whitelist: mergedWhitelist,
    list:
      result &&
      mergedWhitelist &&
      Object.entries(result).map(([token, balance]) => ({
        ...mergedWhitelist[token],
        ...(resolvedMetadata[token] ?? {}),
        balance,
        address: token
      }))
  };
};

export default useTokenBalance;
