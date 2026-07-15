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
    name: "classic-testnet",
    chainID: "rebel-2",
    lcd: "https://lcd.terra-classic.hexxagon.dev",
    rpc: "https://rpc.luncblaze.com"
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

const mergeBundledChains = (chains: ChainOption[]) => {
  const bundledByName = new Map(
    FALLBACK_CHAINS.map(chain => [chain.name, chain] as const)
  );
  const merged = chains.map(chain => {
    const bundled = bundledByName.get(chain.name);
    if (!bundled) return chain;
    bundledByName.delete(chain.name);
    return {
      ...bundled,
      ...chain,
      ...(chain.name === "mainnet" ? { lcd: bundled.lcd } : {})
    };
  });

  return [...merged, ...bundledByName.values()];
};

const normalizeChains = (data: Record<string, ChainOption>) =>
  mergeBundledChains(
    Object.values(data).filter(
      chain => chain?.name && chain?.chainID && chain?.lcd
    )
  );

export const getInitialChains = () => {
  if (typeof window === "undefined") return FALLBACK_CHAINS;
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(CHAIN_CACHE_KEY) ?? "null"
    ) as { chains?: ChainOption[] } | null;
    return cached?.chains?.length
      ? mergeBundledChains(cached.chains)
      : FALLBACK_CHAINS;
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

export const useSupportsFCD = () => {
  const { chainID } = useCurrentChain();
  return chainID !== "rebel-2";
};

export const isClassicChainID = (chainID: string) =>
  chainID === "columbus-5" || chainID === "rebel-2";

export const isClassicMainnetChainID = (chainID: string) =>
  chainID === "columbus-5";

export const isClassicTestnetChainID = (chainID: string) =>
  chainID === "rebel-2";

export const useIsClassic = () => {
  const { chainID } = useCurrentChain();
  return isClassicChainID(chainID);
};
