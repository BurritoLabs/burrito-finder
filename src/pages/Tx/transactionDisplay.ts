export type TransactionDisplayState = {
  balanceChangesApplied: boolean;
  label: "Success" | "Failed · rolled back";
};

export const getTransactionDisplayState = (
  code?: number
): TransactionDisplayState =>
  code
    ? { balanceChangesApplied: false, label: "Failed · rolled back" }
    : { balanceChangesApplied: true, label: "Success" };
