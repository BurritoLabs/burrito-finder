interface Currency {
  data?: CurrencyData[];
  isLoading: boolean;
  currency: string;
  fxRates?: Record<string, number>;
}

interface CurrencyData {
  denom: string;
  oneDayVariation: string;
  oneDayVariationRate: string;
  swaprate: string;
}

interface ActiveDenom {
  data?: {
    result: string[];
  };
  isLoading: boolean;
}
