import { useQuery } from "@tanstack/react-query";
import { useIsClassic } from "../contexts/ChainsContext";
import useLCDClient from "../hooks/useLCD";
import { RefetchOptions } from "./query";

export const useOracleParams = () => {
  const lcd = useLCDClient();
  const isClassic = useIsClassic();
  return useQuery({
    queryKey: ["oracleParams", lcd.config, isClassic],
    queryFn: () => lcd.oracle.parameters(),
    enabled: isClassic,
    ...RefetchOptions.INFINITY
  });
};

export const useDenoms = () => {
  const lcd = useLCDClient();
  const isClassic = useIsClassic();
  return useQuery({
    queryKey: ["oracleDenoms", lcd.config, isClassic],
    queryFn: () => lcd.oracle.activeDenoms(),
    enabled: isClassic,
    ...RefetchOptions.INFINITY
  });
};
