import {
  useContracts,
  useNFTContracts,
  useWhitelist
} from "../../hooks/useTerraAssets";
import WithFetch from "../../HOCs/WithFetch";
import Loading from "../../components/Loading";
import Image from "../../components/Image";
import s from "./ContractInfo.module.scss";

const ContractInfo = ({ address }: { address: string }) => {
  const token = useWhitelist()?.[address];
  const nft = useNFTContracts()?.[address];
  const contract = useContracts()?.[address];

  const whitelist = token || contract || nft;
  const icon = whitelist?.icon;
  const cwFallbackIcon =
    "https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/CW.svg";
  const iconCandidates = [icon, cwFallbackIcon].filter(Boolean) as string[];

  const tokenInfoQuery = btoa(JSON.stringify({ token_info: {} }));

  return whitelist ? (
    <section className={s.wrapper}>
      <Image urls={iconCandidates} className={s.icon} />
      {token ? (
        <span className={s.name}>
          {`${token.protocol} ${token.symbol} Token `}
          <span className={s.vertical} />
          <span className={s.symbol}>{token.symbol}</span>
        </span>
      ) : (
        <span className={s.name}>
          {nft?.name || `${contract?.protocol} ${contract?.name}`}
        </span>
      )}
    </section>
  ) : (
    <WithFetch
      url={`/cosmwasm/wasm/v1/contract/${address}/smart/${tokenInfoQuery}`}
      loading={<Loading />}
      renderError={() => null}
      lcd
    >
      {({ data }) => (
        <section className={s.wrapper}>
          <Image urls={[cwFallbackIcon]} className={s.icon} />
          <span className={s.name}>
            {data?.name}
            <span className={s.vertical} />
            <span className={s.symbol}>{data?.symbol}</span>
          </span>
        </section>
      )}
    </WithFetch>
  );
};

export default ContractInfo;
