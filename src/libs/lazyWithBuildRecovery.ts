import { ComponentType, lazy } from "react";

const RELOAD_KEY = "burrito-finder:stale-build-reload";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type RecoveryOptions = {
  storage?: StorageLike;
  reload?: () => void;
};

const getDefaultOptions = (): Required<RecoveryOptions> => ({
  storage: window.sessionStorage,
  reload: () => {
    const url = new URL(window.location.href);
    url.searchParams.set("build-reload", Date.now().toString());
    window.location.replace(url);
  }
});

export const importWithBuildRecovery = async <T>(
  loader: () => Promise<T>,
  options?: RecoveryOptions
): Promise<T> => {
  const defaults = getDefaultOptions();
  const storage = options?.storage ?? defaults.storage;
  const reload = options?.reload ?? defaults.reload;

  try {
    const loaded = await loader();
    storage.removeItem(RELOAD_KEY);
    return loaded;
  } catch (error) {
    if (storage.getItem(RELOAD_KEY)) throw error;

    storage.setItem(RELOAD_KEY, "1");
    reload();

    // Keep the lazy boundary suspended while the browser loads the fresh build.
    return new Promise<T>(() => undefined);
  }
};

export const lazyWithBuildRecovery = <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) => lazy(() => importWithBuildRecovery(loader));
