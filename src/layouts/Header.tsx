import React from "react";
import s from "./Header.module.scss";
import Search from "../components/Search";

import { Link } from "react-router-dom";
import FinderLogo from "../components/FinderLogo";
import SelectOptions from "../components/SelectOptions";

const Header = () => (
  <div className={s.header}>
    <div className={s.inner}>
      <div className={s.logo}>
        <Link to="/">
          <FinderLogo />
        </Link>
      </div>
      <Search className={s.search} />
      <SelectOptions variant="header" />
    </div>
  </div>
);

export default Header;
