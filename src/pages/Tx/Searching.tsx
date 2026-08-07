import { useEffect, useState } from "react";
import c from "classnames";
import { useCurrentChain } from "../../contexts/ChainsContext";
import s from "./Searching.module.scss";

const Searching = ({ state, hash }: { state: number; hash: string }) => {
  const progressState = (state / 1) * 100;
  const isSearch = progressState < 100;
  const searching = "#52c41a";
  const failed = "#ff5561";
  const { chainID } = useCurrentChain();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds(value => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [chainID, hash]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const fromNow = [minutes, seconds]
    .map(str => String(str).padStart(2, "0"))
    .join(":");

  return (
    <section className={s.page}>
      <section className={s.wrapper}>
        <span className={s.progressTitle}>
          {isSearch ? "Searching transaction" : "Transaction not found"}
        </span>
        <div
          className={
            isSearch
              ? c(s.progress, s.progressStriped, s.active)
              : c(s.progress, s.active)
          }
        >
          <div
            className={s.progressBar}
            style={{
              width: `${isSearch ? progressState : "100"}%`,
              backgroundColor: `${isSearch ? searching : failed}`
            }}
          />
        </div>
        <span
          className={s.timer}
          style={{ color: `${isSearch ? searching : failed}` }}
        >
          {fromNow}
        </span>
        <span className={s.text}>
          {isSearch
            ? "Please wait while looking for transaction"
            : "No such transaction was found"}
        </span>
      </section>
    </section>
  );
};

export default Searching;
