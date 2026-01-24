import React from "react";
import { useIsClassic } from "../../contexts/ChainsContext";
import format from "../../scripts/format";
import { isIbcDenom } from "../../scripts/utility";
import AmountCard from "./AmountCard";
import IBCUnit from "./IBCUnit";

type Props = {
  denom: string;
  amount: string;
  response?: Currency;
  ustcPrice?: number;
  lunaPrice?: number;
};

const Available = ({
  denom,
  amount,
  response,
  ustcPrice,
  lunaPrice
}: Props) => {
  const isClassic = useIsClassic();
  const cwFallbackIcon =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/CW.svg";
  if (isIbcDenom(denom)) {
    return <IBCUnit denom={denom} available={amount} />;
  }

  return (
    <AmountCard
      denom={format.denom(denom, isClassic)}
      rawDenom={denom}
      isClassic={isClassic}
      amount={amount}
      response={response}
      ustcPrice={ustcPrice}
      lunaPrice={lunaPrice}
      fallbackIcon={cwFallbackIcon}
    />
  );
};

export default Available;
