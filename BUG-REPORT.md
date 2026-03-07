# BUG-REPORT.md

**File:** `order-processor.js`  

## Bug 1 — Off-by-one in `getTotalItemCount` (line 81) Critical

The loop condition uses `<=` instead of `<`, so on the last iteration `this.lineItems[i]` is `undefined` and accessing `.quantity` throws a TypeError. This crashes every method that calls it — `getSummary`, `calculateTotal`, `getVolumeDiscountPercent`.

```js
// Bug
for (let i = 0; i <= this.lineItems.length; i++)

// Fix
for (let i = 0; i < this.lineItems.length; i++)
```

*Found by reading the loop condition. The `<=` boundary walks one index past the end of the array. end when running the code, error TypeError: Cannot read property 'quantity' of undefined/*

## Bug 2 — Tax is calculated before coupon is applied (lines 109–122) Major

The spec says the coupon is applied **before** tax. But the code computes `totalTax` inside the `forEach` loop before the coupon subtraction happens. The coupon only reduces the pre-tax subtotal, so the customer gets taxed on money the coupon was supposed to discount.

```js
// Example: $1000 subtotal, 5% volume discount, $50 coupon, 10% tax
// Correct tax:  (1000 - 50 - 50) * 0.10 = 90.00
// Actual tax:   (1000 - 50)      * 0.10 = 95.00  ← $5 overcharge
```

*Found by reading the business rules at the top of the file, which say coupon is applied before tax. Then I traced the code and saw `totalTax` was being accumulated inside the `forEach` on line 114 — before the coupon block on line 119 even runs. Manually calculating with round numbers confirmed the tax was higher than it should be.*

## Bug 3 — Coupon can make total go negative (line 121) Major

There is no check to prevent the coupon from exceeding the remaining subtotal. If the coupon is worth more than the order, `afterVolumeDiscount` goes negative and so does the final total.

```js
// Fix
afterVolumeDiscount = Math.max(0, afterVolumeDiscount - couponDiscount);
```

*Found by reading line 121 and asking what happens if `couponDiscount` is larger than `afterVolumeDiscount`. There is no `Math.max` or conditional check — the subtraction just goes negative and the final total becomes negative too. Tested with a $5 order and a $100 coupon to confirm.*

## Bug 4 — `updateQuantity` accepts invalid values (line 54) Minor

No validation — quantity can be set to `0`, `-5`, or `1.5`. This silently corrupts the subtotal without any error.

```js
// Fix
if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
  throw new Error("Quantity must be a positive integer.");
}
```

*Found by reading line 54  `item.quantity = newQuantity` with no condition around it. Tested by calling `updateQuantity("WIDGET-A", -3)` and then `calculateTotal()`, which returned a negative subtotal with no warning.*

## Bug 5 — `addLineItem` accepts invalid input (lines 33–40) Major

No validation on any field. Negative prices reduce the total, negative quantities do the same, and passing `taxRate: 10` instead of `0.10` inflates tax by 1000x — all silently accepted.

```js
order.addLineItem({ sku: "X", unitPrice: -100, quantity: -4, taxRate: 10 });
// No error. Order is now completely corrupted.
```

*Found by reading `addLineItem` and noticing it calls `this.lineItems.push()` directly with no checks. Tested by passing `unitPrice: -100` and `taxRate: 10` — both were accepted without error and completely broke the calculated total.*

## Bug 6 — `cancel()` returns `false` with no explanation (lines 160–165) Minor

When called in a state that doesn't allow cancellation (e.g. `"processing"`), the function silently returns `false`. The caller has no way to know why it failed.

```js
// Fix: throw instead of silent return
throw new Error(`Cannot cancel order in "${this.status}" status.`);
```

*Found by reading the `cancel()` method and noticing the only two outcomes are `return true` or `return false` — no error message, no thrown exception. Called `advanceStatus()` twice to move the order to `"processing"`, then called `cancel()` and got back `false` with no explanation of why it failed.*


## Bug 7 — `advanceStatus()` silently does nothing on terminal states (lines 151–155) Minor

Same pattern as Bug 6. Calling `advanceStatus()` on a `"delivered"` or `"cancelled"` order returns the current status unchanged with no error.

```js
// Fix
throw new Error(`Cannot advance order from "${this.status}" status.`);
```

*Found by reading the `transitions` object on line 144 — `"delivered"` and `"cancelled"` are not keys in it, so `transitions[this.status]` is `undefined`. The `if` block is skipped and the function just returns the same status. Called `advanceStatus()` on a delivered order and nothing happened — no error, no change, no feedback.*

## Bug 8 — Duplicate SKUs cause inconsistent behavior (lines 33–56) Minor

`addLineItem` allows the same SKU more than once. `updateQuantity` uses `.find()` and only updates the first match, while `removeLineItem` uses `.filter()` and deletes all matches. These are inconsistent behaviors on the same data.

```js
order.addLineItem({ sku: "A", unitPrice: 10, quantity: 5, taxRate: 0.08 });
order.addLineItem({ sku: "A", unitPrice: 10, quantity: 3, taxRate: 0.08 });
order.updateQuantity("A", 10); // Only first entry updated — second stays at 3
order.removeLineItem("A");     // Removes BOTH entries
```

*Found by reading all three methods back to back. `addLineItem` uses `.push()` with no uniqueness check, `updateQuantity` uses `.find()` which stops at the first match, and `removeLineItem` uses `.filter()` which removes every match. Added the same SKU twice, called `updateQuantity` and then `removeLineItem` — only the first entry got the new quantity, but both got deleted.*

## Bug 9 — Missing SKU is silently ignored (lines 44–56) Minor

If a SKU doesn't exist, both `updateQuantity` and `removeLineItem` complete without any error or feedback. The caller cannot tell if the operation succeeded.

```js
order.updateQuantity("FAKE-SKU", 10); // Does nothing, no error
order.removeLineItem("FAKE-SKU");     // Does nothing, no error
```
*Found by reading `updateQuantity` — if `.find()` returns `undefined`, the `if (item)` block is skipped and the function returns nothing. Same with `removeLineItem`: `.filter()` just returns the original array unchanged if no match is found. Tested both with a SKU that doesn't exist and got no error and no output.*

## Bug 10 — `getTotalItemCount` is called twice per `getSummary` (lines 171–173) Minor

`getSummary` calls `calculateTotal()` which internally calls `getTotalItemCount()`, then immediately calls `getTotalItemCount()` again directly on line 173. Redundant and amplifies any crash from Bug 1.

*Found by reading `getSummary` line by line. Line 171 calls `calculateTotal()`, and inside that, `getVolumeDiscountPercent()` calls `getTotalItemCount()`. Then line 173 calls `getTotalItemCount()` again directly. The loop runs twice every time you call `getSummary`, and with Bug 1 present, it crashes twice instead of once.*

## Bug 11 — `applyCoupon` does not validate the discount amount (lines 61–63) Major

A negative `discountAmount` silently increases the total instead of reducing it. A non-numeric value like `"abc"` produces `NaN` that propagates and corrupts every calculated field.

```js
order.applyCoupon({ code: "BAD", discountAmount: -20 });
// Customer gets charged MORE, not less. No error thrown.

order.applyCoupon({ code: "BAD2", discountAmount: "abc" });
// result.total === NaN
```

*Found by reading `applyCoupon` on line 62 — it just does `this.coupon = coupon` with nothing else. Tested with `discountAmount: -20` and the total went up instead of down. Tested with `discountAmount: "abc"` and every field in the result came back as `NaN`.*

## Bug 12 — Cancelled orders can still be modified (lines 33–74) Major

After `cancel()` is called, none of the mutating methods (`addLineItem`, `updateQuantity`, `applyCoupon`, `setRush`) check the order status. A cancelled order can be freely modified, which violates basic business rules and can corrupt audit data.

```js
order.cancel();
order.addLineItem({ sku: "WIDGET-B", unitPrice: 50, quantity: 2, taxRate: 0.08 });
// No error. Item added to a cancelled order.
```

*Found by reading each mutating method — `addLineItem`, `updateQuantity`, `applyCoupon`, `setRush` — and noticing none of them check `this.status` before making changes. Called `cancel()` and then `addLineItem()` right after — the item was added with no error. The order was cancelled but still fully editable.*


