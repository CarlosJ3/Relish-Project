# Scenarios Test Suite

**Project:** Relish QA Automation  
**Site:** http://uitestingplayground.com  
**Framework:** Playwright (Node.js)

---

## How to Run

```bash
npm install --save-dev @playwright/test
npx playwright install chromium

# Scenario A — open Chrome and watch it run
npx playwright test tests/ajax-dynamic-content.spec.js --headed

# Scenario B — open Chrome and watch it run
npx playwright test tests/sample-app-login.spec.js --headed
```

> Scenario A takes ~60–75 s total since each AJAX call waits ~15 s. Scenario B runs in seconds.


---

## Scenario A — Dynamic Content and Waiting

The page loads data via AJAX after clicking a button. The test has to wait for the result label to appear instead of checking right away.

**Button:** `#ajaxButton`  
**Result label:** `.bg-success` (green bar, only shows up after ~15 s)  
**Expected text:** `Data loaded with AJAX get request.`

---

**TC-AJAX-01 — Happy Path**  
Open the page, click the button, wait up to 20 s, and confirm the label shows the right text.

**TC-AJAX-02 — Label is not there before clicking**  
Before any click, the `.bg-success` element should not exist in the DOM at all (count = 0).

**TC-AJAX-03 — Response comes in within the expected window**  
The label must appear between 14 s and 20 s after clicking — not too fast, not too slow.

**TC-AJAX-04 — Text is exactly right**  
Read the label text, trim any whitespace, and compare it character-by-character against the expected string (case-sensitive).

**TC-AJAX-05 — Only one label appears**  
After the data loads, there should be exactly one `.bg-success` element on the page — no duplicates.

---

## Scenario B — Realistic Interactions

The page has a simple login form. The test checks what happens with empty fields, valid credentials, and how the UI reacts to each.

**Username field:** `input[name="UserName"]`  
**Password field:** `input[name="Password"]`  
**Button:** `#login`  
**Status label:** `#loginstatus`  
**Valid password:** `pwd` (any non-empty username works)

---

**TC-SAPP-01 — Empty credentials show an error**  
Click Log In without filling anything. The status label should say `Invalid username/password`.

**TC-SAPP-02 — Valid login shows a welcome message with the username**  
Fill in a username and the password `pwd`, click Log In. The status label should say `Welcome, testuser!`.

**TC-SAPP-03 — Button text changes after login**  
Before logging in, the button says `Log In`. After a successful login it should change to `Log Out`.

**TC-SAPP-04 — Success message reflects the exact username entered**  
Try a different username (e.g., `carlos`). The welcome message should contain that exact name, not a hardcoded one.

**TC-SAPP-05 — Wrong password is rejected**  
Enter a valid username but the wrong password. The status label should still show `Invalid username/password`.

