import { Coin, Coins } from "@terra-money/terra.js";
import { useQuery } from "@tanstack/react-query";
import useLCDClient from "../hooks/useLCD";
import useRequest from "../hooks/useRequest";
import { RefetchOptions } from "./query";

// validator page

type Reward = { rewards: { rewards: Coin[] } };
export const useRewards = (address: string) => {
  const lcd = useLCDClient();
  //TODO Fix
  const { data } = useRequest<Reward>({
    url: `${lcd.config.URL}/cosmos/distribution/v1beta1/validators/${address}/outstanding_rewards`
  });
  return data?.rewards.rewards;
};

export const useCommission = (address: string) => {
  const lcd = useLCDClient();
  const { data } = useQuery({
    queryKey: ["Commission", lcd.config],
    queryFn: async () => await lcd.distribution.validatorCommission(address)
  });

  return data;
};

// address page

export const useStakingRewards = (address: string) => {
  const lcd = useLCDClient();

  return useQuery({
    queryKey: ["stakingRewards", lcd.config, address],

    queryFn: async () => {
      if (!address) return { total: new Coins(), rewards: {} };
      return await lcd.distribution.rewards(address);
    },

    ...RefetchOptions.INFINITY
  });
};
