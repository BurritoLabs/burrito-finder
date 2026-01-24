import React, { useEffect, useMemo, useState } from "react";
import c from "classnames";
import { readPercent } from "@terra.kitchen/utils";
import BigNumber from "bignumber.js";
import { prependProtocol } from "../../scripts/utility";
import Amount from "../../components/Amount";
import Card from "../../components/Card";
import ValidatorStatus from "../../components/ValidatorStatus";
import { useTerraValidator } from "../../queries/TerraAPI";
import s from "./Header.module.scss";

import { ReactComponent as Terra } from "../../Terra.svg";
import {
  useValidator,
  useSelfDelegationAmount,
  useStakingPool
} from "../../queries/staking";
import { useIsClassic } from "../../contexts/ChainsContext";

const thumbnail = { className: s.thumbnail, width: 80, height: 80 };
const KEYBASE_PROXY_URL = "https://keybase.burrito.money";
const Header = ({ address }: { address: string }) => {
  const { data: terraValidator } = useTerraValidator(address);
  const { data: validator } = useValidator(address);
  const { data: stakingPool } = useStakingPool();
  const { data: selfDelegationAmount } = useSelfDelegationAmount(address);
  useIsClassic();
  const [keybasePicture, setKeybasePicture] = useState<string>();
  const keybaseIdentity = validator?.description.identity;

  const votingPowerRate = useMemo(() => {
    const bondedTokens = stakingPool?.bonded_tokens?.amount;
    if (!validator?.tokens || !bondedTokens) return undefined;
    const total = new BigNumber(bondedTokens.toString());
    if (total.isZero()) return undefined;
    return new BigNumber(validator.tokens.toString()).div(total).toNumber();
  }, [stakingPool?.bonded_tokens?.amount, validator?.tokens]);

  const selfDelegationRate = useMemo(() => {
    if (!validator?.tokens || selfDelegationAmount === undefined) {
      return undefined;
    }

    const total = new BigNumber(validator.tokens.toString());
    if (total.isZero()) return undefined;
    return new BigNumber(selfDelegationAmount.toString()).div(total).toNumber();
  }, [selfDelegationAmount, validator?.tokens]);

  useEffect(() => {
    let cancelled = false;
    setKeybasePicture(undefined);

    if (!keybaseIdentity) return () => undefined;

    const load = async () => {
      try {
        const response = await fetch(
          `${KEYBASE_PROXY_URL}/?identity=${keybaseIdentity}`
        );
        const data = await response.json();
        const picture = data?.picture;
        if (!cancelled) {
          setKeybasePicture(picture);
        }
      } catch {
        if (!cancelled) setKeybasePicture(undefined);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [keybaseIdentity]);

  return (
    <Card
      title={
        <header className={s.header}>
          {terraValidator?.picture ? (
            <img src={terraValidator.picture} alt="" {...thumbnail} />
          ) : keybasePicture ? (
            <img src={keybasePicture} alt="" {...thumbnail} />
          ) : (
            <Terra {...thumbnail} />
          )}
          <section>
            <h1 className={s.moniker}>
              {validator?.description.moniker}
              <ValidatorStatus
                validatorAddress={validator?.operator_address ?? ""}
                className={s.status}
              />
            </h1>
            <p className={s.p}>
              {validator?.description.website && (
                <a
                  href={prependProtocol(validator.description.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {validator.description.website}
                </a>
              )}
            </p>
            <p className={s.p}>{validator?.description.details}</p>
          </section>
        </header>
      }
      bordered
    >
      {validator && (
        <div className={c("row", s.summary)}>
          <article className="col">
            <h1>Voting power</h1>
            <p>{readPercent(votingPowerRate)}</p>
            <hr />
            <Amount fontSize={14} denom="uluna" decimals={6}>
              {validator.tokens.toString()}
            </Amount>
          </article>

          <article className="col">
            <h1>Self-delegation</h1>
            <p>{readPercent(selfDelegationRate)}</p>
            <hr />
            {selfDelegationAmount !== undefined ? (
              <Amount fontSize={14} denom="uluna">
                {selfDelegationAmount.toString()}
              </Amount>
            ) : (
              <span style={{ fontSize: 14 }}>-</span>
            )}
          </article>

          <article className="col">
            <h1>Commission</h1>
            <p>
              {readPercent(
                validator.commission.commission_rates.rate.toString(),
                { fixed: 1 }
              )}
            </p>
          </article>

          {terraValidator?.time_weighted_uptime ? (
            <article className="col">
              <h1>
                Uptime <span className="desktop">(Last 10k blocks)</span>
              </h1>
              <p>
                {readPercent(terraValidator.time_weighted_uptime ?? 0, {
                  fixed: 2
                })}
              </p>
            </article>
          ) : null}
        </div>
      )}
    </Card>
  );
};

export default Header;
