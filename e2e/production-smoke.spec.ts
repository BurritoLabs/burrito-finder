import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const collectRuntimeErrors = (
  page: Page,
  { includeNetworkErrors = false }: { includeNetworkErrors?: boolean } = {}
) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (
      message.type() === "error" &&
      (/(?:uncaught|typeerror|referenceerror|value is undefined|cannot read|refused to (?:load|connect|execute|apply|frame))/i.test(
        message.text()
      ) ||
        (includeNetworkErrors &&
          /axioserror: network error/i.test(message.text())))
    ) {
      errors.push(message.text());
    }
  });
  return errors;
};

test("bundled chain config keeps the Finder available when the registry is down", async ({
  page
}) => {
  await page.route("https://assets.terra.dev/chains.json", route =>
    route.abort()
  );
  await page.goto("/classic");
  const searchboxes = page.getByRole("searchbox", {
    name: "Search Block / Tx / Account"
  });
  await expect(searchboxes).toHaveCount(2);
  await expect(searchboxes.first()).toBeVisible();
  const networkButtons = page.getByRole("button", {
    name: "Classic (LUNC) network"
  });
  await expect(networkButtons).toHaveCount(1);
  await expect(networkButtons.first()).toBeVisible();
  await networkButtons.first().click();
  await expect(
    page.getByRole("button", { name: "Classic (LUNC)", exact: true })
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Rebel Testnet (LUNC)", exact: true })
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Phoenix (LUNA)", exact: true })
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Pisco Testnet (LUNA)", exact: true })
  ).toHaveCount(1);
  await expect(page.getByRole("list").getByRole("button")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Rebel Testnet (LUNC)", exact: true })
    .click();
  await expect(page).toHaveURL(/\/classic-testnet\/$/);
  await expect(
    page.getByRole("button", {
      name: "Rebel Testnet (LUNC) network",
      exact: true
    })
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Rebel Testnet (LUNC) network",
      exact: true
    })
    .click();
  await page
    .getByRole("button", { name: "Pisco Testnet (LUNA)", exact: true })
    .click();
  await expect(page).toHaveURL(/\/testnet\/$/);
  await expect(
    page.getByRole("button", {
      name: "Pisco Testnet (LUNA) network",
      exact: true
    })
  ).toBeVisible();
});

test("Rebel testnet block and transaction use live LCD data", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  const height = "31616646";
  const hash =
    "B3A531CC8FF46A63D189F15354997502AF7B6758A21EC81B446DD6043B745F56";

  await page.goto(`/classic-testnet/blocks/${height}`);
  await expect(page.getByText("rebel-2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("tera bitz test node 1", { exact: true })
  ).toBeVisible();
  await expect(page.getByText(hash, { exact: true })).toBeVisible();

  await page.goto(`/classic-testnet/tx/${hash}`);
  await expect(
    page.getByRole("heading", { name: "Transaction Details" })
  ).toBeVisible();
  await expect(page.getByText("rebel-2", { exact: true })).toBeVisible();
  await expect(page.getByText(height, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Phoenix block lookup uses live LCD data beyond the stale FCD height", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  const height = "22032765";

  await page.goto(`/mainnet/blocks/${height}`);
  await expect(page.getByText("phoenix-1", { exact: true })).toBeVisible();
  await expect(page.getByText(height, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Search not found" })
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Classic validator resolves IBC labels without runtime errors", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(
    "/classic/validator/terravaloper16x9dcx9pm9j8ykl0td4hptwule706ysjel6500"
  );

  await expect(page.getByText("BNB (channel-19)")).toBeVisible();
  await expect(page.getByText("WHALE (channel-84)")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("IBC 077EE5");
  await expect(page.locator("body")).not.toContainText("Value is undefined");
  expect(errors).toEqual([]);
});

test("Phoenix account resolves CW20 and IBC assets", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(
    "/mainnet/address/terra104dnzgzzx7hjt32sml9zspqfmvr7fdae8l6vy8"
  );

  for (const symbol of ["arbLUNA", "axlUSDC", "KAVA", "USK"]) {
    await expect(page.getByText(symbol, { exact: true })).toBeVisible();
  }
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});

test("Phoenix CW20 balances survive aggregate API failure", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  await page.route(
    "https://api.burrito.money/v1/finder/account-assets",
    route => route.abort()
  );
  await page.goto(
    "/mainnet/address/terra104dnzgzzx7hjt32sml9zspqfmvr7fdae8l6vy8"
  );

  await expect(page.getByText("arbLUNA", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});

test("Phoenix account tolerates unavailable price feeds", async ({ page }) => {
  const errors = collectRuntimeErrors(page, { includeNetworkErrors: true });
  await page.route("https://api.coingecko.com/**", route => route.abort());
  await page.route("https://api.coinpaprika.com/**", route => route.abort());
  await page.route("https://open.er-api.com/**", route => route.abort());
  await page.goto(
    "/mainnet/address/terra104dnzgzzx7hjt32sml9zspqfmvr7fdae8l6vy8"
  );

  await expect(page.getByText("arbLUNA", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});

test("Finder data API publishes runtime health metrics", async ({
  request
}) => {
  const response = await request.get(
    "https://api.burrito.money/v1/finder/status"
  );
  expect(response.ok()).toBeTruthy();
  const status = await response.json();
  expect(status.state).toMatch(/^(ok|degraded)$/);
  expect(typeof status.latencyP95Ms).toBe("number");
  expect(typeof status.cacheHitRate).toBe("number");
  expect(typeof status.tokenMisses).toBe("number");
});

test("Phoenix transaction renders canonical actions", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(
    "/mainnet/tx/37986B4FCFF8801ED06209D63E7602B88D48FD8B29A4AD71A24D6D33D4796010"
  );

  await expect(
    page.getByRole("heading", { name: "Transaction Details" })
  ).toBeVisible();
  await expect(page.getByText("Success", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Unknown");
  await expect(page.getByRole("link", { name: "ORNE" })).toBeVisible();
  await expect(page.getByText("1.013236 Luna", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);

  await page.getByRole("link", { name: "ORNE" }).click();
  await expect(page).toHaveURL(
    /\/mainnet\/address\/terra19p20mfnvwh9yvyr7aus3a6z6g6uk28fv4jhx9kmnc2m7krg27q2qkfenjw$/
  );
});

test("Classic transaction formats native coins and unknown addresses", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(
    "/classic/tx/56417B87BCC8BCBB3FBBFAC4DF346CC31E6B349DC5DC51A1B8888E46FAA536F2"
  );

  await expect(
    page.getByRole("heading", { name: "Transaction Details" })
  ).toBeVisible();
  await expect(
    page.getByText("133.400000 Lunc", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "terra1hf...aqyvj4" })
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "terra1hfhr4uup3n8wca6ksl2fs07w4hmx3qytaqyvj4 send"
  );
  expect(errors).toEqual([]);
});

test("legal pages are reachable from the footer", async ({ page }) => {
  await page.goto("/classic/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await page.getByRole("link", { name: "Terms" }).click();
  await expect(page).toHaveURL(/\/classic\/terms$/);
  await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
});
