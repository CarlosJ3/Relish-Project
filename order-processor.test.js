/**
 * order-processor.test.js
 * Tests run against both the original (buggy) and fixed OrderProcessor.
 */
const fs = require("fs");
const path = require("path");

// Load original constructor only (skip the crashing usage example at the bottom)
function loadOriginal() {
  const code = fs.readFileSync(path.join(__dirname, "order-processor.js"), "utf8");
  const cutoff = code.search(/\/\*[\r\n]+\s*Usage example/);
  const fn = new Function((cutoff > 0 ? code.substring(0, cutoff) : code) + "\nreturn OrderProcessor;");
  return fn();
}

const Original = loadOriginal();
const Fixed = require("./order-processor.fixed.js");

const ITEM  = { sku: "A", unitPrice: 10,  quantity: 5,  taxRate: 0.1 };
const ITEM2 = { sku: "B", unitPrice: 20,  quantity: 5,  taxRate: 0.1 };

function order(...items) {
  const o = new Fixed();
  items.forEach(i => o.addLineItem(i));
  return o;
}

// ── Bug Proofs ────────────────────────────────────────────────────────────────

test("Bug 1 ORIGINAL: getTotalItemCount crashes with TypeError", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  expect(() => o.getTotalItemCount()).toThrow(TypeError);
});
test("Bug 1 FIXED: getTotalItemCount returns correct count", () => {
  expect(order(ITEM).getTotalItemCount()).toBe(5);
});

test("Bug 2 ORIGINAL: tax overcharged when coupon applied", () => {
  const o = new Original();
  o.addLineItem({ sku: "A", unitPrice: 100, quantity: 10, taxRate: 0.1 });
  o.applyCoupon({ code: "C", discountAmount: 50 });
  expect(o.calculateTotal().tax).toBeGreaterThan(95); // should be 95, original returns 100
});
test("Bug 2 FIXED: tax calculated on post-coupon amount", () => {
  const o = order({ sku: "A", unitPrice: 100, quantity: 10, taxRate: 0.1 });
  o.applyCoupon({ code: "C", discountAmount: 50 });
  expect(o.calculateTotal().tax).toBe(95);
});

test("Bug 3 ORIGINAL: coupon produces negative total", () => {
  const o = new Original();
  o.addLineItem({ sku: "A", unitPrice: 5, quantity: 1, taxRate: 0 });
  o.applyCoupon({ code: "C", discountAmount: 100 });
  expect(o.calculateTotal().total).toBeLessThan(0);
});
test("Bug 3 FIXED: total is never negative", () => {
  const o = order({ sku: "A", unitPrice: 5, quantity: 1, taxRate: 0 });
  o.applyCoupon({ code: "C", discountAmount: 100 });
  expect(o.calculateTotal().total).toBeGreaterThanOrEqual(0);
});

test("Bug 4 ORIGINAL: updateQuantity accepts negative values", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  expect(() => o.updateQuantity("A", -3)).not.toThrow();
});
test("Bug 4 FIXED: updateQuantity rejects negative/zero/float values", () => {
  const o = order(ITEM);
  expect(() => o.updateQuantity("A", -3)).toThrow();
  expect(() => o.updateQuantity("A",  0)).toThrow();
  expect(() => o.updateQuantity("A", 1.5)).toThrow();
});

test("Bug 5 ORIGINAL: addLineItem accepts negative price and bad taxRate", () => {
  const o = new Original();
  expect(() => o.addLineItem({ sku: "A", unitPrice: -10, quantity: 1, taxRate: 10 })).not.toThrow();
});
test("Bug 5 FIXED: addLineItem validates all fields", () => {
  const o = new Fixed();
  expect(() => o.addLineItem({ sku: "A", unitPrice: -10, quantity: 1,  taxRate: 0.1 })).toThrow();
  expect(() => o.addLineItem({ sku: "A", unitPrice: 10,  quantity: -1, taxRate: 0.1 })).toThrow();
  expect(() => o.addLineItem({ sku: "A", unitPrice: 10,  quantity: 1,  taxRate: 10  })).toThrow();
});

test("Bug 6 ORIGINAL: cancel() returns false silently on invalid state", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  o.advanceStatus(); o.advanceStatus(); // → processing
  expect(o.cancel()).toBe(false);
});
test("Bug 6 FIXED: cancel() throws when order cannot be cancelled", () => {
  const o = order(ITEM);
  o.advanceStatus(); o.advanceStatus();
  expect(() => o.cancel()).toThrow(/Cannot cancel/);
});

test("Bug 7 ORIGINAL: advanceStatus() silently no-ops on terminal state", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  ["submitted","processing","shipped","delivered"].forEach(() => o.advanceStatus());
  expect(() => o.advanceStatus()).not.toThrow(); // silent no-op
});
test("Bug 7 FIXED: advanceStatus() throws on terminal state", () => {
  const o = order(ITEM);
  ["submitted","processing","shipped","delivered"].forEach(() => o.advanceStatus());
  expect(() => o.advanceStatus()).toThrow(/Cannot advance/);
});

