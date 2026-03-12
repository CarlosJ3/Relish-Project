# Scenarios Test Suite

**Project:** Relish QA Automation  
**Site:** http://uitestingplayground.com  
**Framework:** Playwright (Node.js)

---

## How to Run

```bash
npm install --save-dev @playwright/test
npx playwright install chromium

# Scenario A 
npx playwright test tests/ajax-dynamic-content.spec.js --headed

# Scenario B 
npx playwright test tests/sample-app-login.spec.js --headed
```

> Scenario A takes ~60–75 s (15 s AJAX delay per test). Scenario B runs in seconds.

---

## Scenario A — Dynamic Content and Waiting

Page: http://uitestingplayground.com/ajax  
Script: `tests/ajax-dynamic-content.spec.js`

---

### TC-AJAX-01

| Field | Detail |
| **Test Case ID** | TC-AJAX-01 |
| **Description** | Navigate to the AJAX page, click the trigger button, wait for data to load, and verify the label text. |
| **Preconditions** | Site is reachable. No prior AJAX request has been made in the session. |
| **Test Data** | URL: `/ajax` · Expected text: `Data loaded with AJAX get request.` |
| **Expected Result** | The `.bg-success` label appears and contains the exact expected text. |

**Test Steps**
1. Go to `http://uitestingplayground.com/ajax`.
2. Confirm the page title contains "AJAX Data".
3. Confirm `#ajaxButton` is visible and enabled.
4. Click `#ajaxButton`.
5. Wait up to 20 s for `.bg-success` to appear.
6. Assert the label text equals `Data loaded with AJAX get request.`

---

### TC-AJAX-02

| Field | Detail |
| **Test Case ID** | TC-AJAX-02 |
| **Description** | Verify the result label does not exist in the DOM before the button is clicked. |
| **Preconditions** | Fresh page load, no button click performed. |
| **Test Data** | Selector: `.bg-success` |
| **Expected Result** | Element count = 0 immediately after page load. |

**Test Steps**
1. Go to `http://uitestingplayground.com/ajax`.
2. Without clicking anything, query the DOM for `.bg-success`.
3. Assert the element count is 0.

---

### TC-AJAX-03

| Field | Detail |
| **Test Case ID** | TC-AJAX-03 |
| **Description** | Verify the AJAX response arrives within the expected time window (14–20 seconds). |
| **Preconditions** | Normal network conditions. |
| **Test Data** | Min: 14 000 ms · Max: 20 000 ms |
| **Expected Result** | The label appears and elapsed time is between 14 s and 20 s. |

**Test Steps**
1. Go to `http://uitestingplayground.com/ajax`.
2. Record the start timestamp.
3. Click `#ajaxButton`.
4. Wait for `.bg-success` to be visible (timeout: 20 s).
5. Record elapsed time.
6. Assert `14 000 ms ≤ elapsed ≤ 20 000 ms`.

---

### TC-AJAX-04

| Field | Detail |
| **Test Case ID** | TC-AJAX-04 |
| **Description** | Verify the label text is an exact, case-sensitive, trimmed match with no extra whitespace. |
| **Preconditions** | Button has been clicked and label has appeared. |
| **Test Data** | Expected (exact): `Data loaded with AJAX get request.` |
| **Expected Result** | `innerText.trim()` equals the expected string with case-sensitive comparison. |

**Test Steps**
1. Go to `http://uitestingplayground.com/ajax`.
2. Click `#ajaxButton` and wait for `.bg-success`.
3. Read `innerText` of the label and apply `.trim()`.
4. Assert the result equals `Data loaded with AJAX get request.` (case-sensitive).

---

### TC-AJAX-05

| Field | Detail |
| **Test Case ID** | TC-AJAX-05 |
| **Description** | Verify exactly one result label is rendered after the data loads — no duplicates. |
| **Preconditions** | Single button click in a fresh session. |
| **Test Data** | Selector: `.bg-success` |
| **Expected Result** | Count of `.bg-success` elements = 1. |

**Test Steps**
1. Go to `http://uitestingplayground.com/ajax`.
2. Click `#ajaxButton`.
3. Wait for `.bg-success` to be visible.
4. Count all `.bg-success` elements on the page.
5. Assert the count equals 1.

---

## Scenario B — Realistic Interactions

Page: http://uitestingplayground.com/sampleapp  
Script: `tests/sample-app-login.spec.js`

---

### TC-SAPP-01

| Field | Detail |
| **Test Case ID** | TC-SAPP-01 |
| **Description** | Clicking Log In with empty fields should show an error in the status label. |
| **Preconditions** | Page is loaded. No credentials entered. |
| **Test Data** | Username: _(empty)_ · Password: _(empty)_ |
| **Expected Result** | `#loginstatus` shows `Invalid username/password`. |

**Test Steps**
1. Go to `http://uitestingplayground.com/sampleapp`.
2. Leave the username and password fields empty.
3. Click `#login`.
4. Assert `#loginstatus` is visible and contains `Invalid username/password`.

---

### TC-SAPP-02

| Field | Detail |
| **Test Case ID** | TC-SAPP-02 |
| **Description** | Valid credentials should result in a personalized welcome message. |
| **Preconditions** | Page is loaded. |
| **Test Data** | Username: `testuser` · Password: `pwd` |
| **Expected Result** | `#loginstatus` shows `Welcome, testuser!` |

