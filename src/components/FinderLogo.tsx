import React from "react";
import s from "./FinderLogo.module.scss";

type Props = {
  className?: string;
  variant?: "default" | "hero";
};

const FinderLogo = ({ className, variant = "default" }: Props) => (
  <span
    className={[s.logo, variant === "hero" ? s.hero : "", className]
      .filter(Boolean)
      .join(" ")}
    role="img"
    aria-label="Burrito Finder"
  >
    <img src="/brand/icon.png" alt="" aria-hidden="true" />
    <svg
      className={s.wordmark}
      viewBox="0 0 133.2 20"
      aria-hidden="true"
      focusable="false"
    >
      <text
        className={s.brand}
        x="0"
        y="16"
        textLength="66.625"
        lengthAdjust="spacingOnly"
      >
        Burrito
      </text>
      <text
        className={s.product}
        x="72.625"
        y="16"
        textLength="60.575"
        lengthAdjust="spacingOnly"
      >
        Finder
      </text>
    </svg>
  </span>
);

export default FinderLogo;
