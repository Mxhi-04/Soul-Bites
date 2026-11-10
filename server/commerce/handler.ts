import { hydrateCart } from "../../src/features/cart/services/cartService.ts";
import type { DeliveryDetails } from "../../src/features/checkout/types/checkoutTypes.ts";
import { normalizePhone, validateCheckoutForm } from "../../src/features/checkout/validation/checkoutValidation.ts";
import { orderLines, priceOrder } from "../../src/features/orders/services/orderPricing.ts";
import type { OrderResponse } from "../../src/features/orders/types/orderTypes.ts";
import { CommerceError, loadCommerceConfig, type CommerceConfig, type CommerceEnv } from "./config.ts";
import { verifyDeliveryRadius } from "./deliveryArea.ts";
import { createOrderRepository, customerView, staffView, type OrderRepository, type OrderRow } from "./repository.ts";
import { matchesSignature, razorpayId, razorpayRequest, sign, type RazorpayOrder, type RazorpayPayment, type RazorpayRefund } from "./razorpay.ts";
import { staffTransition, statusPatch } from "./transitions.ts";

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const detailFields = ["fullName", "phone", "address", "unitApt", "city", "postalCode", "deliveryNotes"] as const;
const changes = () => new CommerceError(409, "The order changed. Refresh its status and try again.");

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CommerceError(400, "Invalid request.");
  return value as Record<string, unknown>;
}

async function rawBody(request: Request) {
  const maxBytes = 64 * 1024;
  if (Number(request.headers.get("content-length")) > maxBytes || !request.body)
    throw new CommerceError(400, "Invalid request body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new CommerceError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function parseBody(raw: Buffer) {
  try {
    return object(JSON.parse(raw.toString("utf8")));
  } catch {
    throw new CommerceError(400, "Invalid request body.");
  }
}

function orderId(value: unknown) {
  if (typeof value !== "string" || !uuid.test(value))
    throw new CommerceError(400, "Invalid order reference.");
  return value.toLowerCase();
}

function access(config: CommerceConfig, row: OrderRow) {
  return { id: row.id, token: sign(config.accessSecret, `order:${row.mode}:${row.id}`) };
}

async function privateOrder(config: CommerceConfig, repo: OrderRepository, body: Record<string, unknown>) {
  const id = orderId(body.id);
  const expected = sign(config.accessSecret, `order:${config.mode}:${id}`);
  if (!matchesSignature(expected, body.token)) throw new CommerceError(404, "Order link is invalid or unavailable.");
  const row = await repo.find(id);
  if (!row) throw new CommerceError(404, "Order link is invalid or unavailable.");
  return row;
}

async function createOrder(config: CommerceConfig, repo: OrderRepository, body: Record<string, unknown>): Promise<OrderResponse> {
  const key = orderId(body.requestKey);
  const method = body.paymentMethod;
  if (method !== "cod" && method !== "razorpay")
    throw new CommerceError(400, "Choose an available payment method.");
  const draft = object(body.details);
  const details = Object.fromEntries(detailFields.map((field) => {
    const value = draft[field];
    if (typeof value !== "string" || value.length > 300)
      throw new CommerceError(400, "Check your delivery details.");
    return [field, value.trim()];
  })) as unknown as DeliveryDetails;
  if (!validateCheckoutForm(details).isValid) throw new CommerceError(400, "Check your delivery details.");
  details.phone = normalizePhone(details.phone);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30)
    throw new CommerceError(400, "Your cart is empty or invalid.");
  const selections = body.items.map((value) => {
    const line = object(value);
    if (typeof line.itemId !== "string" || line.itemId.length > 100
        || typeof line.quantity !== "number" || !Number.isSafeInteger(line.quantity)
        || line.quantity <= 0)
      throw new CommerceError(400, "Your cart is empty or invalid.");
    return { itemId: line.itemId, quantity: line.quantity };
  }).sort((a, b) => a.itemId.localeCompare(b.itemId));
  const hash = sign(config.accessSecret, JSON.stringify([method, selections, details, body.expectedTotalPaise]));
  const existing = await repo.findReservation(key);
  if (existing) {
    if (existing.request_hash !== hash)
      throw new CommerceError(409, "This checkout attempt belongs to a different order.");
    return { order: customerView(existing), access: access(config, existing) };
  }

  if (!config.methods.includes(method))
    throw new CommerceError(400, "Choose an available payment method.");
  if (config.deliveryPins.size && !config.deliveryPins.has(details.postalCode))
    throw new CommerceError(422, "Delivery is currently unavailable for this PIN code.");
  const hydrated = hydrateCart(selections);
  if (hydrated.length !== selections.length || selections.some((line) =>
    !hydrated.some(({ item, quantity }) => line.itemId === item.id && line.quantity === quantity),
  )) throw new CommerceError(409, "A cart item changed. Refresh the menu and review your cart.");

  const lines = orderLines(hydrated).sort((a, b) => a.itemId.localeCompare(b.itemId));
  const amounts = priceOrder(lines, config.pricing);
  if (amounts.subtotalPaise < config.pricing.minimumPaise)
    throw new CommerceError(422, "Your cart is below the minimum order subtotal.");
  if (amounts.totalPaise !== body.expectedTotalPaise)
    throw new CommerceError(409, "Pricing changed. Refresh and review the new total before ordering.");

  const phoneHash = sign(config.accessSecret, `phone:${details.phone}`);
  if (config.deliveryRadius) {
    await repo.authorizeDeliveryLookup(phoneHash);
    await verifyDeliveryRadius(config.deliveryRadius, details);
  }

  const row = await repo.reserve({ key, hash, phoneHash, method, lines, details, amounts });
  return { order: customerView(row), access: access(config, row) };
}

