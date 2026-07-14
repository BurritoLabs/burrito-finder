import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useChains, useCurrentChain } from "../contexts/ChainsContext";

import s from "./SelectNetworks.module.scss";

type Props = {
  className?: string;
};
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

  const orderedChains = [...chains].sort((a, b) => {
    const order = ["classic", "mainnet"];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const displayLabel = (name: string) => (name === "mainnet" ? "LUNA" : "LUNC");
  const networkLabel = (name: string) =>
    name === "mainnet" ? "Phoenix (LUNA)" : "Classic (LUNC)";

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
          aria-label={`${networkLabel(currentChain.name)} network`}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <span className={s.label}>{displayLabel(currentChain.name)}</span>
          <span className={s.addon}>
            <ChevronDown aria-hidden="true" />
          </span>
        </button>
        {open ? (
          <ul className={s.menu}>
            {orderedChains.map(({ name }) => {
              const isActive = name === currentChain.name;
              return (
                <li key={name}>
                  <button
                    type="button"
                    aria-label={networkLabel(name)}
                    className={[s.option, isActive ? s.active : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setOpen(false);
                      changeChain(name);
                    }}
                  >
                    {displayLabel(name)}
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
