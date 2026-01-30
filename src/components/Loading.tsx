import React from "react";
import { useIsFetching } from "react-query";
import s from "./Loading.module.scss";

const Loading = ({ global }: { global?: boolean }) => {
  const isFetching = useIsFetching();
  if (!global && isFetching > 0) return null;
  return (
    <div className={s[`loader-wrapper`]}>
      <div className={s[`loader`]}>
        <div className={s[`a`]}></div>
        <div className={s[`b`]}></div>
      </div>
    </div>
  );
};

export default Loading;
