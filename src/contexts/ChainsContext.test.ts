import { beforeEach, describe, expect, test, vi } from "vitest";
import { FALLBACK_CHAINS, getChains, getInitialChains } from "./ChainsContext";

describe("chain registry fallback", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test("renders with bundled chains when the remote registry is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(getInitialChains()).toEqual(FALLBACK_CHAINS);
    await expect(getChains()).resolves.toEqual(FALLBACK_CHAINS);
  });

  test("caches a valid registry and keeps the Phoenix LCD override", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            mainnet: {
              name: "mainnet",
              chainID: "phoenix-1",
              lcd: "https://registry.example"
            },
            classic: FALLBACK_CHAINS.find(chain => chain.name === "classic")
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    const chains = await getChains();
    expect(chains.find(chain => chain.name === "mainnet")?.lcd).toBe(
      "https://terra-lcd.publicnode.com"
    );
    expect(getInitialChains()).toEqual(chains);
  });
});