**Test Steps**
1. Go to `http://uitestingplayground.com/sampleapp`.
2. Type `testuser` into `input[name="UserName"]`.
3. Type `pwd` into `input[name="Password"]`.
4. Click `#login`.
5. Assert `#loginstatus` shows `Welcome, testuser!`.

---

### TC-SAPP-03

| Field | Detail |
| **Test Case ID** | TC-SAPP-03 |
| **Description** | The login button should change from "Log In" to "Log Out" after a successful login. |
| **Preconditions** | User is not logged in. |
| **Test Data** | Username: `testuser` · Password: `pwd` |
| **Expected Result** | Button text = `Log Out` after login. |

**Test Steps**
1. Go to `http://uitestingplayground.com/sampleapp`.
2. Assert button `#login` text is `Log In`.
3. Fill in valid credentials and click the button.
4. Assert the same button now shows `Log Out`.

---

### TC-SAPP-04

| Field | Detail |
| **Test Case ID** | TC-SAPP-04 |
| **Description** | The welcome message must include the exact username that was typed, not a hardcoded value. |
| **Preconditions** | Page is loaded. |
| **Test Data** | Username: `carlos` · Password: `pwd` |
| **Expected Result** | `#loginstatus` shows `Welcome, carlos!` |

**Test Steps**
1. Go to `http://uitestingplayground.com/sampleapp`.
2. Type `carlos` into the username field.
3. Type `pwd` into the password field.
4. Click `#login`.
5. Assert `#loginstatus` shows `Welcome, carlos!`.

---

### TC-SAPP-05

| Field | Detail |
| **Test Case ID** | TC-SAPP-05 |
| **Description** | A valid username with an incorrect password should be rejected with an error. |
| **Preconditions** | Page is loaded. |
| **Test Data** | Username: `testuser` · Password: `wrongpass` |
| **Expected Result** | `#loginstatus` shows `Invalid username/password`. |

**Test Steps**
1. Go to `http://uitestingplayground.com/sampleapp`.
2. Type `testuser` into the username field.
3. Type `wrongpass` into the password field.
4. Click `#login`.
5. Assert `#loginstatus` shows `Invalid username/password`.

---

## Scenario C — Tricky Selectors

Pages:
- http://uitestingplayground.com/dynamicid
- http://uitestingplayground.com/overlapped

Script: `tests/tricky-selectors.spec.js` *(automation not yet created)*

**Key challenge:** The Dynamic ID page has a button whose `id` attribute is a random GUID that changes on every page load — it cannot be targeted by ID. The Overlapped page has an input field that is hidden inside a scrollable container and must be scrolled into view before it can be interacted with.

---

### TC-TRICKY-01

| Field | Detail |
| **Test Case ID** | TC-TRICKY-01 |
| **Description** | Click the button on the Dynamic ID page using a stable selector (not the random ID). |
| **Preconditions** | Page is loaded. |
| **Test Data** | Stable selector: `button.btn-primary` · Button text: `Button with Dynamic ID` |
| **Expected Result** | Button is clicked successfully regardless of the current random ID value. |

**Test Steps**
1. Go to `http://uitestingplayground.com/dynamicid`.
2. Locate the button using `button.btn-primary` (NOT its `id` attribute, which is a random GUID).
3. Assert the button is visible and enabled.
4. Click the button.
5. Confirm no error occurs — the click completes successfully.

---

### TC-TRICKY-02

| Field | Detail |
| **Test Case ID** | TC-TRICKY-02 |
| **Description** | Verify the button ID is different on every page reload, confirming the dynamic ID behavior. |
| **Preconditions** | Page can be loaded twice. |
| **Test Data** | Attribute: `id` on `button.btn-primary` |
| **Expected Result** | The `id` value captured on the first load does not equal the `id` value on a fresh reload. |

**Test Steps**
1. Go to `http://uitestingplayground.com/dynamicid`.
2. Read the `id` attribute of `button.btn-primary` — save as `id1`.
3. Reload the page.
4. Read the `id` attribute again — save as `id2`.
5. Assert `id1 !== id2`.

---

### TC-TRICKY-03

| Field | Detail |
| **Test Case ID** | TC-TRICKY-03 |
| **Description** | Scroll the Name input field into view on the Overlapped Element page and enter text. |
| **Preconditions** | Page is loaded. The `#name` field is hidden inside a scrollable container. |
| **Test Data** | Input value: `Carlos Automation` · Selector: `#name` |
| **Expected Result** | Field is scrolled into view and accepts the typed text without error. |

**Test Steps**
1. Go to `http://uitestingplayground.com/overlapped`.
2. Locate the `#name` input field — it is not yet visible due to the overlapping container.
3. Scroll the element into view using `scrollIntoViewIfNeeded()`.
4. Click the `#name` field to focus it.
5. Type `Carlos Automation` into the field.
6. Assert the field value equals `Carlos Automation`.

---

### TC-TRICKY-04

| Field | Detail |
| **Test Case ID** | TC-TRICKY-04 |
| **Description** | Verify that directly clicking the Name field without scrolling fails or requires the scroll step. |
| **Preconditions** | Page is loaded. No scrolling performed. |
| **Test Data** | Selector: `#name` |
| **Expected Result** | The field is not interactable until scrolled into view — confirms the scroll step is necessary. |

**Test Steps**
1. Go to `http://uitestingplayground.com/overlapped`.
2. Without scrolling, attempt to click and type into `#name`.
3. Observe that the action fails or the element is not actionable.
4. Scroll the element into view.
5. Confirm typing now works correctly.

