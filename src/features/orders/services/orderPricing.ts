import type { CartItem } from "../../cart/types/cartTypes.ts";
import type { OrderAmounts, OrderLine, PricingRules } from "../types/orderTypes.ts";

export function priceOrder(lines: OrderLine[], rules: PricingRules): OrderAmounts {
  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPaise,
    0,
  );
  const deliveryPaise =
    subtotalPaise === 0 || subtotalPaise >= rules.freeDeliveryPaise
      ? 0
      : rules.deliveryPaise;
  const taxPaise = Math.round((subtotalPaise * rules.taxBps) / 10_000);
  return {
    subtotalPaise,
    deliveryPaise,
    taxPaise,
    totalPaise: subtotalPaise + deliveryPaise + taxPaise,
  };
}

export function orderLines(items: CartItem[]): OrderLine[] {
  return items.map(({ item, quantity }) => ({
    itemId: item.id,
    name: item.name,
    quantity,
    unitPaise: Math.round(item.price * 100),
  }));
}
