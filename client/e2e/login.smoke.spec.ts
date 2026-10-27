/**
 * Thin E2E smoke — login form is visible (API mocked; no real backend).
 *
 * Steps:
 * 1. Intercept `/api/**` so AuthContext `/me` cannot hang.
 * 2. Open `/login` and wait for data-testid fields.
 * 3. Assert email, password, submit, and hydration marker are present.
 */
import { expect, test } from "@playwright/test";

import { ROUTES } from "../src/constants/routes";
import { TEST_IDS } from "../src/constants/testIds";

test.describe("login smoke", () => {
  test("shows email, password, and submit controls", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null }),
      });
    });

    await page.goto(ROUTES.LOGIN, { waitUntil: "domcontentloaded" });
    // Form fields SSR from Login; do not require LOGIN_READY (hydration) for smoke.
    await expect(page.getByTestId(TEST_IDS.LOGIN_EMAIL)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId(TEST_IDS.LOGIN_PASSWORD)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.LOGIN_SUBMIT)).toBeVisible();
  });
});
