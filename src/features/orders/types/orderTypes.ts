import type { DeliveryDetails } from "../../checkout/types/checkoutTypes";

export type OrderingMode = "test" | "live";
export type PaymentMethod = "cod" | "razorpay";
export type PaymentState =
  | "awaiting_payment"
  | "cash_due"
  | "cash_collected"
  | "paid"
  | "void"
  | "refund_required"
  | "refund_pending"
  | "refunded"
  | "refund_failed";

export const FULFILMENT_STAGES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof FULFILMENT_STAGES)[number] | "unpaid" | "declined";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  unpaid: "Awaiting payment",
  pending: "Waiting for kitchen acceptance",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for dispatch",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  declined: "Declined",
};

export const PAYMENT_LABELS: Record<PaymentState, string> = {
  awaiting_payment: "Awaiting payment confirmation",
  cash_due: "Cash on delivery",
  cash_collected: "Cash collected",
  paid: "Paid online",
  void: "No cash due",
  refund_required: "Refund due",
  refund_pending: "Refund processing",
  refunded: "Refund processed",
  refund_failed: "Refund needs kitchen attention",
};

export interface PricingRules {
  minimumPaise: number;
  deliveryPaise: number;
  freeDeliveryPaise: number;
  taxBps: number;
}

export type CommerceAvailability =
  | { mode: "preview" }
  | {
      mode: OrderingMode;
      acceptingOrders: boolean;
      methods: PaymentMethod[];
      pricing: PricingRules;
      deliveryArea?: { postalCodes: string[]; radiusMetres: number };
    };

export interface OrderLine {
  itemId: string;
  name: string;
  quantity: number;
  unitPaise: number;
}

export interface OrderAmounts {
  subtotalPaise: number;
  deliveryPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
}

export interface CustomerOrder {
  id: string;
  mode: OrderingMode;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  lines: OrderLine[];
  amounts: OrderAmounts;
  createdAt: string;
  events: OrderEvent[];
  prepMinutes: number | null;
  deliveryMinutes: number | null;
  etaAt: string | null;
  declineReason: string | null;
}

export interface StaffOrder extends CustomerOrder {
  details: DeliveryDetails;
  revision: number;
  paymentReference: string | null;
}

export interface OrderAccess {
  id: string;
  token: string;
}

export interface GatewayCheckout {
  keyId: string;
  providerOrderId: string;
  amount: number;
}

export interface OrderResponse {
  order: CustomerOrder;
  access: OrderAccess;
  checkout?: GatewayCheckout;
}

export type StaffAction =
  | { action: "accept"; prepMinutes: number; deliveryMinutes: number }
  | { action: "decline"; reason: string }
  | { action: "prepare" | "ready" | "dispatch" }
  | { action: "deliver"; cashCollected: boolean }
  | { action: "refund" };
