import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const collectRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (
      message.type() === "error" &&
      /(?:uncaught|typeerror|referenceerror|value is undefined|cannot read)/i.test(
        message.text()
      )
    ) {
      errors.push(message.text());
    }
  });
  return errors;
};

test("Classic validator resolves IBC labels without runtime errors", async ({
  page
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto(
    "/classic/validator/terravaloper16x9dcx9pm9j8ykl0td4hptwule706ysjel6500"
  );

  await expect(page.getByText("BNB (channel-19)")).toBeVisible();
  await expect(page.getByText(/IBC 077EE5/)).toBeVisible();
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
  expect(errors).toEqual([]);
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
