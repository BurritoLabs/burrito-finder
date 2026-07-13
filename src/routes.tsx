import React from "react";
import { Route, Routes } from "react-router-dom";
import Index from "./pages/Index/Index";
import Block from "./pages/Block";
import Tx from "./pages/Tx";
import Address from "./pages/Account/Address";
import Validator from "./pages/Validator";
import NotFound from "./components/NotFound";
import { Privacy, Terms } from "./pages/Legal/Legal";

export default (
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
