import { splitCoinData } from "./utility";

describe("splitCoinData", () => {
  it("splits native and IBC coin strings without terra.js", () => {
    expect(splitCoinData("123456uluna")).toEqual({
      amount: "123456",
      denom: "uluna"
    });
    expect(splitCoinData("42ibc/ABC123")).toEqual({
      amount: "42",
      denom: "ibc/ABC123"
    });
  });

  it("rejects malformed coin strings", () => {
    expect(splitCoinData("uluna")).toBeUndefined();
    expect(splitCoinData("12 uluna")).toBeUndefined();
    expect(splitCoinData("")).toBeUndefined();
  });
});
