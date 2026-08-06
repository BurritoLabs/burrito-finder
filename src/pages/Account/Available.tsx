import React from "react";
import { useIsClassic } from "../../contexts/ChainsContext";
import { NativeToken } from "../../hooks/useTerraAssets";
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
  fxRates?: Record<string, number>;
  nativeInfo?: NativeToken;
  usdValue?: number;
  showUsdValue?: boolean;
};

const Available = ({
  denom,
  amount,
  response,
  ustcPrice,
  lunaPrice,
  fxRates,
  nativeInfo,
  usdValue,
  showUsdValue
}: Props) => {
  const isClassic = useIsClassic();
  const isFactory = denom.startsWith("factory/");
  const cwFallbackIcon = "/system/cw20.svg";
  if (isIbcDenom(denom)) {
    return (
      <IBCUnit
        denom={denom}
        available={amount}
        usdValue={usdValue}
        showUsdValue={showUsdValue}
      />
    );
  }

  return (
    <AmountCard
      denom={nativeInfo?.symbol ?? format.denom(denom, isClassic)}
      rawDenom={denom}
      isClassic={isClassic}
      amount={amount}
      response={response}
      ustcPrice={ustcPrice}
      lunaPrice={lunaPrice}
      fxRates={fxRates}
      icon={nativeInfo?.icon}
      decimals={nativeInfo?.decimals}
      fallbackIcon={cwFallbackIcon}
    />
  );
};

export default Available;
