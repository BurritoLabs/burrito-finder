import React from "react";
import s from "./Header.module.scss";
import Search from "../components/Search";

import { Link, useLocation } from "react-router-dom";
import FinderLogo from "../components/FinderLogo";
import SelectOptions from "../components/SelectOptions";
import { BurritoThemeSwitcher } from "@burritolabs/ui";

const Header = () => {
  const { pathname } = useLocation();
  const isHome = pathname.split("/").filter(Boolean).length <= 1;

  return (
    <div className={`${s.header} ${isHome ? s.home : ""}`}>
      <div className={s.inner}>
        <div className={s.logo}>
          <Link to="/">
            <FinderLogo />
          </Link>
        </div>
        {!isHome && <Search className={s.search} />}
        <div className={s.actions}>
          <BurritoThemeSwitcher />
          <SelectOptions variant="header" />
        </div>
      </div>
    </div>
  );
};

export default Header;
