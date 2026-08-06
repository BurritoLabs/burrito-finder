import { beforeEach, expect, test, vi } from "vitest";
import {
  includeActiveCw20Contracts,
  loadActiveCw20Contracts,
  savePositiveCw20Contracts
} from "./activeBalanceCache";

const address = "terra1account";
const contract = "terra1contract000000000000000000000000000000000";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

test("stores positive CW20 contracts per account and chain", () => {
  savePositiveCw20Contracts(address, "columbus-5", {
    [contract]: "12",
    terra1zero000000000000000000000000000000000000: "0"
  });

  expect(loadActiveCw20Contracts(address, "columbus-5")).toEqual([contract]);
  expect(loadActiveCw20Contracts(address, "phoenix-1")).toEqual([]);
  expect(loadActiveCw20Contracts("terra1other", "columbus-5")).toEqual([]);
});

test("adds cached contracts without replacing verified metadata", () => {
  const verified = {
    [contract]: { symbol: "DO", name: "DO", decimals: 6 }
  };

  expect(includeActiveCw20Contracts(verified, [contract])).toEqual(verified);

  const unknown = "terra1unknown0000000000000000000000000000000000";
  expect(
    includeActiveCw20Contracts(verified, [unknown])[unknown]
  ).toMatchObject({
    symbol: expect.stringContaining("CW20-"),
    token: unknown
  });
});

test("drops expired active balance caches", () => {
  vi.spyOn(Date, "now").mockReturnValue(1_000);
  savePositiveCw20Contracts(address, "columbus-5", { [contract]: "1" });
  vi.spyOn(Date, "now").mockReturnValue(1_000 + 30 * 24 * 60 * 60 * 1000);

  expect(loadActiveCw20Contracts(address, "columbus-5")).toEqual([]);
});
