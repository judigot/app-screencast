import { test, expect } from "@playwright/test";

import { clearClientStorage, loginAsAdmin, adminNavLink } from "../app/e2e-admin/helpers/admin-login";
import { uniqueDigits } from "../app/e2e-admin/helpers/unique";
import {
  clickEvidence,
  installEvidenceCursor,
  installEvidenceCursorOnContext,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { recordEvidenceSegment } from "./helpers/evidence-screencast";

test("inactive washer — admin then washer login (two windows)", async ({ page, browser }, testInfo) => {
  test.setTimeout(300_000);

  const suffix = uniqueDigits(5);
  const washer = {
    name: `Evidence Inactive ${suffix}`,
    mobile: `+971507${suffix}`,
    mobileNational: `507${suffix}`,
    pin: "1234",
  };

  await installEvidenceCursor(page);
  await clearClientStorage(page);
  await loginAsAdmin(page);

  const washerContext = await browser.newContext();
  await installEvidenceCursorOnContext(washerContext);
  const washerPage = await washerContext.newPage();

  await recordEvidenceSegment(page, testInfo, "01-admin-marks-inactive.webm", async () => {
    await adminNavLink(page, "Washers").click();
    await expect(page).toHaveURL(/\/admin\/washers(?:\?.*)?$/);

    await clickEvidence(page, page.getByRole("button", { name: "New" }));
    await clickEvidence(page, page.getByRole("menuitem", { name: "Washer", exact: true }));
    await typeEvidence(page, page.locator("#name"), washer.name);
    await typeEvidence(page, page.locator("#mobile"), washer.mobile);
    await typeEvidence(page, page.locator("#pin"), washer.pin);
    await clickEvidence(page, page.getByRole("button", { name: "Create washer" }));
    await expect(page).toHaveURL(/\/admin\/washers\/[0-9a-f-]+(?:\?.*)?$/);

    await clickEvidence(page, page.getByRole("button", { name: "Status" }));
    await clickEvidence(page, page.getByRole("option", { name: "Inactive" }));
    await clickEvidence(page, page.getByRole("button", { name: "Save changes" }));
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Status" })).toHaveText("Inactive");

    await adminNavLink(page, "Washers").click();
    await typeEvidence(page, page.getByPlaceholder("Search name, mobile, or email"), washer.name);
    const washerRow = page.getByRole("link", { name: `View washer ${washer.name}` });
    await expect(washerRow).toBeVisible();
    await expect(washerRow.getByText("Inactive", { exact: true })).toBeVisible();
  });

  await recordEvidenceSegment(washerPage, testInfo, "02-washer-login-blocked.webm", async () => {
    await washerPage.context().clearCookies();
    await washerPage.goto("/login");
    await installEvidenceCursor(washerPage);
    await expect(washerPage.getByPlaceholder("50 123 4567")).toBeVisible();

    await typeEvidence(washerPage, washerPage.getByPlaceholder("50 123 4567"), washer.mobileNational);

    for (let index = 0; index < washer.pin.length; index += 1) {
      const digit = washerPage.getByRole("textbox", {
        name: `PIN digit ${String(index + 1)}`,
      });
      await typeEvidence(washerPage, digit, washer.pin[index] ?? "", 90);
    }

    await clickEvidence(washerPage, washerPage.getByRole("button", { name: "Login" }));
    await expect(
      washerPage.getByText("This account is inactive. Contact your administrator."),
    ).toBeVisible();
    await expect(washerPage).toHaveURL(/\/login/);
  });

  await washerContext.close();
});
