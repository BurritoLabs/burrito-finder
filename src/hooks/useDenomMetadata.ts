import { useQuery } from "react-query";
import { useCurrentChain } from "../contexts/ChainsContext";
import { RefetchOptions } from "../queries/query";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "../queries/endpointFallback";

type DenomMetadata = {
  description: string;
  denom_units: Array<{
    denom: string;
    exponent: number;
    aliases: string[];
  }>;
  base: string;
  display: string;
  name: string;
  symbol: string;
  uri: string;
  uri_hash: string;
};

const DEFAULT_LIMIT = 1000;

const useDenomMetadata = (enabled: boolean = true) => {
  const { lcd, chainID } = useCurrentChain();

  const { data } = useQuery(
    ["denomMetadata", lcd],
    async () => {
      const { data: response } = await axiosGetWithEndpointFallback<{
        metadatas: DenomMetadata[];
      }>(
        `${lcd}/cosmos/bank/v1beta1/denoms_metadata`,
        { params: { "pagination.limit": DEFAULT_LIMIT } },
        getLcdFallbackBases(lcd, chainID)
      );

      const map = new Map<string, DenomMetadata>();
      response?.metadatas?.forEach(metadata => {
        if (metadata?.base) {
          map.set(metadata.base, metadata);
        }
      });

      return map;
    },
    { ...RefetchOptions.INFINITY, enabled, staleTime: 60 * 60 * 1000 }
  );

  return data;
};

export default useDenomMetadata;
