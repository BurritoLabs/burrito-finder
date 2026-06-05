import format from "./format";

type IbcTokenLike = {
  base_denom?: string;
  symbol?: string;
};

export const getIbcHash = (denom = "") =>
  denom
    .replace(/^ibc\//i, "")
    .trim()
    .toUpperCase();

export const renderIbcDenom = (
  denom: string,
  token?: IbcTokenLike,
  isClassic?: boolean
) => {
  if (token?.symbol) return token.symbol;
  if (token?.base_denom) return format.denom(token.base_denom, isClassic);

  const hash = getIbcHash(denom);
  return hash ? `IBC ${format.truncate(hash, [6, 6])}` : "IBC";
};
