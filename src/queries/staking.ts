import { useQuery } from "@tanstack/react-query";
import { path, uniqBy } from "ramda";
/* TODO: Fix terra.js */
import { BondStatus } from "@terra-money/terra.proto/cosmos/staking/v1beta1/staking";
import { AccAddress } from "../libs/address";
import useLCDClient from "../hooks/useLCD";
import { Pagination, RefetchOptions } from "./query";

export const useValidator = (address: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, address, "validator"],
    queryFn: async () => await lcd.staking.validator(address),
    ...RefetchOptions.INFINITY
  });
};

export const useDelegations = (address: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, address, "delegations"],
    queryFn: async () => await lcd.staking.delegations(address),
    ...RefetchOptions.DEFAULT
  });
};

export const useDelegation = (address: string, validator: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, address, validator, "delegation"],

    queryFn: async () => {
      try {
        return await lcd.staking.delegation(address, validator);
      } catch (error: any) {
        const status = error?.response?.status;
        if (
          status === 404 ||
          status === 503 ||
          error?.message === "Network Error"
        ) {
          return null;
        }
        throw error;
      }
    },

    ...RefetchOptions.DEFAULT,
    retry: false
  });
};

export const useUndelegations = (address: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, address, "undelegations"],

    queryFn: async () => {
      const [undelegations] = await lcd.staking.unbondingDelegations(address);
      return undelegations;
    },

    ...RefetchOptions.DEFAULT
  });
};

export const useStakingPool = () => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, "stakingPool"],
    queryFn: async () => await lcd.staking.pool(),
    ...RefetchOptions.INFINITY
  });
};

export const useSelfDelegationAmount = (validatorAddress: string) => {
  const lcd = useLCDClient();
  return useQuery({
    queryKey: [lcd.config, validatorAddress, "selfDelegation"],

    queryFn: async () => {
      const delegator = AccAddress.fromValAddress(validatorAddress);
      let delegation;
      try {
        delegation = await lcd.staking.delegation(delegator, validatorAddress);
      } catch (error: any) {
        const status = error?.response?.status;
        if (
          status === 404 ||
          status === 503 ||
          error?.message === "Network Error"
        ) {
          return null;
        }
        throw error;
      }
      const balance = delegation?.balance;
      return balance?.amount ?? null;
    },

    ...RefetchOptions.INFINITY,
    enabled: !!validatorAddress,
    retry: false
  });
};

export const useValidators = () => {
  const lcd = useLCDClient();

  return useQuery({
    queryKey: [lcd.config, "vaidators"],

    queryFn: async () => {
      // TODO: Pagination
      // Required when the number of results exceed LAZY_LIMIT

      const [v1] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_UNBONDED],
        ...Pagination
      });

      const [v2] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_UNBONDING],
        ...Pagination
      });

      const [v3] = await lcd.staking.validators({
        status: BondStatus[BondStatus.BOND_STATUS_BONDED],
        ...Pagination
      });

      return uniqBy(path(["operator_address"]), [...v1, ...v2, ...v3]);
    },

    ...RefetchOptions.INFINITY
  });
};
