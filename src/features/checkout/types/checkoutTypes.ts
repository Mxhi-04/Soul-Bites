import { CartItem, CartPricingSummary } from "../../cart/types/cartTypes";

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  unitApt: string;
  city: string;
  postalCode: string;
  deliveryNotes: string;
}
export type CheckoutFormErrors = Partial<Record<keyof DeliveryDetails, string>>;

/** A local preview is never evidence of payment or kitchen acceptance. */
export interface OrderPreview {
  kind: "preview";
  orderId: string;
  items: CartItem[];
  pricing: CartPricingSummary;
  deliveryDetails: DeliveryDetails;
  placedAt: string;
}
