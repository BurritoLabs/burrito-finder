import { runtimeEnv } from "./config/runtimeEnv";

export type ClientErrorKind =
  | "error"
  | "unhandledrejection"
  | "react"
  | "fetch";

type ErrorContext = {
  componentStack?: string;
  network?: string;
};

const API_BASE = (
  runtimeEnv.burritoApiUrl || "https://api.burrito.money"
).replace(/\/$/, "");
const REPORT_URL = `${API_BASE}/v1/finder/client-errors`;
const recentReports = new Map<string, number>();
const REPORT_DEDUP_MS = 60_000;

const asError = (value: unknown) => {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
};

const reportingEnabled = () =>
  window.location.hostname === "finder.burrito.money" ||
  runtimeEnv.clientErrorReporting === "true";

export const reportClientError = (
  kind: ClientErrorKind,
  value: unknown,
  context: ErrorContext = {}
) => {
  if (!reportingEnabled()) return;

  const error = asError(value);
  const signature = `${kind}:${error.message}:${error.stack?.slice(0, 200)}`;
  const now = Date.now();
  if (now - (recentReports.get(signature) ?? 0) < REPORT_DEDUP_MS) return;
  recentReports.set(signature, now);

  const payload = {
    kind,
    message: error.message.slice(0, 1_000) || "Unknown client error",
    stack: error.stack?.slice(0, 8_000),
    componentStack: context.componentStack?.slice(0, 8_000),
    url: `${window.location.origin}${window.location.pathname}`,
    network: context.network,
    userAgent: navigator.userAgent.slice(0, 500)
  };

  void fetch(REPORT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => undefined);
};

export const installGlobalErrorReporting = () => {
  window.addEventListener("error", event => {
    reportClientError("error", event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", event => {
    reportClientError("unhandledrejection", event.reason);
  });
};
