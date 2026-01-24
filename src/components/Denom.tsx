import { useIsClassic } from "../contexts/ChainsContext";
import useDenomMetadata from "../hooks/useDenomMetadata";
import useDenomTrace from "../hooks/useDenomTrace";
import format from "../scripts/format";
import s from "./Denom.module.scss";

const Denom = ({ denom }: { denom: string }) => {
  const isClassic = useIsClassic();
  const isFactory = denom.startsWith("factory/");
  const metadata = useDenomMetadata(isFactory);
  const ibc = useDenomTrace(denom);
  const factoryMetadata = isFactory ? metadata?.get(denom) : undefined;
  const factoryLabel =
    factoryMetadata?.symbol ||
    factoryMetadata?.display ||
    factoryMetadata?.name;
  const factorySuffix = denom.includes("/") ? denom.split("/").pop() : denom;
  const render = ibc
    ? format.denom(ibc.base_denom)
    : isFactory
    ? factoryLabel || factorySuffix
    : format.denom(denom, isClassic);
  const path = ibc?.path?.split("/");

  return (
    <>
      {render}{" "}
      {path && <span className={s.ibc}>({path[path.length - 1]})</span>}
    </>
  );
};

export default Denom;
