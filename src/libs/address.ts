import { bech32 } from "bech32";

const byteLength = (prefix: string, address: string) => {
  try {
    const decoded = bech32.decode(address);
    return decoded.prefix === prefix
      ? bech32.fromWords(decoded.words).length
      : undefined;
  } catch {
    return undefined;
  }
};

const validate = (
  prefix: string,
  address: string,
  allowedByteLengths: number[]
) => {
  const length = byteLength(prefix, address);
  return length !== undefined && allowedByteLengths.includes(length);
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
  validate: (address: string) => validate("terra", address, [20, 32]),
  isContract: (address: string) => byteLength("terra", address) === 32,
  fromValAddress: (address: string) =>
    convertPrefix(address, "terravaloper", "terra")
};

export type ValAddress = string;
export const ValAddress = {
  validate: (address: string) => validate("terravaloper", address, [20]),
  fromAccAddress: (address: string) =>
    convertPrefix(address, "terra", "terravaloper")
};
