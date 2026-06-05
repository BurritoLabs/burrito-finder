import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AccAddress, ValAddress } from "@terra-money/terra.js";
import apiClient from "../../apiClient";
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
  const normalizedAddress = address.trim().toLowerCase();
  const baseWhitelist = useWhitelist();
  const contracts = useContracts();
  const nfts = useNFTContracts();
  const isKnownContractBase =
    !!baseWhitelist?.[normalizedAddress] ||
    !!contracts?.[normalizedAddress] ||
    !!nfts?.[normalizedAddress];
  const isValidAccountAddress = AccAddress.validate(address.trim());
  const { name, lcd } = useCurrentChain();
  const shouldCheckAccount = isValidAccountAddress && !isKnownContractBase;
  const { data: accountKind, isLoading: isAccountKindLoading } = useQuery(
    ["addressAccountKind", normalizedAddress, lcd],
    async () => {
      const { status } = await apiClient.get(
        `${lcd}/cosmos/auth/v1beta1/accounts/${normalizedAddress}`,
        { validateStatus: status => status === 200 || status === 404 }
      );

      return status === 200 ? "account" : "unknown";
    },
    { enabled: shouldCheckAccount, retry: false }
  );
  const dynamicWhitelist = useWhitelist(
    accountKind === "unknown" ? [normalizedAddress] : []
  );
  const isKnownContract =
    isKnownContractBase || !!dynamicWhitelist?.[normalizedAddress];
  const shouldCheckContract =
    isKnownContract ||
    (isValidAccountAddress &&
      (!shouldCheckAccount ||
        (!isAccountKindLoading && accountKind !== "account")));
  const { data: contractInfo, isLoading } = useContractInfo(
    address,
    shouldCheckContract
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

  return isAccountKindLoading || isLoading ? (
    <Loading />
  ) : contractInfo ? (
    <Contract {...contractInfo} />
  ) : (
    <Account />
  );
};

export default Address;
