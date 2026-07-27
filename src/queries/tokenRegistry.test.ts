import { describe, expect, test } from "vitest";
import { mapVerifiedRegistryAssets } from "./tokenRegistry";

describe("verified Burrito token registry", () => {
  test("maps reviewed CW20 metadata by normalized contract", () => {
    const contract =
      "terra15p8su45k45axng8ue59rl6zph4at27s49u3agr6uqrx3dhcxpg3qt0ekdt";
    const registry = mapVerifiedRegistryAssets([
      {
        chainId: "columbus-5",
        type: "cw20",
        assetKey: contract.toUpperCase(),
        name: "DO",
        symbol: "DO",
        decimals: 6,
        logoUrl: "https://example.com/do.png"
      }
    ]);

    expect(registry.cw20[contract]).toMatchObject({
      token: contract,
      name: "DO",
      symbol: "DO",
      decimals: 6
    });
    expect(registry.cw20[contract].icon).toContain("/v1/finder/icon?");
  });

  test("maps IBC metadata and rejects malformed registry records", () => {
    const hash = "A".repeat(64);
    const registry = mapVerifiedRegistryAssets([
      {
        chainId: "columbus-5",
        type: "ibc",
        assetKey: `ibc/${hash.toLowerCase()}`,
        name: "BNB",
        symbol: "BNB",
        decimals: 8,
        baseDenom: "bnb",
        path: "transfer/channel-2"
      },
      {
        type: "cw20",
        assetKey: "not-a-contract",
        name: "Unsafe",
        symbol: "BAD",
        decimals: 999
      }
    ]);

    expect(registry.ibc[hash]).toEqual({
      denom: `ibc/${hash}`,
      base_denom: "bnb",
      symbol: "BNB",
      name: "BNB",
      decimals: 8,
      icon: undefined,
      path: "transfer/channel-2"
    });
    expect(registry.cw20).toEqual({});
  });
});
