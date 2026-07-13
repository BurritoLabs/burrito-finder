import { expect, test } from "vitest";
import format from "./format";

test("never renders non-finite token amounts", () => {
  expect(format.amount("NaN")).toBe("0.000000");
  expect(format.amount("Infinity")).toBe("0.000000");
});