test("Bug 8 ORIGINAL: duplicate SKU is allowed", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  expect(() => o.addLineItem(ITEM)).not.toThrow();
});
test("Bug 8 FIXED: duplicate SKU throws", () => {
  const o = order(ITEM);
  expect(() => o.addLineItem(ITEM)).toThrow(/already exists/);
});

test("Bug 9 ORIGINAL: updateQuantity silently ignores missing SKU", () => {
  const o = new Original();
  expect(() => o.updateQuantity("FAKE", 5)).not.toThrow();
});
test("Bug 9 FIXED: updateQuantity and removeLineItem throw on missing SKU", () => {
  const o = new Fixed();
  expect(() => o.updateQuantity("FAKE", 5)).toThrow(/not found/);
  expect(() => o.removeLineItem("FAKE")).toThrow(/not found/);
});

test("Bug 11 ORIGINAL: negative discountAmount increases total", () => {
  const o = new Original();
  o.addLineItem({ sku: "A", unitPrice: 100, quantity: 1, taxRate: 0 });
  o.applyCoupon({ code: "C", discountAmount: -20 });
  expect(o.calculateTotal().total).toBeGreaterThan(100);
});
test("Bug 11 FIXED: applyCoupon rejects invalid discountAmount", () => {
  const o = new Fixed();
  expect(() => o.applyCoupon({ code: "C", discountAmount: -20  })).toThrow();
  expect(() => o.applyCoupon({ code: "C", discountAmount: "abc"})).toThrow();
});

test("Bug 12 ORIGINAL: cancelled order can still be modified", () => {
  const o = new Original();
  o.addLineItem(ITEM);
  o.cancel();
  expect(() => o.addLineItem(ITEM2)).not.toThrow();
});
test("Bug 12 FIXED: all mutations blocked after cancel", () => {
  const o = order(ITEM);
  o.cancel();
  expect(() => o.addLineItem(ITEM2)).toThrow(/cancelled/);
  expect(() => o.setRush(true)).toThrow(/cancelled/);
  expect(() => o.applyCoupon({ code: "C", discountAmount: 5 })).toThrow(/cancelled/);
});

// ── Business Logic ────────────────────────────────────────────────────────────

test("volume discount: 0% < 10 items, 5% @10, 10% @25, 15% @50, 20% @100", () => {
  const pct = (qty) => {
    const o = new Fixed();
    o.addLineItem({ sku: "A", unitPrice: 1, quantity: qty, taxRate: 0 });
    return o.getVolumeDiscountPercent();
  };
  expect(pct(9)).toBe(0);
  expect(pct(10)).toBe(5);
  expect(pct(25)).toBe(10);
  expect(pct(50)).toBe(15);
  expect(pct(100)).toBe(20);
});

test("rush surcharge adds exactly $15", () => {
  const o = order({ sku: "A", unitPrice: 100, quantity: 1, taxRate: 0 });
  o.setRush(true);
  expect(o.calculateTotal().rushSurcharge).toBe(15);
  expect(o.calculateTotal().total).toBe(115);
});

test("coupon reduces total after volume discount", () => {
  // 10 items @ $10 = $100, 5% discount → $95, $10 coupon → $85
  const o = order({ sku: "A", unitPrice: 10, quantity: 10, taxRate: 0 });
  o.applyCoupon({ code: "C", discountAmount: 10 });
  expect(o.calculateTotal().total).toBe(85);
});

test("status transitions follow the correct sequence", () => {
  const o = order(ITEM);
  expect(o.advanceStatus()).toBe("submitted");
  expect(o.advanceStatus()).toBe("processing");
  expect(o.advanceStatus()).toBe("shipped");
  expect(o.advanceStatus()).toBe("delivered");
});

test("can cancel from draft or submitted only", () => {
  const o1 = order(ITEM);
  expect(o1.cancel()).toBe(true);

  const o2 = order(ITEM);
  o2.advanceStatus();
  expect(o2.cancel()).toBe(true);
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

test("empty order returns all zeros", () => {
  const result = new Fixed().calculateTotal();
  expect(result.subtotal).toBe(0);
  expect(result.total).toBe(0);
  expect(result.tax).toBe(0);
});

test("coupon equal to subtotal → total is 0", () => {
  const o = order({ sku: "A", unitPrice: 50, quantity: 1, taxRate: 0 });
  o.applyCoupon({ code: "C", discountAmount: 50 });
  expect(o.calculateTotal().total).toBe(0);
});

test("full scenario: volume discount + coupon + tax + rush", () => {
  // 10 × $100, 5% vol discount → $950, $50 coupon → $900, 10% tax → $90, +$15 rush = $1005
  const o = new Fixed();
  o.addLineItem({ sku: "A", unitPrice: 100, quantity: 10, taxRate: 0.1 });
  o.applyCoupon({ code: "C", discountAmount: 50 });
  o.setRush(true);
  const r = o.calculateTotal();
  expect(r.volumeDiscount).toBe(50);
  expect(r.couponDiscount).toBe(50);
  expect(r.tax).toBe(90);
  expect(r.rushSurcharge).toBe(15);
  expect(r.total).toBe(1005);
});
