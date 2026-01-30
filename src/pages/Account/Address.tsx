import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValAddress } from "@terra-money/terra.js";
import { isTnsName, useTns } from "../../libs/tns";
import { getEndpointByKeyword } from "../../scripts/utility";
import { useCurrentChain } from "../../contexts/ChainsContext";
import Loading from "../../components/Loading";
import useContractInfo from "../../queries/wasm";
import {
  useContracts,
  useNFTContracts,
  useWhitelist
} from "../../hooks/useTerraAssets";
import Account from "./Account";
import Contract from "./Contract";

const Address = () => {
  const { address = "" } = useParams();
  const whitelist = useWhitelist();
  const contracts = useContracts();
  const nfts = useNFTContracts();
  const isKnownContract =
    !!whitelist?.[address] || !!contracts?.[address] || !!nfts?.[address];
  const { data: contractInfo, isLoading } = useContractInfo(
    address,
    isKnownContract
  );
  const [resolvedAddress, setResolvedAddress] = useState("");
  const { name } = useCurrentChain();
  const navigate = useNavigate();
  const { getTerraAddress } = useTns();

  useEffect(() => {
    const resolveTns = async () => {
      if (ValAddress.validate(address.trim())) {
        return navigate(`/${name}/validator/${address.trim()}`, {
          replace: true
        });
      }

      if (isTnsName(address.trim())) {
        const terraAddress = await getTerraAddress(address.trim());

        if (terraAddress) {
          return navigate(`/${name}${getEndpointByKeyword(terraAddress)}`, {
            replace: true
          });
        }
      }

      setResolvedAddress(address);
    };

    resolveTns().catch(() => {});
  }, [address, name, navigate, getTerraAddress]);

  if (resolvedAddress !== address) return <Loading />;

  return isLoading ? (
    <Loading />
  ) : contractInfo ? (
    <Contract {...contractInfo} />
  ) : (
    <Account />
  );
};

export default Address;
