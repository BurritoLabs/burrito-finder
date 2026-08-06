import React from "react";
import { BurritoBrandLockup } from "@burritolabs/ui";
import s from "./FinderLogo.module.scss";

type Props = {
  className?: string;
  variant?: "default" | "hero";
};

const FinderLogo = ({ className, variant = "default" }: Props) => (
  <BurritoBrandLockup
    iconSrc="/brand/icon.png"
    product="Finder"
    className={[s.logo, variant === "hero" ? s.hero : "", className]
      .filter(Boolean)
      .join(" ")}
  />
);

export default FinderLogo;
