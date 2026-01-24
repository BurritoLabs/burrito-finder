import { useQuery } from "react-query";
import useLCDClient from "../hooks/useLCD";

const useContractInfo = (address: string, enabled = true) => {
  const lcd = useLCDClient();
  return useQuery(
    ["contractInfo", address, lcd.config],
    async () => await lcd.wasm.contractInfo(address),
    { enabled, retry: false }
  );
};

export default useContractInfo;
