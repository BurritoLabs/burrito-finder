import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dictionary } from "ramda";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import alias from "./alias";
import { useCurrentChain, useIsClassic } from "../../contexts/ChainsContext";
import { useContracts, useWhitelist } from "../useTerraAssets";

export interface Token {
  icon?: string;
  symbol: string;
  protocol: string;
  decimals?: number;
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

const useTokenBalance = (
  address: string
): { loading: boolean; whitelist?: Tokens; list?: TokenBalance[] } => {
  const [result, setResult] = useState<Dictionary<string>>();

  const isClassic = useIsClassic();
  const whitelist = useWhitelist();
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
  const { mantle, hive, lcd } = useCurrentChain();

  useEffect(() => {
    if (address && Object.keys(mergedWhitelist).length) {
      const cacheKey = `cw20balance:${address}:${
        isClassic ? "classic" : "mainnet"
      }`;
      const invalidKey = `cw20invalid:${isClassic ? "classic" : "mainnet"}`;
      const load = async () => {
        try {
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
          const chunkSize = 49;
          const chunks = chunkEntries(entries, chunkSize);
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

          const graphUri = isClassic ? undefined : hive ?? mantle;
          let parsed: Dictionary<string> = {};

          if (graphUri) {
            const client = new ApolloClient({
              uri: graphUri,
              cache: new InMemoryCache()
            });

            const fetchChunk = async (
              query: typeof queries[number]
            ): Promise<QueryResult> => {
              let lastError: unknown;
              for (let attempt = 0; attempt < 2; attempt += 1) {
                try {
                  const { data } = await client.query({
                    query,
                    errorPolicy: "ignore"
                  });
                  return data as QueryResult;
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

            parsed = parseResult(merged, isClassic);
          }

          if (
            isClassic &&
            lcd &&
            Object.keys(parsed).length === 0 &&
            entries.length
          ) {
            const lcdResults: Dictionary<string> = {};
            const limit = 4;
            let lcdIndex = 0;
            const workers = Array.from(
              { length: Math.min(limit, entries.length) },
              async () => {
                while (lcdIndex < entries.length) {
                  const current = lcdIndex;
                  lcdIndex += 1;
                  const [contract] = entries[current];
                  try {
                    const query = btoa(
                      JSON.stringify({ balance: { address } })
                    );
                    const { data } = await axios.get(
                      `${lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${query}`
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
            setResult(lcdResults);
            return;
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
  }, [address, mergedWhitelist, lcd, mantle, hive, isClassic]);

  return {
    loading: Object.keys(mergedWhitelist).length > 0 && !result,
    whitelist: mergedWhitelist,
    list:
      result &&
      mergedWhitelist &&
      Object.entries(result).map(([token, balance]) => ({
        ...mergedWhitelist[token],
        balance,
        address: token
      }))
  };
};

export default useTokenBalance;
