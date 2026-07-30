import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AccAddress, ValAddress } from "../../libs/address";
import { useTns } from "../../libs/tns";
import { isTnsName } from "../../libs/tnsName";
import { getEndpointByKeyword } from "../../scripts/utility";
import { useCurrentChain } from "../../contexts/ChainsContext";
import Loading from "../../components/Loading";
import useContractInfo from "../../queries/wasm";
import {
  useContracts,
  useNFTContracts,
  useWhitelist
} from "../../hooks/useTerraAssets";
import {
  axiosGetWithEndpointFallback,
  getLcdFallbackBases
} from "../../queries/endpointFallback";
import Account from "./Account";
import Contract from "./Contract";

const Address = () => {
  const { address = "" } = useParams();
  const normalizedAddress = address.trim().toLowerCase();
  const baseWhitelist = useWhitelist();
  const contracts = useContracts();
  const nfts = useNFTContracts();
  const isKnownContractBase =
    !!baseWhitelist?.[normalizedAddress] ||
    !!contracts?.[normalizedAddress] ||
    !!nfts?.[normalizedAddress];
  const isValidAccountAddress = AccAddress.validate(address.trim());
  const isDeterministicContract = AccAddress.isContract(address.trim());
  const { name, lcd, chainID } = useCurrentChain();
  const shouldProbeContract =
    isValidAccountAddress && !isKnownContractBase && !isDeterministicContract;
  const { data: isProbedContract, isLoading: isContractProbeLoading } =
    useQuery({
      queryKey: ["addressContractKind", normalizedAddress, lcd, chainID],

      queryFn: async () => {
        try {
          await axiosGetWithEndpointFallback(
            `${lcd}/cosmwasm/wasm/v1/contract/${normalizedAddress}`,
            {},
            getLcdFallbackBases(lcd, chainID)
          );
          return true;
        } catch {
          return false;
        }
      },

      enabled: shouldProbeContract,
      retry: false
    });
  const isKnownContract =
    isKnownContractBase || isDeterministicContract || isProbedContract === true;
  const { data: contractInfo, isLoading } = useContractInfo(
    address,
    isKnownContract
  );
  const [resolvedAddress, setResolvedAddress] = useState("");
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

  return isContractProbeLoading || isLoading ? (
    <Loading />
  ) : contractInfo || isKnownContract ? (
    <Contract {...(contractInfo ?? {})} />
  ) : (
    <Account />
  );
};

export default Address;
