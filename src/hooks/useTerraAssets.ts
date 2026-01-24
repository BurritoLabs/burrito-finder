import { useQuery } from "react-query";
import axios from "axios";
import { Dictionary } from "lodash";
import { useCurrentChain } from "../contexts/ChainsContext";
import { ASSET_URL } from "../scripts/utility";

const config = { baseURL: "https://assets.terra.dev" };

const useTerraAssets = <T = any>(path: string) =>
  useQuery([path, config, "terraAssets"], async () => {
    const { data: result } = await axios.get<T>(path, config);
    return result;
  });

export default useTerraAssets;

export type TokenList = Dictionary<Whitelist>;
export type IBCTokenList = Dictionary<IBCWhitelist>;
export type ContractList = Dictionary<Contracts>;
export type NFTContractList = Dictionary<NFTContracts>;

export const useIBCWhitelist = (): IBCTokenList => {
  const chainID = useCurrentChain();
  const { data } = useQuery(["IBCWhitelist", chainID], () =>
    axios.get(`${ASSET_URL}/ibc/tokens.json`)
  );

  return data?.data?.[chainID.name];
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

export const useWhitelist = () => {
  const { name, chainID } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<TokenList>>("cw20/tokens.json");
  return pickChainAssets(data, name, chainID);
};

export const useContracts = () => {
  const { name, chainID } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<ContractList>>(
    "cw20/contracts.json"
  );
  return pickChainAssets(data, name, chainID);
};

export const useNFTContracts = () => {
  const { name, chainID } = useCurrentChain();
  const { data } = useTerraAssets<Dictionary<NFTContractList>>(
    "cw721/contracts.json"
  );
  return pickChainAssets(data, name, chainID);
};
