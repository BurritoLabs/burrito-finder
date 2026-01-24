import { AccAddress } from "@terra-money/terra.js";
import { percent } from "../../scripts/math";
import Finder from "../../components/Finder";
import format from "../../scripts/format";
import s from "./Informations.module.scss";
import { useValidator } from "../../queries/staking";

const Informations = ({ address }: { address: string }) => {
  const { data: validator } = useValidator(address);

  if (!validator) return null;

  const validatorInfo = validator?.commission
    ? [
        {
          label: "Max commission rate",
          value: percent(
            validator.commission.commission_rates.max_rate.toString()
          )
        },
        {
          label: "Max daily commission change",
          value: percent(
            validator.commission.commission_rates.max_change_rate.toString()
          )
        },
        {
          label: "Last commission change",
          value: `${format.date(validator.commission.update_time)}`
        }
      ]
    : [];

  /* render */
  const list = [
    {
      label: "Operator address",
      value: validator.operator_address
    },
    {
      label: "Account address",
      value: (
        <Finder q="account">
          {AccAddress.fromValAddress(validator.operator_address)}
        </Finder>
      )
    },
    ...validatorInfo
  ];

  return (
    <ul className={s.list}>
      {list.map(({ label, value }) => (
        <li key={label}>
          <h1>{label}</h1>
          <p>{value}</p>
        </li>
      ))}
    </ul>
  );
};

export default Informations;
