import { storage, accountStorageKey } from "../../../utils/storage";
import type { CommerceAvailability, OrderAccess } from "../types/orderTypes";

export class OrderApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function commerceRequest<T>(action: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api/commerce?action=${action}`, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new OrderApiError(response.status, data?.error ?? "The order service is temporarily unavailable.");
  return data as T;
}

export function orderRequest<T>(action: string, body: object, token?: string) {
  return commerceRequest<T>(action, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function getCommerceAvailability(signal: AbortSignal) {
  const data = await commerceRequest<CommerceAvailability>("config", { signal });
  if (data.mode !== "preview" && data.mode !== "test" && data.mode !== "live")
    throw new OrderApiError(503, "The order service is temporarily unavailable.");
  return data;
}

const trackingKey = (accountId?: string) => accountStorageKey("soul_bites_private_order_link", accountId);

export function orderLink({ id, token }: OrderAccess) {
  return `/track/${id}#${token}`;
}

export function saveOrderLink(order: OrderAccess, accountId?: string) {
  storage.set(trackingKey(accountId), orderLink(order));
}

export function latestOrderLink(accountId?: string): string | null {
  const saved = storage.get<unknown>(trackingKey(accountId), null);
  return typeof saved === "string" && /^\/track\/[\da-f-]{36}#[\da-f]{64}$/i.test(saved) ? saved : null;
}

export function readOrderLink(): OrderAccess | null {
  const id = /^\/track\/([\da-f-]{36})\/?$/i.exec(window.location.pathname)?.[1];
  const token = window.location.hash.slice(1);
  return id && /^[\da-f]{64}$/i.test(token) ? { id, token } : null;
}

export async function checkoutAttempt(draft: object, accountId?: string) {
  const storageKey = accountStorageKey("soul_bites_checkout_attempt", accountId);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(draft)));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const saved = storage.get<{ key: string; fingerprint: string } | null>(storageKey, null, "sessionStorage");
  if (saved?.fingerprint === fingerprint && typeof saved.key === "string") return saved.key;
  const key = crypto.randomUUID();
  storage.set(storageKey, { key, fingerprint }, "sessionStorage");
  return key;
}

export function clearCheckoutAttempt(accountId?: string) {
  storage.remove(accountStorageKey("soul_bites_checkout_attempt", accountId), "sessionStorage");
}
