import { describe, expect, it } from "vitest";
import { getTransactionDisplayState } from "./transactionDisplay";

describe("transaction display state", () => {
  it("shows successful transaction balance changes as committed", () => {
    expect(getTransactionDisplayState()).toEqual({
      balanceChangesApplied: true,
      label: "Success"
    });
  });

  it("marks failed transaction balance changes as rolled back", () => {
    expect(getTransactionDisplayState(11)).toEqual({
      balanceChangesApplied: false,
      label: "Failed · rolled back"
    });
  });
});
