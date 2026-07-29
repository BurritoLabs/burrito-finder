import { Dictionary } from "ramda";
import { AccAddress } from "../libs/address";
import { Tokens } from "../hooks/cw20/useTokenBalance";
import {
  IBCTokenList,
  useContracts,
  useIBCWhitelist,
  useMintscanNativeWhitelist,
  useWhitelist
} from "../hooks/useTerraAssets";
import format from "../scripts/format";
import { isIbcDenom } from "../scripts/utility";
import { renderIbcDenom } from "../scripts/ibc";
import useDenomTrace from "../hooks/useDenomTrace";
import { useIsClassic } from "../contexts/ChainsContext";

type Props = {
  estimated?: boolean;
  fontSize?: number;
  className?: string;
  denom?: string;
  children?: string;
  decimals?: number;
};

export type Contract = Dictionary<Contracts>;

export const renderDenom = (
  str: string,
  whitelist?: Tokens,
  contracts?: Contract,
  ibcWhitelist?: IBCTokenList,
  isClassic?: boolean
) => {
  const list = whitelist?.[str];
  const contract = contracts?.[str];
  const hash = str.replace("ibc/", "");
  const ibc = ibcWhitelist?.[hash];

  if (isIbcDenom(str)) {
    return renderIbcDenom(str, ibc, isClassic);
  }

  if (AccAddress.validate(str) && (list || contract)) {
    const symbol = list?.symbol || contract?.name;
    return symbol;
  } else if (format.denom(str).length >= 40) {
    return "Token";
  } else {
    return format.denom(str, isClassic);
  }
};

const Amount = (props: Props) => {
  const { estimated, fontSize, className, denom, children, decimals } = props;
  const whitelist = useWhitelist();
  const contracts = useContracts();
  const ibcWhitelist = useIBCWhitelist(denom ? [denom] : undefined);
  const nativeWhitelist = useMintscanNativeWhitelist();
  const isClassic = useIsClassic();

  const hash = denom?.replace("ibc/", "");
  const nativeInfo = denom?.startsWith("factory/")
    ? nativeWhitelist[denom]
    : undefined;
  const tokenDecimals =
    whitelist?.[denom ?? ""]?.decimals ??
    ibcWhitelist?.[hash ?? ""]?.decimals ??
    nativeInfo?.decimals;

  const [integer, decimal] = format
    .amount(children || "0", tokenDecimals ?? decimals)
    .split(".");

  const data = useDenomTrace(denom);

  return (
    <span className={className} style={{ fontSize }}>
      {estimated && "≈ "}
      {integer}
      <small>
        .{decimal}
        {nativeInfo?.symbol
          ? ` ${nativeInfo.symbol}`
          : data
            ? ` ${renderIbcDenom(denom ?? "", data, isClassic)}`
            : denom &&
              ` ${renderDenom(
                denom,
                whitelist,
                contracts,
                ibcWhitelist,
                isClassic
              )}`}
      </small>
    </span>
  );
};

export default Amount;