function gateway(config: CommerceConfig) {
  if (!config.razorpay) throw new CommerceError(503, "Online payments are unavailable.");
  return config.razorpay;
}

function matchesPayment(row: OrderRow, payment: RazorpayPayment) {
  return razorpayId(payment.id, "pay") && payment.order_id === row.razorpay_order_id
    && payment.amount === row.amounts.totalPaise && payment.currency === "INR";
}

async function recordCapture(repo: OrderRepository, row: OrderRow, payment: RazorpayPayment) {
  if (!matchesPayment(row, payment) || payment.status !== "captured")
    throw new CommerceError(422, "Payment does not match the saved order.");
  if (row.status !== "unpaid") {
    if (row.razorpay_payment_id === payment.id) return row;
    throw changes();
  }
  const updated = await repo.update(row, {
    ...statusPatch(row, "pending", new Date().toISOString()),
    payment_state: "paid",
    razorpay_payment_id: payment.id,
  });
  if (updated) return updated;
  const latest = await repo.find(row.id);
  if (latest?.razorpay_payment_id === payment.id) return latest;
  throw changes();
}

async function preparePayment(config: CommerceConfig, repo: OrderRepository, row: OrderRow): Promise<OrderResponse> {
  const credentials = gateway(config);
  if (row.payment_method !== "razorpay") throw new CommerceError(400, "This order uses cash on delivery.");
  if (row.status !== "unpaid") return { order: customerView(row), access: access(config, row) };

  if (!row.razorpay_order_id) {
    if (!await repo.acceptingOrders()) throw new CommerceError(409, "The kitchen is paused. Please wait before paying.");
    const receipt = row.id;
    let providerOrder: RazorpayOrder | undefined;
    if (row.gateway_started_at) {
      // An earlier request may have reached Razorpay even if its response was lost.
      const result = await razorpayRequest<{ items: RazorpayOrder[] }>(
        credentials, `/orders?receipt=${encodeURIComponent(receipt)}&count=10`,
      );
      const matches = result.items.filter((item) => item.receipt === receipt);
      if (matches.length > 1)
        throw new CommerceError(409, "The kitchen needs to reconcile this payment reference before you pay.");
      providerOrder = matches[0];
      if (!providerOrder && Date.now() - Date.parse(row.gateway_started_at) < 30_000)
        throw new CommerceError(409, "Payment setup is still being checked. Wait briefly and retry this order.");
    }
    if (!providerOrder) {
      const claimed = await repo.update(row, { gateway_started_at: new Date().toISOString() });
      if (!claimed) throw changes();
      row = claimed;
      providerOrder = await razorpayRequest<RazorpayOrder>(credentials, "/orders", {
        amount: row.amounts.totalPaise, currency: "INR", receipt, partial_payment: false,
      });
    }
    if (!razorpayId(providerOrder.id, "order") || providerOrder.receipt !== receipt
        || providerOrder.amount !== row.amounts.totalPaise || providerOrder.currency !== "INR")
      throw new CommerceError(502, "Razorpay returned an unexpected order.");
    const saved = await repo.update(row, { razorpay_order_id: providerOrder.id });
    if (!saved) throw changes();
    row = saved;
  }

  const providerOrderId = row.razorpay_order_id;
  if (!providerOrderId) throw changes();
  const payments = await razorpayRequest<{ items: RazorpayPayment[] }>(credentials, `/orders/${providerOrderId}/payments`);
  const captured = payments.items.find((payment) => matchesPayment(row, payment) && payment.status === "captured");
  if (captured) row = await recordCapture(repo, row, captured);
  if (row.status !== "unpaid") return { order: customerView(row), access: access(config, row) };
  if (payments.items.some((payment) => matchesPayment(row, payment) && payment.status === "authorized"))
    throw new CommerceError(409, "Razorpay is confirming your payment. Wait and refresh before paying again.");
  if (!await repo.acceptingOrders()) throw new CommerceError(409, "The kitchen is paused. Please wait before paying.");
  return {
    order: customerView(row),
    access: access(config, row),
    checkout: { keyId: credentials.keyId, providerOrderId, amount: row.amounts.totalPaise },
  };
}

