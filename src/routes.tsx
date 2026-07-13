import React, { lazy } from "react";
import { Route, Routes } from "react-router-dom";
const Index = lazy(() => import("./pages/Index/Index"));
const Block = lazy(() => import("./pages/Block"));
const Tx = lazy(() => import("./pages/Tx"));
const Address = lazy(() => import("./pages/Account/Address"));
const Validator = lazy(() => import("./pages/Validator"));
const NotFound = lazy(() => import("./components/NotFound"));
const Privacy = lazy(() =>
  import("./pages/Legal/Legal").then(module => ({ default: module.Privacy }))
);
const Terms = lazy(() =>
  import("./pages/Legal/Legal").then(module => ({ default: module.Terms }))
);

const AppRoutes = () => (
  <Routes>
    <Route index element={<Index />} />
    <Route path="blocks/:height" element={<Block />} />
    <Route path="block/:height" element={<Block />} />
    <Route path="txs/:height" element={<Block />} />
    <Route path="tx/:hash" element={<Tx />} />
    <Route path="validator/:address" element={<Validator />} />
    <Route path="address/:address" element={<Address />} />
    <Route path="account/:address" element={<Address />} />
    <Route path="notfound/:keyword" element={<NotFound />} />
    <Route path="privacy" element={<Privacy />} />
    <Route path="terms" element={<Terms />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
