import { useQuery } from "react-query";
import { path, uniqBy } from "ramda";
/* TODO: Fix terra.js */
import { BondStatus } from "@terra-money/terra.proto/cosmos/staking/v1beta1/staking";
import { AccAddress } from "@terra-money/terra.js";
import useLCDClient from "../hooks/useLCD";
import { Pagination, RefetchOptions } from "./query";

export const useValidator = (address: string) => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, address, "validator"],
    async () => await lcd.staking.validator(address),
    { ...RefetchOptions.INFINITY }
  );
};

export const useDelegations = (address: string) => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, address, "delegations"],
    async () => await lcd.staking.delegations(address),
    { ...RefetchOptions.DEFAULT }
  );
};

export const useDelegation = (address: string, validator: string) => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, address, validator, "delegation"],
    async () => await lcd.staking.delegation(address, validator),
    { ...RefetchOptions.DEFAULT }
  );
};

export const useUndelegations = (address: string) => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, address, "undelegations"],
    async () => {
      const [undelegations] = await lcd.staking.unbondingDelegations(address);
      return undelegations;
    },
    { ...RefetchOptions.DEFAULT }
  );
};

export const useStakingPool = () => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, "stakingPool"],
    async () => await lcd.staking.pool(),
    { ...RefetchOptions.INFINITY }
  );
};

export const useSelfDelegationAmount = (validatorAddress: string) => {
  const lcd = useLCDClient();
  return useQuery(
    [lcd.config, validatorAddress, "selfDelegation"],
    async () => {
      const delegator = AccAddress.fromValAddress(validatorAddress);
      const { balance } = await lcd.staking.delegation(
        delegator,
        validatorAddress
      );
      return balance?.amount;
    },
    { ...RefetchOptions.INFINITY, enabled: !!validatorAddress }
  );
};

export const useValidators = () => {
  const lcd = useLCDClient();

  return useQuery(
    [lcd.config, "vaidators"],
    async () => {
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
    { ...RefetchOptions.INFINITY }
  );
};
