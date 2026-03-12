const { test, expect } = require("@playwright/test");

const URL            = "http://uitestingplayground.com/ajax";
const BUTTON_ID      = "#ajaxButton";
const LABEL_SELECTOR = ".bg-success";           
const EXPECTED_TEXT  = "Data loaded with AJAX get request.";
const AJAX_TIMEOUT   = 20_000;                  

test("TC-AJAX-01 | navigates to page, clicks button, waits for data, verifies label text", async ({ page }) => {
  await page.goto(URL);
  await expect(page).toHaveTitle(/AJAX Data/i);

  const button = page.locator(BUTTON_ID);
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();

  const label = page.locator(LABEL_SELECTOR);
  await expect(label).toBeVisible({ timeout: AJAX_TIMEOUT });

  await expect(label).toHaveText(EXPECTED_TEXT);
});

test("TC-AJAX-02 result label is NOT present in the DOM before any interaction", async ({ page }) => {
  await page.goto(URL);

  const label = page.locator(LABEL_SELECTOR);
  await expect(label).toHaveCount(0);
});

test("TC-AJAX-03 label appears within 20 seconds of clicking the button", async ({ page }) => {
  await page.goto(URL);

  const start = Date.now();
  await page.locator(BUTTON_ID).click();

  const label = page.locator(LABEL_SELECTOR);
  await expect(label).toBeVisible({ timeout: AJAX_TIMEOUT });

  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThanOrEqual(AJAX_TIMEOUT);

  expect(elapsed).toBeGreaterThanOrEqual(14_000);
});

test("TC-AJAX-04 loaded label text is an exact, trimmed match — no extra whitespace or wrong casing", async ({ page }) => {
  await page.goto(URL);
  await page.locator(BUTTON_ID).click();

  const label = page.locator(LABEL_SELECTOR);
  await expect(label).toBeVisible({ timeout: AJAX_TIMEOUT });

  const rawText = await label.innerText();

  expect(rawText.trim()).toBe(EXPECTED_TEXT);

  expect(rawText.trim()).not.toBe(EXPECTED_TEXT.toLowerCase());
});


test("TC-AJAX-05 | exactly one result label is rendered after data loads", async ({ page }) => {
  await page.goto(URL);
  await page.locator(BUTTON_ID).click();

  const label = page.locator(LABEL_SELECTOR);
  await expect(label).toBeVisible({ timeout: AJAX_TIMEOUT });

  await expect(label).toHaveCount(1);
});
