import { Fragment, ReactNode, useMemo } from "react";
import { AccAddress, ValAddress } from "@terra-money/terra.js";
import { useCurrentChain, useIsClassic } from "../../contexts/ChainsContext";
import {
  ContractList,
  IBCTokenList,
  TokenList,
  useIBCWhitelist
} from "../../hooks/useTerraAssets";
import { useValidators } from "../../queries/staking";
import format from "../../scripts/format";

const COIN_PATTERN =
  /^\d+((terra1[a-z0-9]{58})|(terra1[a-z0-9]{38})|(u[a-z]{1,4})|(ibc\/[A-Za-z0-9]{64}))/;

const truncate = (address: string) =>
  `${address.slice(0, 8)}...${address.slice(-6)}`;

const parseCoin = (coin: string) => {
  const match = coin.match(/^(\d+)(.+)$/);
  return match ? { amount: match[1], token: match[2] } : undefined;
};

const isCoinText = (word: string) =>
  COIN_PATTERN.test(word) || word.includes("ibc");

const finderURL = (
  chainID: string,
  type: "address" | "validator",
  address: string
) => `https://finder.terra.money/${chainID}/${type}/${address}`;

const FinderLink = ({
  address,
  validator = false,
  children
}: {
  address: string;
  validator?: boolean;
  children: ReactNode;
}) => {
  const { chainID } = useCurrentChain();
  return (
    <a
      href={finderURL(chainID, validator ? "validator" : "address", address)}
      onClick={event => event.stopPropagation()}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
};

const ValidatorAddress = ({ address }: { address: string }) => {
  const { data: validators } = useValidators();
  const moniker = validators?.find(
    validator => validator.operator_address === address
  )?.description.moniker;

  return (
    <FinderLink address={address} validator>
      {moniker ?? truncate(address)}
    </FinderLink>
  );
};

const TerraAddress = ({
  address,
  tokens,
  contracts
}: {
  address: string;
  tokens: TokenList;
  contracts: ContractList;
}) => {
  const contract = contracts[address];
  const contractName = [contract?.protocol, contract?.name]
    .filter(Boolean)
    .join(" ");
  const label = contractName || tokens[address]?.symbol || truncate(address);

  return <FinderLink address={address}>{label}</FinderLink>;
};

const Coin = ({
  value,
  tokens,
  ibcTokens,
  isClassic
}: {
  value: string;
  tokens: TokenList;
  ibcTokens: IBCTokenList;
  isClassic: boolean;
}) => {
  const parsed = parseCoin(value);
  if (!parsed) return <strong>{value}</strong>;

  const { amount, token } = parsed;
  const tokenInfo = tokens[token];
  const ibcInfo = ibcTokens[token.replace("ibc/", "")];
  const decimals = tokenInfo?.decimals ?? ibcInfo?.decimals ?? 6;
  let unit: ReactNode = token;

  if (AccAddress.validate(token)) {
    unit = (
      <FinderLink address={token}>
        {tokenInfo?.symbol ?? truncate(token)}
      </FinderLink>
    );
  } else if (/^u[a-z]{2,}$/.test(token)) {
    const denom = format.denom(token);
    unit = isClassic ? (denom === "Luna" ? "Lunc" : `${denom}C`) : denom;
  } else if (ibcInfo) {
    unit = ibcInfo.symbol;
  }

  return (
    <strong>
      {format.amount(amount, decimals)} {unit}
    </strong>
  );
};

const Coins = ({
  value,
  tokens,
  ibcTokens,
  isClassic,
  printCoins
}: {
  value: string;
  tokens: TokenList;
  ibcTokens: IBCTokenList;
  isClassic: boolean;
  printCoins: number;
}) => {
  const trailingComma = value.endsWith(",");
  const coins = (trailingComma ? value.slice(0, -1) : value).split(",");

  if (coins.length > printCoins) return <strong>multiple coins</strong>;

  return (
    <>
      {coins.map((coin, index) => (
        <Fragment key={`${coin}-${index}`}>
          {index > 0 && ", "}
          <Coin
            value={coin}
            tokens={tokens}
            ibcTokens={ibcTokens}
            isClassic={isClassic}
          />
        </Fragment>
      ))}
      {trailingComma && ","}
    </>
  );
};

const Word = ({ value, bold }: { value: string; bold: boolean }) => {
  const content = /^u[a-z]{2,}$/.test(value) ? format.denom(value) : value;
  return bold ? <strong>{content}</strong> : <span>{content}</span>;
};

const TxDescription = ({
  sentence,
  tokens,
  contracts,
  printCoins = 3
}: {
  sentence: string;
  tokens: TokenList;
  contracts: ContractList;
  printCoins?: number;
}) => {
  const isClassic = useIsClassic();
  const words = useMemo(() => sentence.split(" "), [sentence]);
  const ibcDenoms = useMemo(
    () =>
      Array.from(
        new Set(
          words
            .flatMap(word => word.split(","))
            .map(parseCoin)
            .map(coin => coin?.token)
            .filter((token): token is string => !!token?.startsWith("ibc/"))
        )
      ),
    [words]
  );
  const ibcTokens = useIBCWhitelist(ibcDenoms);

  const renderWord = (word: string, index: number) => {
    if (ValAddress.validate(word)) {
      return <ValidatorAddress address={word} />;
    }
    if (AccAddress.validate(word)) {
      return (
        <TerraAddress address={word} tokens={tokens} contracts={contracts} />
      );
    }
    if (isCoinText(word)) {
      return (
        <Coins
          value={word}
          tokens={tokens}
          ibcTokens={ibcTokens}
          isClassic={isClassic}
          printCoins={printCoins}
        />
      );
    }
    return <Word value={word} bold={index === 0} />;
  };

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          {index > 0 && " "}
          {renderWord(word, index)}
        </Fragment>
      ))}
    </>
  );
};

export default TxDescription;
