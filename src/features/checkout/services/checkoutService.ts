import { APP_CONFIG } from "../../../constants/config";
import { storage } from "../../../utils/storage";
import { calculatePricing, hydrateCart } from "../../cart/services/cartService";
import { CartItem } from "../../cart/types/cartTypes";
import { DeliveryDetails, OrderPreview } from "../types/checkoutTypes";
import {
  normalizePhone,
  validateCheckoutForm,
} from "../validation/checkoutValidation";

export const PREVIEW_STORAGE_KEY = "soul_bites_order_preview";

function validDetails(value: unknown): value is DeliveryDetails {
  return Boolean(
    value &&
      typeof value === "object" &&
      [
        "fullName",
        "phone",
        "address",
        "unitApt",
        "city",
        "postalCode",
        "deliveryNotes",
      ].every(
        (key) =>
          key in value &&
          typeof (value as Record<string, unknown>)[key] === "string",
      ),
  );
}

export function restoreOrderPreview(): OrderPreview | null {
  const stored = storage.get<unknown>(
    PREVIEW_STORAGE_KEY,
    null,
    "sessionStorage",
  );
  if (!stored || typeof stored !== "object") return null;
  if (
    !(
      "kind" in stored &&
      stored.kind === "preview" &&
      "orderId" in stored &&
      typeof stored.orderId === "string" &&
      /^PREVIEW-[a-z0-9-]+$/i.test(stored.orderId) &&
      "placedAt" in stored &&
      typeof stored.placedAt === "string" &&
      Number.isFinite(Date.parse(stored.placedAt)) &&
      "deliveryDetails" in stored &&
      validDetails(stored.deliveryDetails) &&
      validateCheckoutForm(stored.deliveryDetails).isValid &&
      "items" in stored
    )
  )
    return null;
  const items = hydrateCart(stored.items);
  const pricing = calculatePricing(items);
  if (pricing.subtotal < APP_CONFIG.delivery.minimumOrderAmount) return null;
  return {
    kind: "preview",
    orderId: stored.orderId,
    placedAt: stored.placedAt,
    items,
    pricing,
    deliveryDetails: stored.deliveryDetails,
  };
}

export async function createOrderPreview(
  details: DeliveryDetails,
  cart: CartItem[],
  signal: AbortSignal,
): Promise<OrderPreview> {
  if (!validateCheckoutForm(details).isValid)
    throw new Error("Check your delivery details.");
  const items = hydrateCart(cart);
  const pricing = calculatePricing(items);
  if (pricing.subtotal < APP_CONFIG.delivery.minimumOrderAmount)
    throw new Error(
      `The minimum food subtotal is ₹${APP_CONFIG.delivery.minimumOrderAmount}.`,
    );
  signal.throwIfAborted();
  // A cancellable preview transition, not a simulated payment or network request.
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Preview cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 300);
    signal.addEventListener("abort", abort, { once: true });
  });
  signal.throwIfAborted();
  const order: OrderPreview = {
    kind: "preview",
    orderId: `PREVIEW-${crypto.randomUUID()}`,
    items,
    pricing,
    deliveryDetails: {
      fullName: details.fullName.trim(),
      phone: normalizePhone(details.phone),
      address: details.address.trim(),
      unitApt: details.unitApt.trim(),
      city: details.city.trim(),
      postalCode: details.postalCode.trim(),
      deliveryNotes: details.deliveryNotes.trim(),
    },
    placedAt: new Date().toISOString(),
  };
  if (!storage.set(PREVIEW_STORAGE_KEY, order, "sessionStorage"))
    throw new Error(
      "This browser could not save the preview. Allow session storage and try again.",
    );
  return order;
}

export function clearOrderPreview() {
  storage.remove(PREVIEW_STORAGE_KEY, "sessionStorage");
}
