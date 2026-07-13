import "core-js";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import "./index.scss";
import App from "./layouts/App";
import {
  getChains,
  getInitialChains,
  ChainsProvider
} from "./contexts/ChainsContext";
import { installGlobalErrorReporting } from "./reportError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 5 * 60 * 1000
    }
  }
});

installGlobalErrorReporting();

const Root = () => {
  const [chains, setChains] = useState(getInitialChains);

  useEffect(() => {
    let mounted = true;
    void getChains().then(next => {
      if (mounted) setChains(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <ChainsProvider value={chains}>
            <Routes>
              <Route path="/*" element={<App />} />
              <Route path=":network/*" element={<App />} />
            </Routes>
          </ChainsProvider>
        </QueryClientProvider>
      </RecoilRoot>
    </BrowserRouter>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("Root element is missing");
createRoot(container).render(<Root />);
