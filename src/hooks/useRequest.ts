import { useQuery } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { useCurrentChain } from "../contexts/ChainsContext";

interface Props extends FetchProps {
  enabled?: boolean;
}

/* hook */
const useRequest = <T>({ url, params, enabled }: Props) => {
  const { chainID } = useCurrentChain();
  const result = useQuery({
    queryKey: ["fetch", url, params, chainID, enabled],

    queryFn: async () => {
      const { data } = await apiClient.get<T>(url, { params });
      return data;
    },

    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5
  });

  return result;
};

export default useRequest;
