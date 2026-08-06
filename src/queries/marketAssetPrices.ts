import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import BigNumber from "bignumber.js";
import { useCurrentChain } from "../contexts/ChainsContext";
import { BURRITO_API_URL } from "./mintscan";

const CLASSIC_MARKET_INDEX_URL = "https://app.burrito.money/market/index.json";

export type MarketAssetDescriptor = {
  id: string;
  decimals: number;
};

type MarketIndex = {
  chainId?: string;
  pairs?: Array<{
    poolAssets?: Array<{ id?: string; amount?: string }>;
  }>;
};

type FinderPrices = {
  lunc?: { usd?: number };
  ustc?: { usd?: number };
};

type AnchorPrices = {
  luncUsd?: number;
  ustcUsd?: number;
};

const PRICE_CACHE_KEY = "finder:market-anchor-prices:v1";
const PRICE_CACHE_TTL = 24 * 60 * 60 * 1000;

const normalizeAssetId = (value: string) => value.trim().toLowerCase();

export const deriveMarketAssetUsdPrices = ({
  market,
  assets,
  luncUsd,
  ustcUsd
}: {
  market: MarketIndex;
  assets: MarketAssetDescriptor[];
  luncUsd?: number;
  ustcUsd?: number;
}) => {
  if (market.chainId && market.chainId !== "columbus-5") return {};

  const decimals = new Map<string, number>([
    ["native:uluna", 6],
    ["native:uusd", 6],
    ...assets.map(
      asset =>
        [
          normalizeAssetId(asset.id),
          Number.isFinite(asset.decimals) ? asset.decimals : 6
        ] as [string, number]
    )
  ]);
  const requested = new Set(assets.map(asset => normalizeAssetId(asset.id)));
  const resolved = new Map<string, { price: number; liquidity: number }>();

  if (luncUsd && Number.isFinite(luncUsd) && luncUsd > 0) {
    resolved.set("native:uluna", {
      price: luncUsd,
      liquidity: Number.POSITIVE_INFINITY
    });
  }
  if (ustcUsd && Number.isFinite(ustcUsd) && ustcUsd > 0) {
    resolved.set("native:uusd", {
      price: ustcUsd,
      liquidity: Number.POSITIVE_INFINITY
    });
  }

  const edges = (market.pairs ?? [])
    .map(pair => {
      const [left, right] = pair.poolAssets ?? [];
      if (!left?.id || !right?.id || !left.amount || !right.amount) {
        return undefined;
      }
      const leftId = normalizeAssetId(left.id);
      const rightId = normalizeAssetId(right.id);
      const leftDecimals = decimals.get(leftId);
      const rightDecimals = decimals.get(rightId);
      if (leftDecimals === undefined || rightDecimals === undefined) {
        return undefined;
      }

      const leftUnits = new BigNumber(left.amount)
        .shiftedBy(-leftDecimals)
        .toNumber();
      const rightUnits = new BigNumber(right.amount)
        .shiftedBy(-rightDecimals)
        .toNumber();
      if (
        !Number.isFinite(leftUnits) ||
        !Number.isFinite(rightUnits) ||
        leftUnits <= 0 ||
        rightUnits <= 0
      ) {
        return undefined;
      }
      return { leftId, rightId, leftUnits, rightUnits };
    })
    .filter(
      (
        edge
      ): edge is {
        leftId: string;
        rightId: string;
        leftUnits: number;
        rightUnits: number;
      } => Boolean(edge)
    );

  const anchors = new Set(["native:uluna", "native:uusd"]);
  const maxPasses = Math.max(2, requested.size + 1);
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let updated = false;
    edges.forEach(({ leftId, rightId, leftUnits, rightUnits }) => {
      const update = (
        knownId: string,
        unknownId: string,
        knownUnits: number,
        unknownUnits: number
      ) => {
        const known = resolved.get(knownId);
        if (!known || anchors.has(unknownId) || !requested.has(unknownId)) {
          return;
        }
        const price = (knownUnits * known.price) / unknownUnits;
        const poolLiquidity = knownUnits * known.price * 2;
        const pathLiquidity = Math.min(known.liquidity, poolLiquidity);
        const current = resolved.get(unknownId);
        if (
          Number.isFinite(price) &&
          price > 0 &&
          (!current || pathLiquidity > current.liquidity)
        ) {
          resolved.set(unknownId, { price, liquidity: pathLiquidity });
          updated = true;
        }
      };

      update(leftId, rightId, leftUnits, rightUnits);
      update(rightId, leftId, rightUnits, leftUnits);
    });
    if (!updated) break;
  }

  return Object.fromEntries(
    Array.from(requested)
      .map(id => [id, resolved.get(id)?.price] as const)
      .filter((entry): entry is readonly [string, number] =>
        Number.isFinite(entry[1])
      )
  );
};

