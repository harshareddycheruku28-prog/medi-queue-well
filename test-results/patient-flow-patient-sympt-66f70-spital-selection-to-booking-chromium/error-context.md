# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patient-flow.spec.ts >> patient symptom-check to hospital selection to booking
- Location: tests\patient-flow.spec.ts:13:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Check Symptoms')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Check Symptoms')

```

```yaml
- link "MediQueue Logo MediQueue":
  - /url: /
  - img "MediQueue Logo"
  - text: MediQueue
- heading "Patient Portal" [level=2]
- paragraph: Book and track your appointments.
- paragraph: © 2026 MediQueue Hospital
- paragraph: Done by students of AI
- text: Patient Portal Book and track your appointments.
- tablist:
  - tab "Login" [selected]
  - tab "Sign up"
- tabpanel "Login":
  - text: Email
  - textbox: john@example.com
  - text: Password
  - textbox: password123
  - button "Login"
- link "Receptionist login":
  - /url: /auth/receptionist
- link "Doctor login":
  - /url: /auth/doctor
- link "← Back to home":
  - /url: /
- region "Notifications alt+T"
```

# Test source

```ts
  1  | // tests/patient-flow.spec.ts
  2  | import { test, expect } from "@playwright/test";
  3  | 
  4  | /**
  5  |  * End-to-end verification of the new patient journey:
  6  |  *   1. Login as a patient.
  7  |  *   2. See the warm-colored dashboard cards.
  8  |  *   3. Run the symptom checker, get department & hospital suggestions.
  9  |  *   4. Select a hospital and verify the booking page shows the selected banner.
  10 |  *   5. Complete the booking and ensure a token is generated.
  11 |  */
  12 | 
  13 | test("patient symptom-check to hospital selection to booking", async ({ page }) => {
  14 |   // 1. Login
  15 |   await page.goto("/auth/patient");
  16 |   await page.fill('input[name="email"]', "john@example.com");
  17 |   await page.fill('input[name="password"]', "password123");
  18 |   await page.click('button:has-text("Login")');
  19 | 
  20 |   // 2. Dashboard cards
> 21 |   await expect(page.getByText("Check Symptoms")).toBeVisible({ timeout: 10000 });
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  22 |   await expect(page.getByText("Find Nearby Hospital")).toBeVisible();
  23 | 
  24 |   // 3. Symptom checker
  25 |   await page.click("text=Check Symptoms");
  26 |   await page.waitForURL("**/symptom-checker");
  27 |   await page.fill("textarea", "I have a severe headache and dizziness");
  28 |   await page.click('button:has-text("Analyze")');
  29 | 
  30 |   // 4. Wait for results - should show recommended hospitals
  31 |   await expect(page.getByText("Recommended Hospitals")).toBeVisible({ timeout: 15000 });
  32 | 
  33 |   // 5. Select a hospital
  34 |   const selectBtn = page.locator('a:has-text("Select Hospital")').first();
  35 |   await expect(selectBtn).toBeVisible();
  36 |   await selectBtn.click();
  37 | 
  38 |   // 6. Booking page - hospital banner should be visible
  39 |   await page.waitForURL("**/book**");
  40 |   await expect(page.getByText("Selected Hospital")).toBeVisible({ timeout: 10000 });
  41 | });
  42 | 
```