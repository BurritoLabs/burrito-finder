import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useChains, useCurrentChain } from "../contexts/ChainsContext";

import s from "./SelectNetworks.module.scss";

type Props = {
  className?: string;
};

const NETWORKS = {
  classic: {
    name: "Classic",
    ticker: "LUNC",
    logoSrc: "/system/lunc.svg",
    accentRgb: "56, 189, 248",
    testnet: false
  },
  "classic-testnet": {
    name: "Rebel Testnet",
    ticker: "LUNC",
    logoSrc: "/system/lunc.svg",
    accentRgb: "56, 189, 248",
    testnet: true
  },
  mainnet: {
    name: "Phoenix",
    ticker: "LUNA",
    logoSrc: "/system/luna.svg",
    accentRgb: "249, 115, 22",
    testnet: false
  },
  testnet: {
    name: "Pisco Testnet",
    ticker: "LUNA",
    logoSrc: "/system/luna.svg",
    accentRgb: "249, 115, 22",
    testnet: true
  }
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
    : {
        name: currentChain.name,
        ticker: currentChain.chainID,
        logoSrc: "/system/luna.svg",
        accentRgb: "249, 115, 22",
        testnet: currentChain.name.includes("testnet")
      };

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
          <span
            className={s.chainLogo}
            style={
              {
                "--option-chain-rgb": currentNetwork.accentRgb
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            <span>
              <img src={currentNetwork.logoSrc} alt="" />
            </span>
          </span>
          <span className={s.currentTicker}>{currentNetwork.ticker}</span>
          {currentNetwork.testnet ? (
            <span className={s.testnetLabel}>Testnet</span>
          ) : null}
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
                    style={
                      {
                        "--option-chain-rgb": network.accentRgb
                      } as React.CSSProperties
                    }
                    onClick={() => {
                      setOpen(false);
                      changeChain(name);
                    }}
                  >
                    <span className={s.chainLogo} aria-hidden="true">
                      <span>
                        <img src={network.logoSrc} alt="" />
                      </span>
                    </span>
                    <span className={s.optionName}>
                      <span>
                        {network.ticker}
                        {network.testnet ? (
                          <span className={s.optionTestnet}>Testnet</span>
                        ) : null}
                      </span>
                      <span>{network.name}</span>
                    </span>
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