const validPrice = (value?: number) =>
  value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : undefined;

const readCachedAnchorPrices = (): AnchorPrices => {
  if (typeof window === "undefined") return {};
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(PRICE_CACHE_KEY) ?? "null"
    ) as (AnchorPrices & { ts: number }) | null;
    if (!cached || Date.now() - cached.ts >= PRICE_CACHE_TTL) return {};
    return {
      luncUsd: validPrice(cached.luncUsd),
      ustcUsd: validPrice(cached.ustcUsd)
    };
  } catch {
    return {};
  }
};

const cacheAnchorPrices = (prices: AnchorPrices) => {
  if (
    typeof window === "undefined" ||
    (!validPrice(prices.luncUsd) && !validPrice(prices.ustcUsd))
  ) {
    return;
  }
  window.localStorage.setItem(
    PRICE_CACHE_KEY,
    JSON.stringify({ ...prices, ts: Date.now() })
  );
};

const fetchAnchorPrices = async (): Promise<AnchorPrices> => {
  const cached = readCachedAnchorPrices();
  let luncUsd: number | undefined;
  let ustcUsd: number | undefined;

  try {
    const { data } = await axios.get<FinderPrices>(
      `${BURRITO_API_URL}/v1/finder/prices`,
      { timeout: 8000 }
    );
    luncUsd = validPrice(data.lunc?.usd);
    ustcUsd = validPrice(data.ustc?.usd);
  } catch {
    // Public price fallbacks below keep account valuation independent of one API.
  }

  if (!luncUsd || !ustcUsd) {
    try {
      const { data } = await axios.get<{
        "terra-luna"?: { usd?: number };
        terrausd?: { usd?: number };
        terraclassicusd?: { usd?: number };
      }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=terra-luna,terrausd,terraclassicusd&vs_currencies=usd",
        { timeout: 8000 }
      );
      luncUsd ||= validPrice(data["terra-luna"]?.usd);
      ustcUsd ||=
        validPrice(data.terrausd?.usd) ?? validPrice(data.terraclassicusd?.usd);
    } catch {
      // Continue to the second public source and then the local cache.
    }
  }

  if (!luncUsd || !ustcUsd) {
    const [luncResult, ustcResult] = await Promise.allSettled([
      axios.get<{ quotes?: { USD?: { price?: number } } }>(
        "https://api.coinpaprika.com/v1/tickers/lunc-terra-classic",
        { timeout: 8000 }
      ),
      axios.get<{ quotes?: { USD?: { price?: number } } }>(
        "https://api.coinpaprika.com/v1/tickers/ust-terrausd",
        { timeout: 8000 }
      )
    ]);
    if (luncResult.status === "fulfilled") {
      luncUsd ||= validPrice(luncResult.value.data.quotes?.USD?.price);
    }
    if (ustcResult.status === "fulfilled") {
      ustcUsd ||= validPrice(ustcResult.value.data.quotes?.USD?.price);
    }
  }

  const result = {
    luncUsd: luncUsd ?? cached.luncUsd,
    ustcUsd: ustcUsd ?? cached.ustcUsd
  };
  cacheAnchorPrices(result);
  return result;
};

const fetchMarketAssetUsdPrices = async (assets: MarketAssetDescriptor[]) => {
  const [prices, { data: market }] = await Promise.all([
    fetchAnchorPrices(),
    axios.get<MarketIndex>(CLASSIC_MARKET_INDEX_URL, { timeout: 20000 })
  ]);
  return deriveMarketAssetUsdPrices({
    market,
    assets,
    luncUsd: prices.luncUsd,
    ustcUsd: prices.ustcUsd
  });
};

export const useMarketAssetUsdPrices = (
  assets: MarketAssetDescriptor[],
  enabled: boolean
) => {
  const { chainID } = useCurrentChain();
  const signature = assets
    .map(asset => `${normalizeAssetId(asset.id)}:${asset.decimals}`)
    .sort()
    .join("|");

  return useQuery({
    queryKey: ["account-market-asset-prices", chainID, signature],
    queryFn: () => fetchMarketAssetUsdPrices(assets),
    enabled: enabled && chainID === "columbus-5" && assets.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1
  });
};