async function verifyPayment(config: CommerceConfig, repo: OrderRepository, row: OrderRow, body: Record<string, unknown>) {
  const credentials = gateway(config);
  const paymentId = body.razorpay_payment_id;
  if (!row.razorpay_order_id || body.razorpay_order_id !== row.razorpay_order_id || !razorpayId(paymentId, "pay")
    || !matchesSignature(sign(credentials.keySecret, `${row.razorpay_order_id}|${paymentId}`), body.razorpay_signature))
    throw new CommerceError(400, "Payment confirmation could not be verified.");
  const payment = await razorpayRequest<RazorpayPayment>(credentials, `/payments/${paymentId}`);
  if (payment.id !== paymentId || !matchesPayment(row, payment))
    throw new CommerceError(422, "Payment does not match the saved order.");
  return payment.status === "captured" ? recordCapture(repo, row, payment) : row;
}

async function recordRefund(repo: OrderRepository, row: OrderRow, refund: RazorpayRefund) {
  if (!razorpayId(refund.id, "rfnd") || refund.payment_id !== row.razorpay_payment_id
      || refund.amount !== row.amounts.totalPaise || refund.currency !== "INR"
      || !["pending", "processed", "failed"].includes(refund.status)) return row;
  if (row.payment_state === "refunded") return row;
  if (!["paid", "refund_required", "refund_pending", "refund_failed"].includes(row.payment_state)) return row;
  if (row.razorpay_refund_id && row.razorpay_refund_id !== refund.id
      && !(row.payment_state === "refund_failed" && refund.status === "processed")) return row;
  if (row.payment_state === "refund_failed" && refund.status === "pending") return row;

  const paymentState = refund.status === "processed" ? "refunded" : refund.status === "failed" ? "refund_failed" : "refund_pending";
  if (row.payment_state === paymentState && row.razorpay_refund_id === refund.id) return row;
  const decline = row.status !== "delivered" && row.status !== "declined";
  const updated = await repo.update(row, {
    ...(decline ? {
      ...statusPatch(row, "declined", new Date().toISOString()),
      decline_reason: "The payment was sent for a full refund.",
      eta_at: null,
    } : {}),
    payment_state: paymentState,
    razorpay_refund_id: refund.id,
  });
  if (updated) return updated;
  const latest = await repo.find(row.id);
  if (latest?.razorpay_refund_id === refund.id && (latest.payment_state === paymentState || latest.payment_state === "refunded"))
    return latest;
  throw changes();
}

async function webhook(config: CommerceConfig, repo: OrderRepository, request: Request, raw: Buffer) {
  const credentials = gateway(config);
  if (!matchesSignature(sign(credentials.webhookSecret, raw), request.headers.get("x-razorpay-signature")))
    throw new CommerceError(401, "Invalid webhook signature.");
  const body = parseBody(raw);
  const paymentEvent = body.event === "payment.captured";
  const refundEvent = body.event === "refund.processed" || body.event === "refund.failed";
  if (paymentEvent || refundEvent) {
    const payload = object(body.payload);
    const entity = object(object(payload[paymentEvent ? "payment" : "refund"]).entity);
    if (paymentEvent && razorpayId(entity.order_id, "order")) {
      const row = await repo.find(entity.order_id, "razorpay_order_id");
      if (row) await recordCapture(repo, row, entity as unknown as RazorpayPayment);
    } else if (refundEvent && razorpayId(entity.payment_id, "pay")) {
      const row = await repo.find(entity.payment_id, "razorpay_payment_id");
      if (row) await recordRefund(repo, row, entity as unknown as RazorpayRefund);
    }
  }
  return json({ received: true });
}

