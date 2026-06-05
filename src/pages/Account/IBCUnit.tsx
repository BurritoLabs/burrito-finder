import { AccAddress } from "@terra-money/terra.js";
import { useCurrentChain } from "../../contexts/ChainsContext";
import { useIBCWhitelist } from "../../hooks/useTerraAssets";
import AmountCard from "./AmountCard";

type Props = {
  denom: string;
  available: string;
};

const IBCUnit = ({ denom = "", available }: Props) => {
  const { name } = useCurrentChain();
  const hash = denom.replace("ibc/", "");
  const data = useIBCWhitelist([denom]);
  const tokenInfo = data?.[hash];
  const ibcFallbackIcon =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/IBC.svg";
  const baseDenom = tokenInfo?.base_denom;
  const factoryAddress = baseDenom?.startsWith("factory/")
    ? baseDenom.split("/")[1]
    : undefined;
  const contractAddress =
    (baseDenom && AccAddress.validate(baseDenom) && baseDenom) ||
    (factoryAddress && AccAddress.validate(factoryAddress) && factoryAddress) ||
    undefined;

  return (
    <AmountCard
      amount={available}
      hash={hash}
      path={tokenInfo?.path}
      icon={tokenInfo?.icon ?? ibcFallbackIcon}
      denom={tokenInfo?.symbol ?? "IBC"}
      rawDenom={tokenInfo?.base_denom ?? denom}
      decimals={tokenInfo?.decimals ?? 6}
      linkTo={
        contractAddress ? `/${name}/address/${contractAddress}` : undefined
      }
    />
  );
};

export default IBCUnit;
