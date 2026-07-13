import { expect, test } from "vitest";
import { proxyAssetIcon } from "./finderAssets";

test("routes remote asset icons through the Finder cache proxy", () => {
  const remote =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon.png";
  expect(proxyAssetIcon(remote)).toBe(
    `https://api.burrito.money/v1/finder/icon?url=${encodeURIComponent(remote)}`
  );
  expect(proxyAssetIcon("/brand/icon.png")).toBe("/brand/icon.png");
  expect(proxyAssetIcon("http://insecure.example/icon.png")).toBeUndefined();
});
