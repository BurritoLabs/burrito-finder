import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useChains, useCurrentChain } from "../contexts/ChainsContext";

import s from "./SelectNetworks.module.scss";

type Props = {
  className?: string;
};

const NETWORKS = {
  classic: { name: "Classic", ticker: "LUNC" },
  "classic-testnet": { name: "Rebel Testnet", ticker: "LUNC" },
  mainnet: { name: "Phoenix", ticker: "LUNA" },
  testnet: { name: "Pisco Testnet", ticker: "LUNA" }
} as const;

type PublicNetwork = keyof typeof NETWORKS;

const NETWORK_ORDER: PublicNetwork[] = [
  "classic",
  "classic-testnet",
  "mainnet",
  "testnet"
];

const isPublicNetwork = (name: string): name is PublicNetwork =>
  name in NETWORKS;

const SelectNetworks = (props: Props) => {
  const { className } = props;
  const chains = useChains();
  const currentChain = useCurrentChain();
  const params = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const changeChain = (value = "") => {
    const prev = params["*"];
    const isIndex = !prev;
    const name = isIndex && value === "classic" ? "" : "/" + value;
    navigate(`${name}/${params["*"]}`);
  };

  const orderedChains = chains
    .filter(chain => isPublicNetwork(chain.name))
    .sort(
      (a, b) =>
        NETWORK_ORDER.indexOf(a.name as PublicNetwork) -
        NETWORK_ORDER.indexOf(b.name as PublicNetwork)
    );

  const currentNetwork = isPublicNetwork(currentChain.name)
    ? NETWORKS[currentChain.name]
    : { name: currentChain.name, ticker: currentChain.chainID };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div
      className={[s.wrapper, className].filter(Boolean).join(" ")}
      ref={wrapperRef}
    >
      <div className={s.menuAnchor}>
        <button
          type="button"
          className={s.selectButton}
          aria-label={`${currentNetwork.name} (${currentNetwork.ticker}) network`}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <span className={s.label}>{currentNetwork.ticker}</span>
          <span className={s.addon}>
            <ChevronDown aria-hidden="true" />
          </span>
        </button>
        {open ? (
          <ul className={s.menu}>
            {orderedChains.map(({ name }) => {
              const network = NETWORKS[name as PublicNetwork];
              const isActive = name === currentChain.name;
              return (
                <li key={name}>
                  <button
                    type="button"
                    aria-label={`${network.name} (${network.ticker})`}
                    className={[s.option, isActive ? s.active : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setOpen(false);
                      changeChain(name);
                    }}
                  >
                    <span>{network.name}</span>
                    <span className={s.optionTicker}>{network.ticker}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default SelectNetworks;
