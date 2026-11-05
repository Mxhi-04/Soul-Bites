import { describe, expect, it } from "vitest";
import {
  calculatePricing,
  hydrateCart,
  MAX_ITEM_QUANTITY,
  serializeCart,
} from "./cartService";

describe("cart boundary and pricing", () => {
  it.each([
    null,
    {},
    "invalid",
    { version: 2, items: [] },
    [null, {}, { itemId: "missing", quantity: 1 }],
  ])("recovers from malformed storage: %j", (value) => {
    expect(hydrateCart(value)).toEqual([]);
  });
  it("migrates old carts and discards a forged name and negative price", () => {
    const items = hydrateCart([
      { item: { id: "sb-07", name: "Forged", price: -100 }, quantity: 1 },
    ]);
    expect(items[0].item.price).toBe(119);
    expect(items[0].item.name).not.toBe("Forged");
    expect(calculatePricing(items).total).toBe(159.95);
    expect(serializeCart(items)).toEqual({
      version: 1,
      items: [{ itemId: "sb-07", quantity: 1 }],
    });
  });
  it("rejects negative, fractional and nonnumeric quantities, merges duplicates and caps quantities", () => {
    const items = hydrateCart([
      { itemId: "sb-07", quantity: 2 },
      { itemId: "sb-07", quantity: 1000 },
      { itemId: "sb-01", quantity: -1 },
      { itemId: "sb-02", quantity: 1.5 },
      { itemId: "sb-05", quantity: "2" },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });
  it("rounds money in minor units and charges no fees for an empty cart", () => {
    expect(calculatePricing([])).toMatchObject({
      total: 0,
      tax: 0,
      deliveryFee: 0,
    });
    expect(
      calculatePricing(hydrateCart([{ itemId: "sb-07", quantity: 2 }])),
    ).toMatchObject({ subtotal: 238, tax: 11.9, total: 284.9 });
    expect(
      calculatePricing(hydrateCart([{ itemId: "sb-07", quantity: 5 }])),
    ).toMatchObject({
      subtotal: 595,
      deliveryFee: 0,
      tax: 29.75,
      total: 624.75,
    });
  });
});
