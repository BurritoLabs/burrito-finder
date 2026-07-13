import { useParams } from "react-router-dom";
import { createContext } from "./createContext";

const CHAIN_CACHE_KEY = "finder:chains:v1";

export const FALLBACK_CHAINS: ChainOption[] = [
  {
    name: "mainnet",
    chainID: "phoenix-1",
    lcd: "https://terra-lcd.publicnode.com",
    api: "https://phoenix-api.terra.dev",
    hive: "https://phoenix-hive.terra.dev/graphql"
  },
  {
    name: "classic",
    chainID: "columbus-5",
    lcd: "https://terra-classic-lcd.publicnode.com",
    api: "https://terra-classic-public-api.publicnode.com",
    mantle: "https://columbus-mantle.terra.dev"
  },
  {
    name: "testnet",
    chainID: "pisco-1",
    lcd: "https://pisco-lcd.terra.dev",
    api: "https://pisco-api.terra.dev",
    hive: "https://pisco-hive.terra.dev/graphql"
  },
  {
    name: "localterra",
    chainID: "localterra",
    lcd: "http://localhost:1317",
    mantle: "http://localhost:1337"
  }
];

const normalizeChains = (data: Record<string, ChainOption>) =>
  Object.values(data)
    .filter(chain => chain?.name && chain?.chainID && chain?.lcd)
    .map(chain =>
      chain.name === "mainnet"
        ? { ...chain, lcd: "https://terra-lcd.publicnode.com" }
        : chain
    );

export const getInitialChains = () => {
  if (typeof window === "undefined") return FALLBACK_CHAINS;
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(CHAIN_CACHE_KEY) ?? "null"
    ) as { chains?: ChainOption[] } | null;
    return cached?.chains?.length ? cached.chains : FALLBACK_CHAINS;
  } catch {
    return FALLBACK_CHAINS;
  }
};

export const getChains = async () => {
  try {
    const response = await fetch("https://assets.terra.dev/chains.json", {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Chain registry HTTP ${response.status}`);
    const chains = normalizeChains(
      (await response.json()) as Record<string, ChainOption>
    );
    if (!chains.length) throw new Error("Chain registry is empty");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        CHAIN_CACHE_KEY,
        JSON.stringify({ chains, updatedAt: Date.now() })
      );
    }
    return chains;
  } catch {
    return getInitialChains();
  }
};

export const [useChains, ChainsProvider] =
  createContext<ChainOption[]>("Chains");

const useNetworkFromRouteMatch = () => {
  const { network } = useParams();
  return network;
};

export const useCurrentChain = () => {
  const chains: ChainOption[] = useChains();
  const network = useNetworkFromRouteMatch();

  const chain =
    chains.find(chain => chain.name === network || chain.chainID === network) ??
    chains.find(chain => chain.name === "classic"); // return classic for default chain

  if (!chain) {
    throw new Error("Chain is not defined");
  }

  return chain;
};

export const useFCDURL = () => {
  const chain = useCurrentChain() as ChainOption & { api?: string };
  if (chain.chainID === "phoenix-1") {
    return "https://phoenix-fcd.terra.dev";
  }
  return chain.api ?? chain.lcd.replace("lcd", "fcd");
};

export const useIsClassic = () => {
  const { chainID } = useCurrentChain();
  return chainID.startsWith("columbus");
};
