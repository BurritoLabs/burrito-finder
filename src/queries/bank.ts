import { useQuery } from "@tanstack/react-query";
import { Coin } from "@terra-money/terra.js";
import { useCurrentChain, useIsClassic } from "../contexts/ChainsContext";
import useLCDClient from "../hooks/useLCD";
import { sortByDenom } from "../scripts/utility";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "./endpointFallback";
import { RefetchOptions } from "./query";

export const useInitialBankBalance = (address: string) => {
  const lcd = useLCDClient();
  const isClassic = useIsClassic();
  const { lcd: lcdUrl, chainID } = useCurrentChain();
  return useQuery({
    queryKey: ["bankBalance", address, isClassic, lcd.config, lcdUrl, chainID],

    queryFn: async () => {
      if (isClassic) {
        const { data } = await axiosGetWithEndpointFallback<{
          balances?: Array<{ denom: string; amount: string }>;
        }>(
          `${lcdUrl}/cosmos/bank/v1beta1/balances/${address}`,
          {},
          getLcdFallbackBases(lcdUrl, chainID)
        );
        return sortByDenom(
          (data.balances ?? []).map(
            ({ denom, amount }) => new Coin(denom, amount)
          )
        );
      }

      const [coins] = await lcd.bank.spendableBalances(address);
      const result = sortByDenom(coins.toArray());
      return result;
    },

    ...RefetchOptions.DEFAULT
  });
};
