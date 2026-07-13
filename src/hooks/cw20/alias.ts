interface Item {
  address: string;
  contract: string;
  msg: object;
  isClassic?: boolean;
}

const graphQLString = (value: string) => JSON.stringify(value);

const aliasItem = ({ contract, msg, isClassic, address }: Item) =>
  isClassic
    ? `
    ${contract}: WasmContractsContractAddressStore(
      ContractAddress: ${graphQLString(contract)}
      QueryMsg: ${graphQLString(JSON.stringify(msg))}
    ) {
      Height
      Result
    }`
    : `${contract}: wasm{
      contractQuery( 
        contractAddress: ${graphQLString(contract)}
        query: {
          balance: {
            address: ${graphQLString(address)}
          }
        }
      )
    }`;

const alias = (list: Item[]) => `query {
  ${list.map(aliasItem).join("\n")}
}`;

export default alias;
