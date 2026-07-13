import { bech32 } from "bech32";

const validate = (prefix: string, address: string) => {
  try {
    const decoded = bech32.decode(address);
    return (
      decoded.prefix === prefix && bech32.fromWords(decoded.words).length === 20
    );
  } catch {
    return false;
  }
};

const convertPrefix = (address: string, from: string, to: string) => {
  const decoded = bech32.decode(address);
  if (
    decoded.prefix !== from ||
    bech32.fromWords(decoded.words).length !== 20
  ) {
    throw new Error(`Invalid ${from} address`);
  }
  return bech32.encode(to, decoded.words);
};

export type AccAddress = string;
export const AccAddress = {
  validate: (address: string) => validate("terra", address),
  fromValAddress: (address: string) =>
    convertPrefix(address, "terravaloper", "terra")
};

export type ValAddress = string;
export const ValAddress = {
  validate: (address: string) => validate("terravaloper", address),
  fromAccAddress: (address: string) =>
    convertPrefix(address, "terra", "terravaloper")
};
