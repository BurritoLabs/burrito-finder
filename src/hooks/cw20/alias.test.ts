import { describe, expect, it } from "vitest";
import alias from "./alias";

describe("CW20 GraphQL query builder", () => {
  it("builds a Classic contract-store query with escaped JSON", () => {
    const query = alias([
      {
        contract: "terra1classic",
        msg: { balance: { address: "terra1account" } },
        isClassic: true,
        address: "terra1account"
      }
    ]);

    expect(query).toContain("terra1classic: WasmContractsContractAddressStore");
    expect(query).toContain('ContractAddress: "terra1classic"');
    expect(query).toContain(
      'QueryMsg: "{\\"balance\\":{\\"address\\":\\"terra1account\\"}}"'
    );
  });

  it("builds a Phoenix contract query without object coercion", () => {
    const query = alias([
      {
        contract: "terra1phoenix",
        msg: { balance: { address: "terra1account" } },
        address: "terra1account"
      }
    ]);

    expect(query).toContain("terra1phoenix: wasm");
    expect(query).toContain('contractAddress: "terra1phoenix"');
    expect(query).toContain('address: "terra1account"');
    expect(query).not.toContain("[object Object]");
  });
});
