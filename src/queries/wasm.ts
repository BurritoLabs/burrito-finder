import { useQuery } from "@tanstack/react-query";
import useLCDClient from "../hooks/useLCD";

const useContractInfo = (address: string, enabled = true) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: ["contractInfo", address, lcd.config],
    queryFn: async () => await lcd.wasm.contractInfo(address),
    enabled,
    retry: false
  });
};

export default useContractInfo;
