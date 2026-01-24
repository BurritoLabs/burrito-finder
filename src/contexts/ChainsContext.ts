import { useParams } from "react-router-dom";
import { createContext } from "./createContext";

export const getChains = () =>
  fetch("https://assets.terra.dev/chains.json")
    .then(res => res.json())
    .then((data: Record<string, ChainOption>) =>
      Object.values(data).map(chain => {
        if (chain.name === "mainnet") {
          return { ...chain, lcd: "https://terra-lcd.publicnode.com" };
        }

        return chain;
      })
    );

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
