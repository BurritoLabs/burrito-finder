import React from "react";
import { Route, Routes } from "react-router-dom";
import { lazyWithBuildRecovery } from "./libs/lazyWithBuildRecovery";

const Index = lazyWithBuildRecovery(() => import("./pages/Index/Index"));
const Block = lazyWithBuildRecovery(() => import("./pages/Block"));
const Tx = lazyWithBuildRecovery(() => import("./pages/Tx"));
const Address = lazyWithBuildRecovery(() => import("./pages/Account/Address"));
const Validator = lazyWithBuildRecovery(() => import("./pages/Validator"));
const NotFound = lazyWithBuildRecovery(() => import("./components/NotFound"));
const Privacy = lazyWithBuildRecovery(() =>
  import("./pages/Legal/Legal").then(module => ({ default: module.Privacy }))
);
const Terms = lazyWithBuildRecovery(() =>
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
