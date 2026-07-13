import { useQuery } from "react-query";
import { useCurrentChain, useIsClassic } from "../contexts/ChainsContext";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "../queries/endpointFallback";
import { isIbcDenom } from "../scripts/utility";
import { useIBCWhitelist } from "./useTerraAssets";

type IbcTraceResponse = {
  denom_trace?: {
    path?: string;
    base_denom?: string;
    symbol?: string;
  };
};

const useDenomTrace = (denom = "") => {
  const { lcd, chainID } = useCurrentChain();
  const isClassic = useIsClassic();
  const hash = denom.replace("ibc/", "");
  const whitelist = useIBCWhitelist(denom ? [denom] : undefined);
  const whitelisted = whitelist?.[hash];
  const { data } = useQuery(
    ["denomTrace", hash, lcd],
    async () => {
      const { data } = await axiosGetWithEndpointFallback<IbcTraceResponse>(
        `${lcd}/ibc/apps/transfer/v1/denom_traces/${hash}`,
        {},
        getLcdFallbackBases(lcd, chainID)
      );

      return data.denom_trace;
    },
    {
      enabled: isIbcDenom(denom) && !whitelisted && !isClassic,
      retry: false
    }
  );

  return whitelisted ?? data;
};

export default useDenomTrace;
