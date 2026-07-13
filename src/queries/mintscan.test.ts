import { normalizeMintscanTx } from "./mintscan";

test("normalizes Mintscan typed transaction and message wrappers", () => {
  const normalized = normalizeMintscanTx({
    chain_id: "phoenix-1",
    tx: {
      "@type": "/cosmos.tx.v1beta1.Tx",
      "/cosmos-tx-v1beta1-Tx": {
        body: {
          messages: [
            {
              "@type": "/cosmwasm.wasm.v1.MsgExecuteContract",
              "/cosmwasm-wasm-v1-MsgExecuteContract": {
                sender: "terra1sender",
                contract: "terra1contract",
                msg: "e30="
              }
            }
          ]
        },
        auth_info: { fee: { amount: [], gas_limit: "1" } }
      }
    }
  });

  expect(normalized.chainId).toBe("phoenix-1");
  expect(normalized.tx.body.messages[0]).toEqual({
    "@type": "/cosmwasm.wasm.v1.MsgExecuteContract",
    sender: "terra1sender",
    contract: "terra1contract",
    msg: "e30="
  });
});
