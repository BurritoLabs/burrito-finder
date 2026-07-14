import React, { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentChain } from "../contexts/ChainsContext";
import { getEndpointByKeyword } from "../scripts/utility";
import s from "./Search.module.scss";

type Props = {
  className?: string;
};

const Search = ({ className }: Props) => {
  const [value, setValue] = useState(``);
  const { name } = useCurrentChain();
  const navigate = useNavigate();

  const handleSubmit: Submit = async e => {
    e.preventDefault();

    if (value) {
      navigate(`/${name}${getEndpointByKeyword(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={s.group}>
        <input
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={"Search Block / Tx / Account"}
          autoFocus
        />
        <button className={s.button} type="submit" aria-label="Search">
          <SearchIcon aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};

export default Search;
