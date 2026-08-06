import { AccAddress } from "../../libs/address";
import { useCurrentChain } from "../../contexts/ChainsContext";
import { useIBCWhitelist } from "../../hooks/useTerraAssets";
import AmountCard from "./AmountCard";

type Props = {
  denom: string;
  available: string;
  usdValue?: number;
  showUsdValue?: boolean;
};

const IBCUnit = ({ denom = "", available, usdValue, showUsdValue }: Props) => {
  const { name } = useCurrentChain();
  const hash = denom.replace("ibc/", "");
  const data = useIBCWhitelist([denom]);
  const tokenInfo = data?.[hash];
  const ibcFallbackIcon = "/system/ibc.svg";
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
      icon={tokenInfo?.icon}
      fallbackIcon={ibcFallbackIcon}
      denom={tokenInfo?.symbol ?? "IBC"}
      name={tokenInfo?.name}
      assetId={denom}
      rawDenom={tokenInfo?.base_denom ?? denom}
      decimals={tokenInfo?.decimals ?? 6}
      usdValue={usdValue}
      showUsdValue={showUsdValue}
      linkTo={
        contractAddress ? `/${name}/address/${contractAddress}` : undefined
      }
    />
  );
};

export default IBCUnit;
