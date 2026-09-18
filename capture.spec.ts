import { expect, test, type Page } from "@playwright/test";

import { screencastDir } from "./playwright.paths";

const OUT = `${screencastDir()}/out`;
const PR = process.env.EVIDENCE_PR ?? "";

const WASHER = { mobile: "500000002", pin: "1234" };
const CUSTOMER = { mobile: "500001001", pin: "1234" };

async function fillPin(page: Page, pin: string) {
  for (let index = 0; index < pin.length; index += 1) {
    await page.getByRole("textbox", { name: `PIN digit ${String(index + 1)}` }).fill(pin[index] ?? "");
  }
}

async function login(page: Page, mobile: string, pin: string, landed: RegExp) {
  await page.goto("/login");
  await page.getByPlaceholder("50 123 4567").fill(mobile);
  await fillPin(page, pin);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(landed, { timeout: 30_000 });
}

async function loginWasher(page: Page) {
  await login(page, WASHER.mobile, WASHER.pin, /\/washer\/buildings/);
}

async function loginCustomer(page: Page) {
  await login(page, CUSTOMER.mobile, CUSTOMER.pin, /\/customer\/home/);
}

async function openMarinaHeights(page: Page) {
  await page.getByRole("button", { name: /Marina Heights/ }).click();
  await page.waitForURL("**/washer/schedule");
  await page.getByText("Job Listing").waitFor();
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

test.describe(`PR ${PR} evidence`, () => {
  test.skip(!PR, "EVIDENCE_PR is required");

  test("capture", async ({ page }) => {
    if (PR === "172") {
      await loginCustomer(page);
      await page.goto("/customer/vehicles/new");
      await page.locator("#add-vehicle-type-label").waitFor({ timeout: 20_000 });
      await page.getByRole("button", { name: "Sedan", exact: true }).waitFor();
      await expect(page.locator("#add-vehicle-type-label")).toBeVisible();
      await expect(page.locator("label", { hasText: "Vehicle type" })).toContainText("*");
      await expect(page.locator("label", { hasText: "Parking bay" })).toContainText("*");
      await expect(page.locator("label", { hasText: "Brand" })).not.toContainText("*");
      await shot(page, "172-add-vehicle-required-markers");
      await page.locator("#add-vehicle-brand").scrollIntoViewIfNeeded();
      await shot(page, "172-add-vehicle-optional-brand");
      return;
    }

    if (PR === "173") {
      await loginCustomer(page);
      await page.getByText("Pearl White Toyota Camry").first().waitFor({ timeout: 20_000 });
      await shot(page, "173-home-car-colour");
      return;
    }

    if (PR === "174") {
      await loginWasher(page);
      await openMarinaHeights(page);
      await page.getByText("B-12", { timeout: 20_000 }).waitFor();
      await page.getByText("P-1").waitFor();
      await shot(page, "174-jobs-sorted-by-bay");
      return;
    }

    if (PR === "175") {
      await loginWasher(page);
      await openMarinaHeights(page);
      await page.goto("/washer/customers");
      await page.getByText("Omar Farooq", { timeout: 20_000 }).waitFor();
      await page.getByRole("button", { name: /Omar Farooq/ }).click();
      await page.getByText("Payment History").click();
      await page.getByText("Overdue", { timeout: 20_000 }).waitFor();
      await shot(page, "175-payment-history-overdue");
      return;
    }

    if (PR === "176") {
      await loginWasher(page);
      await openMarinaHeights(page);
      await page.goto("/washer/customers");
      await page.getByText("Aisha Khan", { timeout: 20_000 }).waitFor();
      await page.getByText("DXB-A-1001").waitFor();
      await shot(page, "176-customer-list-plates");
      await page.getByLabel(/plate/i).fill("DXB-A-1001");
      await expect(page.getByText("Omar Farooq")).toHaveCount(0);
      await expect(page.getByText("Aisha Khan")).toBeVisible();
      await expect(page.getByText(/Loading/i)).toHaveCount(0);
      await shot(page, "176-search-by-plate");
      return;
    }

    if (PR === "177") {
      await loginCustomer(page);
      await page.getByLabel("Your cleaner").waitFor({ timeout: 20_000 });
      await shot(page, "177-home-cleaner-card");
      return;
    }

    throw new Error(`Unknown EVIDENCE_PR=${PR}`);
  });
});
