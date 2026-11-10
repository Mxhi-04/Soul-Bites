import { CommerceError } from "./config.ts";
import type { OrderRow } from "./repository.ts";
import type { OrderStatus } from "../../src/features/orders/types/orderTypes.ts";

const nextStep = {
  prepare: ["accepted", "preparing"],
  ready: ["preparing", "ready"],
  dispatch: ["ready", "out_for_delivery"],
  deliver: ["out_for_delivery", "delivered"],
} as const;

export function statusPatch(row: OrderRow, status: OrderStatus, at: string): Partial<OrderRow> {
  return { status, events: [...row.events, { status, at }] };
}

export function staffTransition(
  row: OrderRow,
  body: Record<string, unknown>,
  staff: string,
  now = new Date(),
): Partial<OrderRow> {
  const at = now.toISOString();
  const action = body.action;
  const conflict = () => new CommerceError(409, "This action is no longer available for the order.");
  const paid = row.payment_state === "paid" || row.payment_state === "cash_due";
  if (!paid) throw conflict();

  if (action === "accept") {
    if (row.status !== "pending") throw conflict();
    const minutes = (value: unknown) => {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 5 || value > 180)
        throw new CommerceError(400, "Enter prep and delivery estimates between 5 and 180 minutes.");
      return value;
    };
    const prep = minutes(body.prepMinutes);
    const delivery = minutes(body.deliveryMinutes);
    return {
      ...statusPatch(row, "accepted", at),
      prep_minutes: prep,
      delivery_minutes: delivery,
      eta_at: new Date(now.getTime() + (prep + delivery) * 60_000).toISOString(),
      last_staff_user: staff,
    };
  }
  if (action === "decline") {
    if (!["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(row.status)) throw conflict();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 3 || reason.length > 140)
      throw new CommerceError(400, "Enter a customer-facing reason between 3 and 140 characters.");
    return {
      ...statusPatch(row, "declined", at),
      payment_state: row.payment_method === "cod" ? "void" : "refund_required",
      decline_reason: reason,
      eta_at: null,
      last_staff_user: staff,
    };
  }
  if (action !== "prepare" && action !== "ready" && action !== "dispatch" && action !== "deliver")
    throw new CommerceError(400, "Choose a valid kitchen action.");
  const [from, to] = nextStep[action];
  if (row.status !== from) throw conflict();

  const patch = { ...statusPatch(row, to, at), last_staff_user: staff };
  if (action === "deliver" && row.payment_method === "cod") {
    if (body.cashCollected !== true)
      throw new CommerceError(400, "Confirm that cash was collected before marking delivered.");
    patch.payment_state = "cash_collected";
  }
  if (action === "dispatch" && row.delivery_minutes) {
    patch.eta_at = new Date(now.getTime() + row.delivery_minutes * 60_000).toISOString();
  }
  return patch;
}
