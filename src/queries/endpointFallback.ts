import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  isClassicMainnetChainID,
  isClassicTestnetChainID
} from "../contexts/ChainsContext";
import { MINTSCAN_LCD_URL } from "./mintscan";

const DEFAULT_TIMEOUT = 8000;
const FALLBACK_STATUS_CODES = new Set([408, 425, 429, 500, 501, 502, 503, 504]);

export const CLASSIC_LCD_ENDPOINTS = [
  "https://terra-classic-lcd.publicnode.com",
  "https://lcd.terra-classic.hexxagon.io",
  "https://api-lunc-lcd.binodes.com"
];

export const CLASSIC_TESTNET_LCD_ENDPOINTS = [
  "https://lcd.terra-classic.hexxagon.dev",
  "https://lcd.luncblaze.com"
];

const unique = (values: string[]) => Array.from(new Set(values));

export const getClassicLcdFallbackBases = (primary?: string) =>
  unique([primary, ...CLASSIC_LCD_ENDPOINTS].filter(Boolean) as string[]);

export const getClassicTestnetLcdFallbackBases = (primary?: string) =>
  unique(
    [primary, ...CLASSIC_TESTNET_LCD_ENDPOINTS].filter(Boolean) as string[]
  );

export const getLcdFallbackBases = (primary?: string, chainID?: string) => {
  if (chainID && isClassicMainnetChainID(chainID)) {
    return getClassicLcdFallbackBases(primary);
  }
  if (chainID && isClassicTestnetChainID(chainID)) {
    return getClassicTestnetLcdFallbackBases(primary);
  }
  if (chainID === "phoenix-1") {
    return unique([primary, MINTSCAN_LCD_URL].filter(Boolean) as string[]);
  }
  return unique([primary].filter(Boolean) as string[]);
};

const buildFallbackUrls = (url: string, fallbackBases: string[] = []) => {
  const endpoints = unique(fallbackBases);
  const matchedBase = endpoints.find(base => url.startsWith(base));
  if (!matchedBase) return [url];

  const suffix = url.slice(matchedBase.length);
  return unique([
    matchedBase,
    ...endpoints.filter(base => base !== matchedBase)
  ]).map(base => `${base}${suffix}`);
};

export const axiosGetWithEndpointFallback = async <T>(
  url: string,
  config: AxiosRequestConfig = {},
  fallbackBases: string[] = []
): Promise<AxiosResponse<T>> => {
  const urls = buildFallbackUrls(url, fallbackBases);
  let lastError: unknown;
  let lastResponse: AxiosResponse<T> | undefined;

  for (const candidate of urls) {
    try {
      const response = await axios.get<T>(candidate, {
        timeout: DEFAULT_TIMEOUT,
        ...config
      });

      if (
        !FALLBACK_STATUS_CODES.has(response.status) ||
        candidate === urls[urls.length - 1]
      ) {
        return response;
      }

      lastResponse = response;
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ?? error?.response?.data ?? "";
      lastError = error;

      if (
        status === 500 &&
        typeof message === "string" &&
        message.includes("no such contract")
      ) {
        throw error;
      }

      if (
        status &&
        !FALLBACK_STATUS_CODES.has(status) &&
        candidate !== urls[urls.length - 1]
      ) {
        throw error;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError;
};
