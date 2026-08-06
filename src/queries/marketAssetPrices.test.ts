import { expect, test } from "vitest";
import { deriveMarketAssetUsdPrices } from "./marketAssetPrices";

const token = "cw20:terra1token";

test("derives a CW20 USD price from a verified native anchor pool", () => {
  const result = deriveMarketAssetUsdPrices({
    market: {
      chainId: "columbus-5",
      pairs: [
        {
          poolAssets: [
            { id: token, amount: "200000000" },
            { id: "native:uluna", amount: "100000000" }
          ]
        }
      ]
    },
    assets: [{ id: token, decimals: 6 }],
    luncUsd: 0.00005
  });

  expect(result[token]).toBeCloseTo(0.000025, 10);
});

test("uses the deeper pool when multiple price paths exist", () => {
  const result = deriveMarketAssetUsdPrices({
    market: {
      chainId: "columbus-5",
      pairs: [
        {
          poolAssets: [
            { id: token, amount: "1000000" },
            { id: "native:uusd", amount: "1000000" }
          ]
        },
        {
          poolAssets: [
            { id: token, amount: "1000000000" },
            { id: "native:uluna", amount: "2000000000" }
          ]
        }
      ]
    },
    assets: [{ id: token, decimals: 6 }],
    luncUsd: 0.00005,
    ustcUsd: 0.005
  });

  expect(result[token]).toBeCloseTo(0.0001, 10);
});

test("does not price assets from an index for another chain", () => {
  expect(
    deriveMarketAssetUsdPrices({
      market: { chainId: "phoenix-1", pairs: [] },
      assets: [{ id: token, decimals: 6 }],
      luncUsd: 1
    })
  ).toEqual({});
});