async function staffRequest(repo: OrderRepository, config: CommerceConfig, action: string, user: string, body: Record<string, unknown>) {
  if (action === "staff-list") {
    const page = body.page ?? 0;
    const queue = body.queue ?? "active";
    if (typeof page !== "number" || !Number.isInteger(page) || page < 0 || page > 1000
        || (queue !== "active" && queue !== "history" && queue !== "unpaid"))
      throw new CommerceError(400, "Invalid kitchen queue.");
    const [listing, acceptingOrders] = await Promise.all([repo.list(page, queue), repo.acceptingOrders()]);
    return json({ ...listing, acceptingOrders, mode: config.mode });
  }
  if (action === "staff-kitchen") {
    if (typeof body.open !== "boolean") throw new CommerceError(400, "Choose whether the kitchen is open.");
    await repo.setKitchenOpen(body.open, user);
    return json({ acceptingOrders: body.open });
  }
  if (action !== "staff-update") throw new CommerceError(404, "Unknown order operation.");
  const row = await repo.find(orderId(body.id));
  if (!row) throw new CommerceError(404, "Order not found.");
  if (row.revision !== body.revision) throw changes();
  if (body.action === "refund") {
    if (row.status !== "declined" || row.payment_state !== "refund_required"
      || !razorpayId(row.razorpay_payment_id, "pay"))
      throw changes();
    const receipt = `refund-${row.id.replaceAll("-", "")}`;
    const refund = await razorpayRequest<RazorpayRefund>(
      gateway(config), `/payments/${row.razorpay_payment_id}/refund`,
      { amount: row.amounts.totalPaise, receipt }, receipt,
    );
    const saved = await recordRefund(repo, row, refund);
    if (saved.payment_state === "refund_required") throw new CommerceError(502, "Razorpay returned an unexpected refund.");
    return json({ order: staffView(saved) });
  }
  const saved = await repo.update(row, staffTransition(row, body, user));
  if (!saved) throw changes();
  return json({ order: staffView(saved) });
}

export async function handleCommerce(
  request: Request,
  env: CommerceEnv = process.env,
  repository = createOrderRepository,
  allowPreview = false,
): Promise<Response> {
  try {
    const action = new URL(request.url).searchParams.get("action") ?? "config";
    const config = loadCommerceConfig(env);
    if (!config) {
      if (allowPreview && request.method === "GET" && action === "config")
        return json({ mode: "preview" });
      throw new CommerceError(503, "Online ordering is currently unavailable.");
    }
    if (request.method === "GET" && action === "config") {
      return json({
        mode: config.mode,
        acceptingOrders: await repository(config).acceptingOrders(),
        pricing: config.pricing,
        methods: config.methods,
        ...(config.deliveryRadius && { deliveryArea: {
          postalCodes: [...config.deliveryPins],
          radiusMetres: config.deliveryRadius.metres,
        } }),
      });
    }
    if (request.method !== "POST") throw new CommerceError(405, "Method not allowed.");
    if (action !== "webhook" && request.headers.get("origin") !== config.origin)
      throw new CommerceError(403, "Request origin is not allowed.");
    const repo = repository(config);
    const raw = await rawBody(request);
    if (action === "webhook") return await webhook(config, repo, request, raw);
    const body = parseBody(raw);
    if (action === "create") return json(await createOrder(config, repo, body), 201);
    if (action.startsWith("staff-"))
      return await staffRequest(repo, config, action, await repo.staffUser(request.headers.get("authorization")), body);
    if (action === "track" || action === "payment" || action === "verify") {
      const row = await privateOrder(config, repo, body);
      if (action === "payment") return json(await preparePayment(config, repo, row));
      const updated = action === "verify" ? await verifyPayment(config, repo, row, body) : row;
      return json({ order: customerView(updated) });
    }
    throw new CommerceError(404, "Unknown order operation.");
  } catch (error) {
    if (error instanceof CommerceError) return json({ error: error.message }, error.status);
    // Keep order, payment and credential data out of generic exception logs.
    console.error("[commerce] Unexpected order service error", error instanceof Error ? error.name : "unknown");
    return json({ error: "The order service is temporarily unavailable." }, 503);
  }
}
