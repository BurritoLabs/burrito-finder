import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import BigNumber from "bignumber.js";
import { find, map } from "lodash";
import { lte } from "../../scripts/math";
import format from "../../scripts/format";
import { ASSET_URL } from "../../scripts/utility";
import Image from "../../components/Image";
import Card from "../../components/Card";
import Amount from "../../components/Amount";
import useDenomMetadata from "../../hooks/useDenomMetadata";
import s from "./AmountCard.module.scss";

type Props = {
  denom: string;
  amount: string;
  path?: string;
  hash?: string;
  linkTo?: string;
  icon?: string;
  fallbackIcon?: string;
  button?: ReactNode;
  children?: ReactNode;
  response?: Currency;
  decimals?: number;
  isClassic?: boolean;
  rawDenom?: string;
  ustcPrice?: number;
  lunaPrice?: number;
  fxRates?: Record<string, number>;
};

const AmountCard = ({
  denom,
  icon,
  amount,
  path,
  hash,
  linkTo,
  rawDenom,
  ...props
}: Props) => {
  const {
    button,
    children,
    response,
    decimals,
    isClassic,
    ustcPrice,
    lunaPrice,
    fxRates,
    fallbackIcon
  } = props;
  const isFactory = !!rawDenom && rawDenom.startsWith("factory/");
  const metadata = useDenomMetadata(isFactory);
  const factoryMeta = isFactory ? metadata?.get(rawDenom ?? "") : undefined;
  const factoryLabel =
    factoryMeta?.symbol ||
    factoryMeta?.display ||
    factoryMeta?.name ||
    (rawDenom ? rawDenom.split("/").pop() : undefined);
  const baseLabel = isFactory ? factoryLabel || denom : denom;
  const classicDenom = format.denom(rawDenom ?? denom, true);
  const isClassicStable = isClassic && classicDenom.endsWith("TC");
  const classicIconDenom =
    rawDenom === "uluna"
      ? "LUNC"
      : format.denom(rawDenom ?? denom, false).toUpperCase();
  const mainnetIconDenom = rawDenom === "uluna" ? "LUNA" : denom;
  const iconDenom = isClassic ? classicIconDenom : mainnetIconDenom;
  const iconLink = `${ASSET_URL}/icon/60/${iconDenom}.png`;
  const iconCandidates = [
    icon,
    iconLink,
    `${ASSET_URL}/icon/svg/${iconDenom}.svg`,
    `${ASSET_URL}/icon/60/${iconDenom}.png`,
    `${ASSET_URL}/icon/svg/${String(iconDenom).toUpperCase()}.svg`,
    `${ASSET_URL}/icon/60/${String(iconDenom).toLowerCase()}.png`,
    ...(iconDenom === "LUNA"
      ? [`${ASSET_URL}/icon/svg/Luna.svg`, `${ASSET_URL}/icon/60/Luna.png`]
      : []),
    ...(isClassicStable
      ? [
          `${ASSET_URL}/icon/svg/USTC.svg`,
          `${ASSET_URL}/icon/60/USTC.png`,
          `${ASSET_URL}/icon/60/ustc.png`
        ]
      : []),
    fallbackIcon
  ].filter(Boolean) as string[];

  const formatDenom = isClassic
    ? baseLabel === "Luna" || baseLabel.toUpperCase() === "LUNC"
      ? "LUNC"
      : isFactory || baseLabel.toUpperCase().endsWith("C")
      ? baseLabel
      : baseLabel + "C"
    : baseLabel;

  const iconRender = (
    <div className={s.icon}>
      <Image urls={iconCandidates} size={30} />
    </div>
  );

  const tokenHeader = (
    <div className={s.token_wrapper}>
      {iconRender}
      <h1 className={s.denom}>{formatDenom}</h1>
      {hash && path && (
        <span className={s.meta}>
          {format.truncate(hash, [6, 6])} ({path})
        </span>
      )}
    </div>
  );

  return (
    <Card bodyClassName={s.card}>
      <article className={s.article}>
        <header className={s.header}>
          {linkTo ? (
            <Link to={linkTo} className={s.tokenLink}>
              {tokenHeader}
            </Link>
          ) : (
            tokenHeader
          )}
          <section className={s.action}>
            <Amount className={s.amount} decimals={decimals}>
              {lte(amount, 0) ? "0" : amount}
            </Amount>
            <span className={s.currency}>
              {response &&
                renderCurreny(
                  denom,
                  amount,
                  response,
                  isClassic,
                  ustcPrice,
                  rawDenom,
                  lunaPrice,
                  fxRates
                )}
            </span>
            <div className={s.button}>{button}</div>
          </section>
        </header>

        {children}
      </article>
    </Card>
  );
};

export default AmountCard;

const renderCurreny = (
  denom: string,
  amount: string,
  response: Currency,
  isClassic?: boolean,
  ustcPrice?: number,
  rawDenom?: string,
  lunaPrice?: number,
  fxRates?: Record<string, number>
) => {
  const { data, currency } = response;
  const currencyLabel = currency.substr(1).toUpperCase();
  const classicDenom = format.denom(rawDenom ?? denom, true);
  const renderData = data
    ? find(data, obj => denom === format.denom(obj.denom, isClassic))
    : undefined;

  if (isClassic && (rawDenom === "umnt" || rawDenom === "utwd")) {
    if (!ustcPrice) return "";
    const fxCode = rawDenom === "umnt" ? "MNT" : "TWD";
    const fxUsd = fxRates?.[fxCode];
    if (!fxUsd) return "";
    const value = new BigNumber(amount)
      .dividedBy(1e6)
      .multipliedBy(fxUsd)
      .multipliedBy(ustcPrice);
    return `= ${value.toFormat(6)} USD`;
  }

  if (isClassic && classicDenom.endsWith("TC")) {
    if (!ustcPrice) return "";
    if (rawDenom === "uusd") {
      const value = new BigNumber(amount)
        .dividedBy(1e6)
        .multipliedBy(ustcPrice);
      return `= ${value.toFormat(6)} USD`;
    }

    const rate = renderData?.swaprate;
    if (rate) {
      const value = new BigNumber(amount)
        .dividedBy(rate)
        .dividedBy(1e6)
        .multipliedBy(ustcPrice);
      return `= ${value.toFormat(6)} USD`;
    }

    const fxCode =
      rawDenom === "umnt" ? "MNT" : rawDenom === "utwd" ? "TWD" : undefined;
    const fxUsd = fxCode ? fxRates?.[fxCode] : undefined;
    if (!fxUsd) return "";
    const value = new BigNumber(amount)
      .dividedBy(1e6)
      .multipliedBy(fxUsd)
      .multipliedBy(ustcPrice);
    return `= ${value.toFormat(6)} USD`;
  }

  if (!isClassic && rawDenom === "uluna" && lunaPrice) {
    const value = new BigNumber(amount).dividedBy(1e6).multipliedBy(lunaPrice);
    return `= ${value.toFormat(6)} USD`;
  }

  const denoms = data
    ? map(data, "denom").map(str => format.denom(str, isClassic))
    : [];
  if (data && denoms.includes(denom)) {
    const result =
      renderData && new BigNumber(amount).dividedBy(renderData.swaprate);

    if (result) {
      return `= ${format.amount(result)} ${currencyLabel}`;
    }
  }

  return "";
};
