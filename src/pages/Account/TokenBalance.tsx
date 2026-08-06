import { useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import Card from "../../components/Card";
import Info from "../../components/Info";
import Loading from "../../components/Loading";
import {
  isClassicTestnetChainID,
  useCurrentChain,
  useIsClassic
} from "../../contexts/ChainsContext";
import { useInitialBankBalance } from "../../queries/bank";
import useTokenBalance from "../../hooks/cw20/useTokenBalance";
import { isIbcDenom } from "../../scripts/utility";
import { useIBCWhitelist } from "../../hooks/useTerraAssets";
import { useMarketAssetUsdPrices } from "../../queries/marketAssetPrices";
import AmountCard from "./AmountCard";
import Available from "./Available";
import AvailableList from "./AvailableList";
import OldVesting from "./OldVesting";
import s from "./TokenBalance.module.scss";

const TokenBalance = ({ address }: { address: string }) => {
  const [hideLowValueAssets, setHideLowValueAssets] = useState(true);
  const [deferTokens, setDeferTokens] = useState(true);
  const [pricesEnabled, setPricesEnabled] = useState(false);
  const tokens = useTokenBalance(deferTokens ? "" : address);
  const [hideLowValueTokens, setHideLowValueTokens] = useState(true);
  const { data: balance } = useInitialBankBalance(address);
  const nativeBlanace = balance?.filter(({ denom }) => !isIbcDenom(denom));
  const ibcBalance = balance?.filter(({ denom }) => isIbcDenom(denom));
  const ibcWhitelist = useIBCWhitelist(
    ibcBalance?.map(({ denom }) => denom) ?? []
  );

  const { name, chainID } = useCurrentChain();
  const isClassic = useIsClassic();
  const isClassicTestnet = isClassicTestnetChainID(chainID);
  const cwFallbackIcon = "/system/cw20.svg";
  const tokenPriceAssets = useMemo(
    () => [
      ...(ibcBalance?.map(({ denom }) => {
        const hash = denom.replace("ibc/", "");
        return {
          id: `native:${denom}`,
          decimals: ibcWhitelist?.[hash]?.decimals ?? 6
        };
      }) ?? []),
      ...(tokens.list
        ?.filter(token => token.balance !== "0" && token.address)
        .map(token => ({
          id: `cw20:${token.address}`,
          decimals: token.decimals ?? 6
        })) ?? [])
    ],
    [ibcBalance, ibcWhitelist, tokens.list]
  );
  const { data: marketAssetPrices = {} } = useMarketAssetUsdPrices(
    tokenPriceAssets,
    pricesEnabled && !isClassicTestnet
  );
  useEffect(() => {
    setDeferTokens(true);
    setPricesEnabled(false);
    const tokenTimer = setTimeout(() => setDeferTokens(false), 800);
    const priceTimer = setTimeout(() => setPricesEnabled(true), 800);
    return () => {
      clearTimeout(tokenTimer);
      clearTimeout(priceTimer);
    };
  }, [address]);
  return (
    <>
      <Card
        title={<span className={s.cardTitleText}>Coins</span>}
        bordered
        headerClassName={s.cardTitle}
        actions={
          <label className={s.toggle}>
            <input
              type="checkbox"
              checked={hideLowValueAssets}
              onChange={() => setHideLowValueAssets(!hideLowValueAssets)}
            />
            <span className={s.toggleTrack} />
            <span className={s.toggleLabel}>Hide low-balance</span>
          </label>
        }
      >
        {nativeBlanace?.length ? (
          <div className={s.cardBodyContainer}>
            <AvailableList
              list={nativeBlanace}
              showLowValueCoins={!hideLowValueAssets}
              pricesEnabled={pricesEnabled && !isClassicTestnet}
            />
          </div>
        ) : (
          <Card>
            <Info icon="info_outline" title="">
              This account doesn't hold any coins yet.
            </Info>
          </Card>
        )}
      </Card>

      {(tokens?.list?.filter(t => t.balance !== "0").length ||
        ibcBalance?.length) &&
      !tokens?.loading ? (
        <Card
          title={<span className={s.cardTitleText}>Tokens</span>}
          bordered
          headerClassName={s.cardTitle}
          actions={
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={hideLowValueTokens}
                onChange={() => setHideLowValueTokens(!hideLowValueTokens)}
              />
              <span className={s.toggleTrack} />
              <span className={s.toggleLabel}>Hide low-balance</span>
            </label>
          }
        >
          <div className={s.cardBodyContainer}>
            {[
              ...(ibcBalance?.map(balance => {
                const hash = balance.denom.replace("ibc/", "");
                const decimals = ibcWhitelist?.[hash]?.decimals ?? 6;
                const value = new BigNumber(balance.amount.toString()).div(
                  new BigNumber(10).pow(decimals)
                );
                const usdPrice =
                  marketAssetPrices[`native:${balance.denom}`.toLowerCase()];
                return {
                  key: balance.denom,
                  type: "ibc" as const,
                  value,
                  denom: balance.denom,
                  amount: balance.amount.toString(),
                  decimals,
                  usdValue:
                    usdPrice === undefined
                      ? undefined
                      : value.multipliedBy(usdPrice).toNumber(),
                  name: undefined,
                  icon: undefined,
                  address: undefined
                };
              }) ?? []),
              ...(tokens?.list
                ?.filter(t => t.balance !== "0")
                .map(t => {
                  const decimals = t.decimals ?? 6;
                  const value = new BigNumber(t.balance).div(
                    new BigNumber(10).pow(decimals)
                  );
                  const usdPrice = t.address
                    ? marketAssetPrices[`cw20:${t.address}`.toLowerCase()]
                    : undefined;
                  return {
                    key: t.address ?? t.symbol,
                    type: "cw20" as const,
                    value,
                    denom: t.symbol,
                    amount: t.balance,
                    decimals,
                    usdValue:
                      usdPrice === undefined
                        ? undefined
                        : value.multipliedBy(usdPrice).toNumber(),
                    icon: t.icon,
                    address: t.address,
                    name: t.name
                  };
                }) ?? [])
            ]
              .filter(item => {
                if (!hideLowValueTokens) return true;
                return item.value.gte(0.01);
              })
              .sort((a, b) => {
                if (a.usdValue !== undefined || b.usdValue !== undefined) {
                  return (b.usdValue ?? -1) - (a.usdValue ?? -1);
                }
                return b.value.comparedTo(a.value) ?? 0;
              })
              .map(item =>
                item.type === "ibc" ? (
                  <Available
                    key={item.key}
                    denom={item.denom}
                    amount={item.amount}
                    usdValue={item.usdValue}
                    showUsdValue
                  />
                ) : (
                  <AmountCard
                    key={item.key}
                    denom={item.denom}
                    amount={item.amount}
                    icon={item.icon ?? cwFallbackIcon}
                    fallbackIcon={cwFallbackIcon}
                    name={item.name}
                    assetId={item.address}
                    usdValue={item.usdValue}
                    showUsdValue
                    decimals={item.decimals}
                    linkTo={
                      item.address
                        ? `/${name}/address/${item.address}`
                        : undefined
                    }
                  />
                )
              )}
          </div>
        </Card>
      ) : tokens?.loading ? (
        <Card
          title={<span className={s.cardTitleText}>Tokens</span>}
          bordered
          headerClassName={s.cardTitle}
        >
          <div className={s.cardBodyContainer}>
            <Loading />
          </div>
        </Card>
      ) : null}
      {isClassic && !isClassicTestnet ? <OldVesting address={address} /> : null}
    </>
  );
};

export default TokenBalance;
