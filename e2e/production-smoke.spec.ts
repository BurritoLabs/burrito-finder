import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const collectRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (
      message.type() === "error" &&
      /(?:uncaught|typeerror|referenceerror|value is undefined|cannot read|refused to (?:load|connect|execute|apply|frame))/i.test(
        message.text()
      )
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
  const networkButtons = page.getByRole("button", { name: /classic/ });
  await expect(networkButtons).toHaveCount(2);
  await expect(networkButtons.first()).toBeVisible();
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
  expect(errors).toEqual([]);
});

test("legal pages are reachable from the footer", async ({ page }) => {
  await page.goto("/classic/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await page.getByRole("link", { name: "Terms" }).click();
  await expect(page).toHaveURL(/\/classic\/terms$/);
  await expect(page.getByRole("heading", { name: "Terms" })).toBeVisible();
});
