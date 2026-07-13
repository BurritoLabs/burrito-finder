import { TxDescription } from "@terra-money/react-base-components";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { useCurrentChain } from "../../contexts/ChainsContext";
import { useWhitelist } from "../../hooks/useTerraAssets";
import s from "./Action.module.scss";

const tokenAddressPattern = /terra1[a-z0-9]{38,58}/g;

const shortAddress = (address: string) =>
  `${address.slice(0, 8)}...${address.slice(-6)}`;

const Action = ({ action }: { action: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { name, chainID, lcd } = useCurrentChain();
  const tokenAddresses = useMemo(
    () => Array.from(new Set(action.match(tokenAddressPattern) ?? [])),
    [action]
  );
  const tokens = useWhitelist(tokenAddresses);
  const [tokenCacheReady, setTokenCacheReady] = useState(
    tokenAddresses.length === 0
  );

  useEffect(() => {
    tokenAddresses.forEach(address => {
      queryClient.setQueryData(
        ["token", address],
        tokens[address] ?? {
          symbol: shortAddress(address),
          name: shortAddress(address),
          decimals: 6
        }
      );
    });
    setTokenCacheReady(true);
  }, [queryClient, tokenAddresses, tokens]);

  const toLocalRoute = (href: string) => {
    try {
      const url = new URL(href, window.location.origin);
      const host = url.hostname;
      if (
        host !== "finder.terra.money" &&
        host !== "finder.terra.dev" &&
        !host.endsWith(".terra.money")
      ) {
        return null;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;

      const [, type, value] = parts;
      if (!type || !value) return null;

      if (
        ![
          "address",
          "validator",
          "contract",
          "account",
          "tx",
          "block"
        ].includes(type)
      ) {
        return null;
      }

      const localType =
        type === "contract" || type === "account" ? "address" : type;
      return `/${name}/${localType}/${value}`;
    } catch {
      return null;
    }
  };

  const handleLinkClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a");
    if (!anchor) return;
    const local = toLocalRoute(anchor.getAttribute("href") ?? "");
    if (!local) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(local);
  };

  return (
    <span
      className={s.wrapper}
      onClick={handleLinkClick}
      onClickCapture={handleLinkClick}
    >
      {tokenCacheReady && (
        <TxDescription
          network={{ chainID, URL: lcd ?? "", name }}
          config={{ printCoins: 3 }}
        >
          {action}
        </TxDescription>
      )}
    </span>
  );
};

export default Action;
