import SelectNetworks from "./SelectNetworks";
import s from "./SelectOptions.module.scss";

type Props = {
  variant?: "header" | "home";
};

const SelectOptions = ({ variant = "header" }: Props) => {
  const rightClass = variant === "home" ? s.rightHome : s.rightHeader;
  return (
    <>
      <SelectNetworks className={rightClass} />
    </>
  );
};

export default SelectOptions;
