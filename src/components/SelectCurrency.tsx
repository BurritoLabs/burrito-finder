import { useEffect } from "react";
import { useCurrency } from "../contexts/CurrencyContext";
import { useDenoms } from "../queries/oracle";
import { getCookie } from "../scripts/cookie";
import { DEFAULT_CURRENCY } from "../scripts/utility";
import s from "./SelectCurrency.module.scss";

type Props = {
  className?: string;
};

const SelectCurrency = (props: Props) => {
  const { currency, setCurrency } = useCurrency();
  const { data: denoms } = useDenoms();
  const denom = denoms?.includes(currency) ? currency : DEFAULT_CURRENCY;

  useEffect(() => {
    if (!getCookie("currency") && navigator.cookieEnabled) {
      setCurrency(DEFAULT_CURRENCY);
    }
  }, [setCurrency]);

  return (
    <div className={props.className}>
      <select
        className={s.select}
        value={denom.substr(1).toUpperCase()}
        onChange={e => setCurrency(`u${e.target.value}`.toLowerCase())}
      >
        {denoms?.map((currency, key) => {
          const activeDenom = currency.substr(1).toUpperCase();
          return <option key={key}>{activeDenom}</option>;
        })}
      </select>
      <div className={s.addon}>
        <i className="material-icons">arrow_drop_down</i>
      </div>
    </div>
  );
};

export default SelectCurrency;
