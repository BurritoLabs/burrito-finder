const readEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = import.meta.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
};

export const runtimeEnv = {
  burritoApiUrl: readEnv("VITE_BURRITO_API_URL", "REACT_APP_BURRITO_API_URL"),
  clientErrorReporting: readEnv(
    "VITE_CLIENT_ERROR_REPORTING",
    "REACT_APP_CLIENT_ERROR_REPORTING"
  ),
  launchpadRegistryAddress: readEnv(
    "VITE_LAUNCHPAD_REGISTRY_ADDRESS",
    "REACT_APP_LAUNCHPAD_REGISTRY_ADDRESS"
  )
};
