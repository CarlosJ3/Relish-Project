function OrderProcessor() {
  this.lineItems = [];
  this.coupon = null;
  this.isRush = false;
  this.status = "draft";

  this._assertModifiable = function () {
    if (this.status === "cancelled") {
      throw new Error("Cannot modify a cancelled order.");
    }
  };

  this.addLineItem = function (item) {
    this._assertModifiable();

    if (!item.sku) {
      throw new Error("SKU is required.");
    }

    if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
      throw new Error("unitPrice must be a non-negative number.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("quantity must be a positive integer.");
    }

    if (typeof item.taxRate !== "number" || item.taxRate < 0 || item.taxRate > 1) {
      throw new Error("taxRate must be a number between 0 and 1.");
    }

    if (this.lineItems.find((i) => i.sku === item.sku)) {
      throw new Error(`SKU "${item.sku}" already exists. Use updateQuantity instead.`);
    }

    this.lineItems.push({
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      taxRate: item.taxRate ?? 0,
    });
  };

  this.removeLineItem = function (sku) {
    this._assertModifiable();

    const exists = this.lineItems.find((item) => item.sku === sku);

    if (!exists) {
      throw new Error(`SKU "${sku}" not found in order.`);
    }

    this.lineItems = this.lineItems.filter((item) => item.sku !== sku);
  };

  this.updateQuantity = function (sku, newQuantity) {
    this._assertModifiable();

    if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
      throw new Error("Quantity must be a positive integer.");
    }

    const item = this.lineItems.find((item) => item.sku === sku);

    if (!item) {
      throw new Error(`SKU "${sku}" not found in order.`);
    }

    item.quantity = newQuantity;
  };

  this.applyCoupon = function (coupon) {
    this._assertModifiable();

    if (!coupon || typeof coupon.discountAmount !== "number" || coupon.discountAmount <= 0) {
      throw new Error("Coupon discountAmount must be a positive number.");
    }

    this.coupon = coupon;
  };

  this.removeCoupon = function () {
    this.coupon = null;
  };

  this.setRush = function (isRush) {
    this._assertModifiable();
    this.isRush = isRush;
  };

  this.getTotalItemCount = function () {
    let count = 0;

    for (let i = 0; i < this.lineItems.length; i++) {
      count += this.lineItems[i].quantity;
    }

    return count;
  };

  this.getVolumeDiscountPercent = function () {
    const count = this.getTotalItemCount();

    if (count >= 100) return 20;
    if (count >= 50) return 15;
    if (count >= 25) return 10;
    if (count >= 10) return 5;

    return 0;
  };

  this.calculateTotal = function () {
    const volumeDiscountPercent = this.getVolumeDiscountPercent();

    let subtotal = 0;

    const lineData = this.lineItems.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      const discountedLineSubtotal = lineSubtotal * (1 - volumeDiscountPercent / 100);

      subtotal += lineSubtotal;

      return { item, lineSubtotal, discountedLineSubtotal };
    });

    const volumeDiscount = subtotal * (volumeDiscountPercent / 100);
    const afterVolumeDiscount = subtotal - volumeDiscount;

    let couponDiscount = 0;

    if (this.coupon) {
      couponDiscount = Math.min(this.coupon.discountAmount, afterVolumeDiscount);
    }

    const afterCoupon = Math.max(0, afterVolumeDiscount - couponDiscount);

    const couponFactor =
      afterVolumeDiscount > 0 ? afterCoupon / afterVolumeDiscount : 1;

    let totalTax = 0;

    lineData.forEach(({ discountedLineSubtotal, item }) => {
      totalTax += discountedLineSubtotal * couponFactor * item.taxRate;
    });

    const rushSurcharge = this.isRush ? 15.0 : 0;

    const total = afterCoupon + totalTax + rushSurcharge;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      volumeDiscount: Math.round(volumeDiscount * 100) / 100,
      couponDiscount: Math.round(couponDiscount * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      rushSurcharge,
      total: Math.round(total * 100) / 100,
    };
  };

  this.advanceStatus = function () {
    const transitions = {
      draft: "submitted",
      submitted: "processing",
      processing: "shipped",
      shipped: "delivered",
    };

    if (transitions[this.status]) {
      this.status = transitions[this.status];
      return this.status;
    }

    throw new Error(`Cannot advance order from "${this.status}" status.`);
  };

  this.cancel = function () {
    if (this.status === "draft" || this.status === "submitted") {
      this.status = "cancelled";
      return true;
    }

    throw new Error(`Cannot cancel order in "${this.status}" status.`);
  };

  this.getSummary = function () {
    const totals = this.calculateTotal();
    const itemCount = this.getTotalItemCount();

    return {
      itemCount,
      lineItemCount: this.lineItems.length,
      status: this.status,
      isRush: this.isRush,
      hasCoupon: this.coupon !== null,
      ...totals,
    };
  };
}

module.exports = OrderProcessor;
