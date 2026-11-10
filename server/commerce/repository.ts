import { createClient } from "@supabase/supabase-js";
import type { DeliveryDetails } from "../../src/features/checkout/types/checkoutTypes.ts";
import type {
  CustomerOrder, OrderAmounts, OrderEvent, OrderLine, OrderingMode, OrderStatus,
  PaymentMethod, PaymentState, StaffOrder,
} from "../../src/features/orders/types/orderTypes.ts";
import { CommerceError, type CommerceConfig } from "./config.ts";

export interface OrderRow {
  id: string;
  mode: OrderingMode;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_state: PaymentState;
  lines: OrderLine[];
  amounts: OrderAmounts;
  delivery_details: DeliveryDetails;
  events: OrderEvent[];
  created_at: string;
  revision: number;
  prep_minutes: number | null;
  delivery_minutes: number | null;
  eta_at: string | null;
  decline_reason: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  gateway_started_at: string | null;
  last_staff_user: string | null;
}

interface Reservation {
  key: string;
  hash: string;
  phoneHash: string;
  method: PaymentMethod;
  lines: OrderLine[];
  amounts: OrderAmounts;
  details: DeliveryDetails;
}

const unavailable = () => new CommerceError(503, "The order service is temporarily unavailable.");

export function createOrderRepository(config: CommerceConfig) {
  const db = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(8_000)])
          : AbortSignal.timeout(8_000),
      }),
    },
  });
  const mode = config.mode;
  return {
    async acceptingOrders() {
      const { data, error } = await db.from("kitchen_ordering").select("accepting_orders").eq("mode", mode).single();
      if (error) throw unavailable();
      return data.accepting_orders === true;
    },
    async authorizeDeliveryLookup(phoneHash: string) {
      const { error } = await db.rpc("authorize_delivery_lookup", {
        p_mode: mode,
        p_phone_hash: phoneHash,
      });
      if (error?.message === "kitchen_closed") throw new CommerceError(409, "The kitchen is paused for new orders.");
      if (error?.message === "delivery_lookup_limit")
        throw new CommerceError(429, "Too many delivery checks. Please wait and try again.");
      if (error) throw unavailable();
    },
    async setKitchenOpen(accepting: boolean, user: string) {
      const { error } = await db.from("kitchen_ordering").update({
        accepting_orders: accepting,
        changed_at: new Date().toISOString(),
        changed_by: user,
      }).eq("mode", mode);
      if (error) throw unavailable();
    },
    async staffUser(header: string | null) {
      const token = /^Bearer (\S+)$/.exec(header ?? "")?.[1];
      if (!token) throw new CommerceError(401, "Sign in to open the kitchen console.");
      const { data: { user }, error: authError } = await db.auth.getUser(token);
      if (authError || !user) throw new CommerceError(401, "Your sign-in expired. Sign in again.");
      const { data, error } = await db.from("kitchen_staff").select("user_id").eq("user_id", user.id).maybeSingle();
      if (error) throw unavailable();
      if (!data) throw new CommerceError(403, "This account does not have kitchen access.");
      return user.id;
    },
    async reserve(order: Reservation): Promise<OrderRow> {
      const { data, error } = await db.rpc("reserve_kitchen_order", {
        p_request_key: order.key,
        p_request_hash: order.hash,
        p_phone_hash: order.phoneHash,
        p_mode: mode,
        p_payment_method: order.method,
        p_lines: order.lines,
        p_amounts: order.amounts,
        p_details: order.details,
      });
      if (error?.message === "kitchen_closed") throw new CommerceError(409, "The kitchen is paused for new orders.");
      if (error?.message === "request_conflict") throw new CommerceError(409, "This checkout attempt belongs to a different order.");
      if (error?.message === "order_rate_limit") throw new CommerceError(429, "Too many orders were submitted. Please wait and try again.");
      if (error || !data) throw unavailable();
      return data as OrderRow;
    },
    async findReservation(key: string) {
      const { data, error } = await db.from("kitchen_orders").select("*").eq("mode", mode).eq("request_key", key).maybeSingle();
      if (error) throw unavailable();
      return data as (OrderRow & { request_hash: string }) | null;
    },
    async find(value: string, field: "id" | "razorpay_order_id" | "razorpay_payment_id" = "id") {
      const { data, error } = await db.from("kitchen_orders").select("*").eq("mode", mode).eq(field, value).maybeSingle();
      if (error) throw unavailable();
      return data as OrderRow | null;
    },
    async list(page: number, queue: "active" | "history" | "unpaid") {
      const limit = 30;
      const query = db.from("kitchen_orders").select("*").eq("mode", mode);
      if (queue === "history") query.in("status", ["delivered", "declined"]);
      else if (queue === "unpaid") query.eq("status", "unpaid");
      else query.in("status", ["pending", "accepted", "preparing", "ready", "out_for_delivery"]);
      const { data, error } = await query.order("created_at", { ascending: false })
        .order("id", { ascending: false }).range(page * limit, (page + 1) * limit);
      if (error) throw unavailable();
      return {
        orders: (data as OrderRow[]).slice(0, limit).map(staffView),
        hasMore: data.length > limit,
      };
    },
    async update(row: OrderRow, patch: Partial<OrderRow>) {
      const { data, error } = await db.from("kitchen_orders")
        .update({ ...patch, revision: row.revision + 1 })
        .eq("id", row.id).eq("mode", mode).eq("revision", row.revision).select().maybeSingle();
      if (error) throw unavailable();
      return data as OrderRow | null;
    },
  };
}

export type OrderRepository = ReturnType<typeof createOrderRepository>;

export function customerView(row: OrderRow): CustomerOrder {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentState: row.payment_state,
    lines: row.lines,
    amounts: row.amounts,
    createdAt: row.created_at,
    events: row.events,
    prepMinutes: row.prep_minutes,
    deliveryMinutes: row.delivery_minutes,
    etaAt: row.eta_at,
    declineReason: row.decline_reason,
  };
}

export function staffView(row: OrderRow): StaffOrder {
  return {
    ...customerView(row),
    details: row.delivery_details,
    revision: row.revision,
    paymentReference: row.razorpay_payment_id ?? row.razorpay_order_id,
  };
}
