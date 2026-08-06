interface Whitelist {
  protocol?: string;
  symbol: string;
  token: string;
  icon?: string;
  decimals?: number;
  name?: string;
  verificationStatus?: string;
  verificationMethod?: string;
  originChainId?: string;
  originDenom?: string;
  issuer?: string;
  transport?: string;
  provenanceLabel?: string;
  source?: string;
}

interface IBCWhitelist {
  denom: string;
  path?: string;
  base_denom: string;
  symbol: string;
  name: string;
  icon?: string;
  decimals?: number;
  verificationStatus?: string;
  verificationMethod?: string;
  originChainId?: string;
  originDenom?: string;
  issuer?: string;
  transport?: string;
  provenanceLabel?: string;
  source?: string;
}

interface Contracts {
  protocol?: string;
  name?: string;
  icon?: string;
}

interface NFTContracts {
  name: string;
  icon: string;
  contract: string;
}

interface ChainOption {
  name: string;
  chainID: string;
  lcd: string;
  api?: string;
  rpc?: string;
  mantle?: string;
  hive?: string;
}
