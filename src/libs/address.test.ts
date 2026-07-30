import { bech32 } from "bech32";
import { AccAddress, ValAddress } from "./address";

const words = bech32.toWords(Uint8Array.from({ length: 20 }, (_, i) => i));
const contractWords = bech32.toWords(
  Uint8Array.from({ length: 32 }, (_, i) => i)
);
const account = bech32.encode("terra", words);
const contract = bech32.encode("terra", contractWords);
const validator = bech32.encode("terravaloper", words);

describe("Terra address helpers", () => {
  it("validates account, contract and validator address prefixes", () => {
    expect(AccAddress.validate(account)).toBe(true);
    expect(AccAddress.validate(contract)).toBe(true);
    expect(AccAddress.isContract(account)).toBe(false);
    expect(AccAddress.isContract(contract)).toBe(true);
    expect(AccAddress.validate(validator)).toBe(false);
    expect(ValAddress.validate(validator)).toBe(true);
    expect(ValAddress.validate(account)).toBe(false);
    expect(ValAddress.validate(contract)).toBe(false);
  });

  it("converts between account and validator addresses", () => {
    expect(AccAddress.fromValAddress(validator)).toBe(account);
    expect(ValAddress.fromAccAddress(account)).toBe(validator);
    expect(() => ValAddress.fromAccAddress(contract)).toThrow(
      "Invalid terra address"
    );
  });
});
