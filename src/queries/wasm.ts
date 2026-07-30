import { useQuery } from "@tanstack/react-query";
import { ContractInfo } from "@terra-money/terra.js";
import { useCurrentChain } from "../contexts/ChainsContext";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "./endpointFallback";

const useContractInfo = (address: string, enabled = true) => {
  const { lcd, chainID } = useCurrentChain();
  return useQuery({
    queryKey: ["contractInfo", address, lcd, chainID],
    queryFn: async () => {
      const fallbackBases = getLcdFallbackBases(lcd, chainID);
      const [infoResponse, historyResponse] = await Promise.all([
        axiosGetWithEndpointFallback<{
          contract_info?: {
            code_id?: string;
            creator?: string;
            admin?: string;
            label?: string;
          };
        }>(`${lcd}/cosmwasm/wasm/v1/contract/${address}`, {}, fallbackBases),
        axiosGetWithEndpointFallback<{
          entries?: Array<{ msg?: object }>;
        }>(
          `${lcd}/cosmwasm/wasm/v1/contract/${address}/history`,
          {},
          fallbackBases
        ).catch(() => undefined)
      ]);
      const info = infoResponse.data.contract_info;

      return {
        code_id: Number(info?.code_id ?? 0),
        creator: info?.creator ?? "",
        admin: info?.admin,
        label: info?.label ?? "",
        init_msg: historyResponse?.data.entries?.[0]?.msg
      } as ContractInfo;
    },
    enabled,
    retry: false
  });
};

export default useContractInfo;
