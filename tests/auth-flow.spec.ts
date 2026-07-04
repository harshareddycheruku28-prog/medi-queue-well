import { test, expect } from "@playwright/test";

test("receptionist signup, login, and dashboard load", async ({ page }) => {
  const rand = Math.floor(Math.random() * 10000);
  const email = `recep_${rand}@test.com`;
  const password = "SuperSecurePassword123!";

  // Go to receptionist login page with tab=signup
  console.log("Navigating to receptionist signup page...");
  await page.goto("/auth/receptionist?tab=signup");
  await page.waitForTimeout(2000); // Wait for hydration

  // Fill in signup form
  console.log("Filling signup form...");
  await page.fill('input[name="full_name"]', "Test Receptionist");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit signup form
  console.log("Submitting signup form...");
  await page.click('button:has-text("Create Account")');

  // Wait for redirect to receptionist dashboard
  console.log("Waiting for redirection to receptionist dashboard...");
  await page.waitForURL("**/receptionist/dashboard", { timeout: 15000 });
  console.log("Redirection successful! Current URL:", page.url());

  // Check if "Page not found" is displayed or dashboard content is visible
  const notFoundHeader = page.locator('h2:has-text("Page not found")');
  const isNotFoundVisible = await notFoundHeader.isVisible();
  if (isNotFoundVisible) {
    console.error("FAILED: Page not found is displayed on /receptionist/dashboard!");
  } else {
    console.log("SUCCESS: Page not found is not visible.");
  }

  // Verify URL is correct
  await expect(page).toHaveURL(/.*\/receptionist\/dashboard/);
  console.log("SUCCESS: Receptionist Dashboard URL matched!");
});

test("doctor signup, login, and dashboard load", async ({ page }) => {
  const rand = Math.floor(Math.random() * 10000);
  const email = `doc_${rand}@test.com`;
  const password = "SuperSecurePassword123!";

  // Go to doctor login page with tab=signup
  console.log("Navigating to doctor signup page...");
  await page.goto("/auth/doctor?tab=signup");
  await page.waitForTimeout(2000); // Wait for hydration

  // Fill in signup form
  console.log("Filling signup form...");
  await page.fill('input[name="full_name"]', "Test Doctor");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Select department (we need to select by value or click on trigger)
  console.log("Selecting department...");
  await page.click('[role="combobox"]');
  await page.locator('[role="option"]').first().click();

  await page.fill('input[name="specialization"]', "General Practitioner");

  // Submit signup form
  console.log("Submitting signup form...");
  await page.click('button:has-text("Create Account")');

  // Wait for redirect to doctor dashboard
  console.log("Waiting for redirection to doctor dashboard...");
  await page.waitForURL("**/doctor/dashboard", { timeout: 15000 });
  console.log("Redirection successful! Current URL:", page.url());

  // Check if "Page not found" is displayed or dashboard content is visible
  const notFoundHeader = page.locator('h2:has-text("Page not found")');
  const isNotFoundVisible = await notFoundHeader.isVisible();
  if (isNotFoundVisible) {
    console.error("FAILED: Page not found is displayed on /doctor/dashboard!");
  } else {
    console.log("SUCCESS: Page not found is not visible.");
  }

  // Verify URL is correct
  await expect(page).toHaveURL(/.*\/doctor\/dashboard/);
  console.log("SUCCESS: Doctor Dashboard URL matched!");
});
