import { useMemo } from "react";
import {
  createActionRuleSet,
  createAmountRuleSet
} from "@terra-money/log-finder-ruleset";
import { useCurrentChain } from "../contexts/ChainsContext";

export const useLogfinderActionRuleSet = () => {
  const { name } = useCurrentChain();
  const actionRules = useMemo(() => createActionRuleSet(name), [name]);
  return actionRules;
};

export const useLogfinderAmountRuleSet = () => {
  const amountRules = useMemo(() => createAmountRuleSet(), []);
  return amountRules;
};
