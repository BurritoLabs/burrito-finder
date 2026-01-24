import React from "react";
import { isEmpty } from "lodash";
import BigNumber from "bignumber.js";
import { Coin } from "@terra-money/terra.js";
import Table from "../../components/Table";
import Amount from "../../components/Amount";
import Card from "../../components/Card";
import NoMoreData from "../../components/NoMoreData";
import Denom from "../../components/Denom";
import Image from "../../components/Image";
import { useIsClassic } from "../../contexts/ChainsContext";
import format from "../../scripts/format";
import { ASSET_URL, isIbcDenom } from "../../scripts/utility";
import { useIBCWhitelist } from "../../hooks/useTerraAssets";
import s from "./Rewards.module.scss";

const Rewards = ({ title, list }: { title: string; list: Coin[] }) => {
  const isClassic = useIsClassic();
  const ibcWhitelist = useIBCWhitelist();
  const ibcFallbackIcon =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/IBC.svg";
  const cwFallbackIcon =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/CW.svg";
  const fallbackIcon =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='32' fill='%23304036'/><path d='M32 18a14 14 0 100 28 14 14 0 000-28z' fill='%235a6b65'/></svg>";

  return (
    <Card title={title} bordered>
      {!isEmpty(list) ? (
        <Table>
          <thead>
            <tr>
              <th>Coin</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {list
              .slice()
              .sort((a, b) =>
                new BigNumber(b.amount.toString()).comparedTo(
                  a.amount.toString()
                )
              )
              .map(({ denom, amount }, index) => {
                const isIbc = isIbcDenom(denom);
                const hash = isIbc ? denom.replace("ibc/", "") : "";
                const ibcInfo = isIbc ? ibcWhitelist?.[hash] : undefined;
                const displayDenom = isIbc
                  ? ibcInfo?.symbol ?? denom
                  : format.denom(denom, isClassic);
                const classicIconDenom =
                  denom === "uluna"
                    ? "LUNC"
                    : format.denom(denom, false).toUpperCase();
                const mainnetIconDenom =
                  denom === "uluna" ? "Luna" : displayDenom;
                const iconDenom = isClassic
                  ? classicIconDenom
                  : mainnetIconDenom;
                const classicStable =
                  isClassic && format.denom(denom, true).endsWith("TC");
                const isMainnetLuna = !isClassic && denom === "uluna";
                const lunaIcons = [
                  `${ASSET_URL}/icon/svg/Luna.svg`,
                  `${ASSET_URL}/icon/svg/LUNA.svg`,
                  `${ASSET_URL}/icon/60/Luna.png`,
                  `${ASSET_URL}/icon/60/LUNA.png`
                ];
                const iconCandidates = [
                  ibcInfo?.icon,
                  ...(isIbc ? [ibcFallbackIcon] : []),
                  ...(isMainnetLuna ? lunaIcons : []),
                  ...(isMainnetLuna
                    ? []
                    : [
                        `${ASSET_URL}/icon/60/${iconDenom}.png`,
                        `${ASSET_URL}/icon/svg/${iconDenom}.svg`,
                        `${ASSET_URL}/icon/60/${String(
                          iconDenom
                        ).toLowerCase()}.png`
                      ]),
                  ...(classicStable
                    ? [
                        `${ASSET_URL}/icon/svg/USTC.svg`,
                        `${ASSET_URL}/icon/60/USTC.png`,
                        `${ASSET_URL}/icon/60/ustc.png`
                      ]
                    : [])
                ].filter(Boolean) as string[];
                if (!isIbc) {
                  iconCandidates.push(cwFallbackIcon);
                }
                iconCandidates.push(fallbackIcon);

                return (
                  <tr key={index}>
                    <td>
                      <span className={s.denom}>
                        <Image urls={iconCandidates} size={18} />
                        <Denom denom={denom} />
                      </span>
                    </td>
                    <td className="text-right">
                      <Amount>{amount.toString()}</Amount>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      ) : (
        <NoMoreData context={title} />
      )}
    </Card>
  );
};

export default Rewards;
