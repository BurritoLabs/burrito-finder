import { importWithBuildRecovery } from "./lazyWithBuildRecovery";

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
};

describe("importWithBuildRecovery", () => {
  it("returns a loaded route and clears an old recovery marker", async () => {
    const storage = createStorage();
    storage.setItem("burrito-finder:stale-build-reload", "1");

    await expect(
      importWithBuildRecovery(() => Promise.resolve("loaded"), { storage })
    ).resolves.toBe("loaded");
    expect(storage.getItem("burrito-finder:stale-build-reload")).toBeNull();
  });

  it("reloads once when a route chunk cannot be imported", async () => {
    const storage = createStorage();
    const reload = vi.fn();
    void importWithBuildRecovery(() => Promise.reject(new Error("stale")), {
      storage,
      reload
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(reload).toHaveBeenCalledOnce();

    await expect(
      importWithBuildRecovery(() => Promise.reject(new Error("still stale")), {
        storage,
        reload
      })
    ).rejects.toThrow("still stale");
    expect(reload).toHaveBeenCalledOnce();
  });
});
