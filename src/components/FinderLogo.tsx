import React from "react";
import { BurritoBrandLockup } from "@burritolabs/ui";
import s from "./FinderLogo.module.scss";

type Props = {
  className?: string;
  variant?: "default" | "hero";
};

const FinderLogo = ({ className, variant = "default" }: Props) => (
  <BurritoBrandLockup
    product="Finder"
    iconSrc="/brand/icon.png"
    iconSize={24}
    className={[s.logo, variant === "hero" ? s.hero : "", className]
      .filter(Boolean)
      .join(" ")}
  />
);

export default FinderLogo;
