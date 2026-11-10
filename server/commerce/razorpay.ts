import { createHmac, timingSafeEqual } from "node:crypto";
import { CommerceError, type RazorpayConfig } from "./config.ts";

export function sign(secret: string, value: string | Uint8Array) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function matchesSignature(expected: string, actual: unknown): boolean {
  return typeof actual === "string" && /^[a-f0-9]{64}$/i.test(actual)
    && timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
}

export interface RazorpayRefund {
  id: string;
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
}

export function razorpayId(value: unknown, prefix: string): value is string {
  return typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9]{6,80}$`).test(value);
}

export async function razorpayRequest<T>(
  config: RazorpayConfig,
  path: string,
  body?: object,
  idempotencyKey?: string,
): Promise<T> {
  const headers = new Headers({
    Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
  });
  if (body) headers.set("Content-Type", "application/json");
  if (idempotencyKey) headers.set("X-Refund-Idempotency", idempotencyKey);
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Provider status ${response.status}`);
    return await response.json() as T;
  } catch {
    throw new CommerceError(502, "Razorpay could not confirm the request. Check the order before trying again.");
  }
}
