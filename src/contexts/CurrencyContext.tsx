import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { DEFAULT_CURRENCY } from "../scripts/utility";

type CurrencyContextValue = {
  currency: string;
  setCurrency: (currency: string) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const value = useMemo(() => ({ currency, setCurrency }), [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const value = useContext(CurrencyContext);
  if (!value) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return value;
};
