const { test, expect } = require("@playwright/test");

const URL              = "http://uitestingplayground.com/sampleapp";
const USERNAME_INPUT   = 'input[name="UserName"]';
const PASSWORD_INPUT   = 'input[name="Password"]';
const LOGIN_BUTTON     = "#login";
const STATUS_LABEL     = "#loginstatus";
const TEST_USERNAME    = "testuser";
const TEST_PASSWORD    = "pwd";

test("TC-SAPP-01 empty credentials show invalid login error", async ({ page }) => {
  await page.goto(URL);

  await page.locator(LOGIN_BUTTON).click();

  const status = page.locator(STATUS_LABEL);
  await expect(status).toBeVisible();
  await expect(status).toHaveText("Invalid username/password");
});

test("TC-SAPP-02 valid login shows welcome message with the username", async ({ page }) => {
  await page.goto(URL);

  await page.locator(USERNAME_INPUT).fill(TEST_USERNAME);
  await page.locator(PASSWORD_INPUT).fill(TEST_PASSWORD);
  await page.locator(LOGIN_BUTTON).click();

  const status = page.locator(STATUS_LABEL);
  await expect(status).toBeVisible();
  await expect(status).toHaveText(`Welcome, ${TEST_USERNAME}!`);
});

test("TC-SAPP-03 button text changes to Log Out after successful login", async ({ page }) => {
  await page.goto(URL);

  const button = page.locator(LOGIN_BUTTON);
  await expect(button).toHaveText("Log In");

  await page.locator(USERNAME_INPUT).fill(TEST_USERNAME);
  await page.locator(PASSWORD_INPUT).fill(TEST_PASSWORD);
  await button.click();

  await expect(button).toHaveText("Log Out");
});

test("TC-SAPP-04 success message contains the exact username provided", async ({ page }) => {
  const customName = "carlos";

  await page.goto(URL);
  await page.locator(USERNAME_INPUT).fill(customName);
  await page.locator(PASSWORD_INPUT).fill(TEST_PASSWORD);
  await page.locator(LOGIN_BUTTON).click();

  await expect(page.locator(STATUS_LABEL)).toHaveText(`Welcome, ${customName}!`);
});

test("TC-SAPP-05 wrong password shows error even with a valid username", async ({ page }) => {
  await page.goto(URL);

  await page.locator(USERNAME_INPUT).fill(TEST_USERNAME);
  await page.locator(PASSWORD_INPUT).fill("wrongpass");
  await page.locator(LOGIN_BUTTON).click();

  await expect(page.locator(STATUS_LABEL)).toHaveText("Invalid username/password");
});