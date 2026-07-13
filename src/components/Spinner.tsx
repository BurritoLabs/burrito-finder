import { CSSProperties } from "react";
import c from "classnames";
import s from "./Spinner.module.scss";

type Props = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const Spinner = ({ size = 40, strokeWidth = 2, className }: Props) => (
  <span
    role="progressbar"
    aria-label="Loading"
    className={c(s.spinner, className)}
    style={
      {
        "--spinner-size": `${size}px`,
        "--spinner-stroke": `${strokeWidth}px`
      } as CSSProperties
    }
  />
);

export default Spinner;
