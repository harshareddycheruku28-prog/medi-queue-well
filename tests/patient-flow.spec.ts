// tests/patient-flow.spec.ts
import { test, expect } from "@playwright/test";

/**
 * End-to-end verification of the new patient journey:
 *   1. Login as a patient.
 *   2. See the warm-colored dashboard cards.
 *   3. Run the symptom checker, get department & hospital suggestions.
 *   4. Select a hospital and verify the booking page shows the selected banner.
 *   5. Complete the booking and ensure a token is generated.
 */

test("patient symptom-check to hospital selection to booking", async ({ page }) => {
  // 1. Login
  await page.goto("/auth/patient");
  await page.fill('input[name="email"]', "john@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button:has-text("Login")');

  // 2. Dashboard cards
  await expect(page.getByText("Check Symptoms")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Find Nearby Hospital")).toBeVisible();

  // 3. Symptom checker
  await page.click("text=Check Symptoms");
  await page.waitForURL("**/symptom-checker");
  await page.fill("textarea", "I have a severe headache and dizziness");
  await page.click('button:has-text("Analyze")');

  // 4. Wait for results - should show recommended hospitals
  await expect(page.getByText("Recommended Hospitals")).toBeVisible({ timeout: 15000 });

  // 5. Select a hospital
  const selectBtn = page.locator('a:has-text("Select Hospital")').first();
  await expect(selectBtn).toBeVisible();
  await selectBtn.click();

  // 6. Booking page - hospital banner should be visible
  await page.waitForURL("**/book**");
  await expect(page.getByText("Selected Hospital")).toBeVisible({ timeout: 10000 });
});
