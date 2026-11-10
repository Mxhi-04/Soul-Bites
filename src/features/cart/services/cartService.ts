import { APP_CONFIG } from "../../../constants/config.ts";
import { menuService } from "../../menu/services/menuService.ts";
import type { CartItem, CartPricingSummary } from "../types/cartTypes.ts";

export const CART_STORAGE_KEY = "soul_bites_cart";
export const MAX_ITEM_QUANTITY = APP_CONFIG.cart.maxItemQuantity;

/** Restore identifiers and quantities only; stored names and prices are never authoritative. */
export function hydrateCart(value: unknown): CartItem[] {
  const rows: unknown[] = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        "version" in value &&
        value.version === 1 &&
        "items" in value &&
        Array.isArray(value.items)
      ? value.items
      : [];
  const quantities = new Map<string, number>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const legacy =
      "item" in row &&
      row.item &&
      typeof row.item === "object" &&
      "id" in row.item
        ? row.item.id
        : undefined;
    const id = "itemId" in row ? row.itemId : legacy;
    const quantity = "quantity" in row ? row.quantity : undefined;
    if (
      typeof id !== "string" ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    )
      continue;
    if (!menuService.getItemById(id)) continue;
    quantities.set(
      id,
      Math.min(MAX_ITEM_QUANTITY, (quantities.get(id) ?? 0) + quantity),
    );
  }
  return [...quantities].map(([id, quantity]) => ({
    item: menuService.getItemById(id)!,
    quantity,
  }));
}

export function serializeCart(items: CartItem[]) {
  return {
    version: 1,
    items: items.map(({ item, quantity }) => ({ itemId: item.id, quantity })),
  };
}

export function calculatePricing(items: CartItem[]): CartPricingSummary {
  const validItems = hydrateCart(serializeCart(items));
  const subtotalPaise = validItems.reduce(
    (sum, { item, quantity }) => sum + Math.round(item.price * 100) * quantity,
    0,
  );
  const deliveryPaise =
    subtotalPaise === 0 ||
    subtotalPaise >= APP_CONFIG.delivery.freeDeliveryThreshold * 100
      ? 0
      : Math.round(APP_CONFIG.delivery.deliveryFee * 100);
  const taxPaise = Math.round(
    (subtotalPaise * APP_CONFIG.delivery.taxRatePercentage) / 100,
  );
  return {
    subtotal: subtotalPaise / 100,
    deliveryFee: deliveryPaise / 100,
    tax: taxPaise / 100,
    discount: 0,
    total: (subtotalPaise + deliveryPaise + taxPaise) / 100,
    itemCount: validItems.reduce((sum, row) => sum + row.quantity, 0),
  };
}
