import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import c from "classnames";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Txs from "../Txs";
import Loading from "../../components/Loading";
import Finder from "../../components/Finder";
import {
  isClassicTestnetChainID,
  useCurrentChain
} from "../../contexts/ChainsContext";
import { fromISOTime } from "../../scripts/utility";
import NotFound from "../../components/NotFound";
import FetchError from "../../components/FetchError";
import apiClient from "../../apiClient";
import { useGetQueryURL } from "../../queries/query";
import { fetchClassicTestnetBlock } from "../../queries/classicTestnet";
import s from "./Block.module.scss";

const heightButton = (height: number) => (
  <span className={s.height}>
    <span>{height}</span>
    <Link to={`../blocks/${height - 1}`} aria-label="Previous block">
      <ChevronLeft aria-hidden="true" />
    </Link>
    <Link to={`../blocks/${height + 1}`} aria-label="Next block">
      <ChevronRight aria-hidden="true" />
    </Link>
  </span>
);

const Block = () => {
  const { height } = useParams();
  const { chainID, lcd } = useCurrentChain();
  const fcdPath = `/v1/blocks/${height}?chainId=${chainID}`;
  const queryURL = useGetQueryURL(fcdPath);
  const {
    data: blockData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["block", chainID, height],
    queryFn: async () => {
      if (isClassicTestnetChainID(chainID)) {
        return fetchClassicTestnetBlock(lcd, chainID, height ?? "");
      }
      const { data } = await apiClient.get<Block>(queryURL);
      return data;
    },
    enabled: !!height
  });

  if (isLoading) return <Loading />;
  if (isError) return <FetchError url={fcdPath} />;
  if (!blockData) return <NotFound keyword={height} />;

  return (
    <>
      <h2 className="title">
        Block<span>#{height}</span>
      </h2>
      <div className={c(s.list, s.blockInfo)}>
        <div className={s.row}>
          <div className={s.head}>Chain ID</div>
          <div className={s.body}>{blockData.chainId}</div>
        </div>
        <div className={s.row}>
          <div className={s.head}>Block height</div>
          <div className={s.body}>{heightButton(blockData.height)}</div>
        </div>
        <div className={s.row}>
          <div className={s.head}>Timestamp</div>
          <div className={s.body}>{fromISOTime(blockData.timestamp)}</div>
        </div>
        <div className={s.row}>
          <div className={s.head}>Transactions</div>
          <div className={s.body}>{blockData.txs.length}</div>
        </div>
        <div className={s.row}>
          <div className={s.head}>Proposer</div>
          <div className={s.body}>
            {blockData.proposer.operatorAddress ? (
              <Finder q={"validator"} v={blockData.proposer.operatorAddress}>
                {blockData.proposer.moniker}
              </Finder>
            ) : (
              blockData.proposer.moniker
            )}
          </div>
        </div>
      </div>

      <Txs txs={blockData.txs} />
    </>
  );
};

export default Block;
