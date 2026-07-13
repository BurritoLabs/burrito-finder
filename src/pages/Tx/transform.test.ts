import { toLogFinderTransaction } from "./transform";

describe("toLogFinderTransaction", () => {
  test("normalizes legacy messages and event attributes", () => {
    const transaction = toLogFinderTransaction({
      height: "123",
      txhash: "ABC",
      raw_log: "",
      logs: [
        {
          msg_index: "0",
          log: { tax: "" },
          events: [
            {
              type: "transfer",
              attributes: [{ key: "recipient", value: undefined }]
            }
          ]
        }
      ],
      gas_wanted: "100",
      gas_used: "90",
      tags: [],
      tx: {
        type: "core/StdTx",
        value: {
          msg: [
            {
              type: "bank/MsgSend",
              value: { from_address: "terra1from", to_address: "terra1to" }
            }
          ],
          fee: { amount: [], gas: "100" },
          signatures: [],
          memo: "memo"
        }
      },
      timestamp: new Date("2026-01-01T00:00:00.000Z")
    } as unknown as TxResponse);

    expect(transaction.height).toBe(123);
    expect(transaction.tx.body.messages[0]).toMatchObject({
      "@type": "/MsgSend",
      from_address: "terra1from",
      to_address: "terra1to"
    });
    expect(transaction.logs?.[0].log).toBe('{"tax":""}');
    expect(transaction.logs?.[0].events[0].attributes[0].value).toBe("");
  });
});
