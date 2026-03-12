# Scenarios Test Suite

**Project:** Relish QA Automation  
**Site:** http://uitestingplayground.com/ajax  
**Script:** `tests/ajax-dynamic-content.spec.js`  
**Framework:** Playwright (Node.js)

---

## How to Run

```bash
npm install --save-dev @playwright/test
npx playwright install chromium

# open Chrome and watch it run
npx playwright test tests/ajax-dynamic-content.spec.js --headed
```

> Suite takes ~60–75 s total since each AJAX call waits ~15 s.

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
