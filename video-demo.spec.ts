import { test, expect } from "@playwright/test";

import { DEMO_ADMIN } from "../app/e2e-admin/fixtures/admin";
import { E2E_CUSTOMER } from "../app/e2e-admin/fixtures/e2e-customer";
import { clickAdminNavLink, expectAdminNavActive } from "../app/e2e-admin/helpers/admin-login";
import {
  clickEvidence,
  installEvidenceCursor,
  removeEvidenceCursor,
  typeEvidence,
  useNativeEvidenceCursor,
} from "./helpers/evidence-cursor";

test("admin login and customer search", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const nativeCursor = useNativeEvidenceCursor();

  if (!nativeCursor) {
    await installEvidenceCursor(page);
  }

  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });
  await expect(page.getByPlaceholder("50 123 4567")).toBeVisible();

  if (nativeCursor) {
    await removeEvidenceCursor(page);
  }

  const videoPath = testInfo.outputPath("evidence.webm");
  await page.screencast.start({
    path: videoPath,
    size: { width: 1280, height: 720 },
  });
  await page.screencast.hideActions();

  if (nativeCursor) {
    await removeEvidenceCursor(page);
  } else {
    await installEvidenceCursor(page);
  }

  const mobile = page.getByPlaceholder("50 123 4567");
  await typeEvidence(page, mobile, DEMO_ADMIN.mobileNational);

  for (let index = 0; index < DEMO_ADMIN.pin.length; index += 1) {
    const digit = page.getByRole("textbox", { name: `PIN digit ${String(index + 1)}` });
    await typeEvidence(page, digit, DEMO_ADMIN.pin[index] ?? "", 90);
  }

  await clickEvidence(page, page.getByRole("button", { name: "Login" }));
  await page.waitForURL(/\/admin\/reports$/, { timeout: 30_000 });
  if (nativeCursor) await removeEvidenceCursor(page);
  else await installEvidenceCursor(page);
  await expectAdminNavActive(page, "Reporting");
  await page.waitForTimeout(300);

  await clickAdminNavLink(page, "Customers");
  await expect(page).toHaveURL(/\/admin\/customers(?:\?.*)?$/);
  if (nativeCursor) await removeEvidenceCursor(page);
  else await installEvidenceCursor(page);
  await expectAdminNavActive(page, "Customers");
  await expect(page.getByRole("table").first()).toBeVisible();
  await page.waitForTimeout(250);

  const searchInput = page.getByPlaceholder("Search name, mobile, code, or flat");
  await typeEvidence(page, searchInput, E2E_CUSTOMER.name, 65);
  await expect(page.getByRole("cell", { name: E2E_CUSTOMER.name })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(400);

  await page.screencast.stop();
});
