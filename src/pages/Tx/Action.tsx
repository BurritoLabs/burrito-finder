import { TxDescription } from "@terra-money/react-base-components";
import { useNavigate } from "react-router-dom";
import { useCurrentChain } from "../../contexts/ChainsContext";
import s from "./Action.module.scss";

const Action = ({ action }: { action: string }) => {
  const navigate = useNavigate();
  const { name, chainID, lcd } = useCurrentChain();

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
      <TxDescription
        network={{ chainID, URL: lcd ?? "", name }}
        config={{ printCoins: 3 }}
      >
        {action}
      </TxDescription>
    </span>
  );
};

export default Action;
