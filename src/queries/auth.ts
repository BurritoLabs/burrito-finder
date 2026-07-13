import { useQuery } from "@tanstack/react-query";
import useLCDClient from "../hooks/useLCD";
import { RefetchOptions } from "./query";

export const useAccountInfo = (address: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: ["accountInfo", address, lcd.config],
    queryFn: async () => await lcd.auth.accountInfo(address),
    ...RefetchOptions.DEFAULT
  });
};
