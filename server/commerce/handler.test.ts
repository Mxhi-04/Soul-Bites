import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommerceError, loadCommerceConfig, type CommerceEnv } from "./config.ts";
import { distanceMetres } from "./deliveryArea.ts";
import { handleCommerce } from "./handler.ts";
import { sign } from "./razorpay.ts";
import { staffView, type OrderRepository, type OrderRow } from "./repository.ts";
import type { CustomerOrder, OrderResponse, StaffOrder } from "../../src/features/orders/types/orderTypes.ts";

const origin = "https://test.soul-bites.example";
const env = {
  COMMERCE_MODE: "test",
  COMMERCE_ORIGIN: origin,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_fixture",
  COMMERCE_ACCESS_SECRET: "checkout-test-secret-more-than-32-bytes",
  COMMERCE_DELIVERY_PINS: "411001",
  COMMERCE_MINIMUM_PAISE: "14900",
  COMMERCE_DELIVERY_PAISE: "3500",
  COMMERCE_FREE_DELIVERY_PAISE: "49900",
  COMMERCE_TAX_BPS: "500",
  COMMERCE_COD_ENABLED: "true",
  COMMERCE_RAZORPAY_ENABLED: "true",
  RAZORPAY_KEY_ID: "rzp_test_fixture",
  RAZORPAY_KEY_SECRET: "provider-secret",
  RAZORPAY_WEBHOOK_SECRET: "webhook-test-secret",
};
const details = {
  fullName: "Sample Guest",
  phone: "+91 9876543210",
  address: "12 Sample Lane",
  unitApt: "",
  city: "Pune",
  postalCode: "411001",
  deliveryNotes: "",
};
const staff = "Bearer kitchen-test";
const providerOrderId = "order_Example123";
const paymentId = "pay_Example123";
const radiusEnv = {
  ...env,
  COMMERCE_DELIVERY_PINS: "302026",
  COMMERCE_DELIVERY_RADIUS_METRES: "5000",
  COMMERCE_KITCHEN_LATITUDE: "26.85",
  COMMERCE_KITCHEN_LONGITUDE: "75.69",
  GOOGLE_GEOCODING_API_KEY: "geocoding-fixture",
};
const jaipurDetails = { ...details, city: "Jaipur", postalCode: "302026" };
const geocodedAddress = {
  types: ["street_address"],
  address_components: [
    { types: ["country"], short_name: "IN" },
    { types: ["postal_code"], short_name: "302026" },
  ],
  geometry: { location_type: "ROOFTOP", location: { lat: 26.87, lng: 75.69 } },
};

function fixture() {
  const rows = new Map<string, OrderRow>();
  const keys = new Map<string, { id: string; hash: string }>();
  let accepting = true;
  const authorizeDeliveryLookup = vi.fn(async () => {
    if (!accepting) throw new CommerceError(409, "The kitchen is paused.");
  });
  const repo: OrderRepository = {
    acceptingOrders: async () => accepting,
    authorizeDeliveryLookup,
    setKitchenOpen: async (open) => { accepting = open; },
    staffUser: async (header) => {
      if (header !== staff) throw new CommerceError(header ? 403 : 401, "Staff access required.");
      return "staff-user";
    },
    reserve: async (order) => {
      const existing = keys.get(order.key);
      if (existing) {
        if (existing.hash !== order.hash) throw new CommerceError(409, "Different order.");
        return rows.get(existing.id)!;
      }
      if (!accepting) throw new CommerceError(409, "The kitchen is paused.");
      const id = randomUUID();
      const created = new Date().toISOString();
      const status = order.method === "cod" ? "pending" : "unpaid";
      const row: OrderRow = {
        id, mode: "test", status, payment_method: order.method,
        payment_state: order.method === "cod" ? "cash_due" : "awaiting_payment",
        lines: order.lines, amounts: order.amounts, delivery_details: order.details,
        events: [{ status, at: created }], created_at: created, revision: 0,
        prep_minutes: null, delivery_minutes: null, eta_at: null, decline_reason: null,
        razorpay_order_id: null, razorpay_payment_id: null, razorpay_refund_id: null,
        gateway_started_at: null, last_staff_user: null,
      };
      rows.set(id, row);
      keys.set(order.key, { id, hash: order.hash });
      return row;
    },
    findReservation: async (key) => {
      const match = keys.get(key);
      return match ? { ...rows.get(match.id)!, request_hash: match.hash } : null;
    },
    find: async (value, field = "id") => [...rows.values()].find((row) => row[field] === value) ?? null,
    list: async () => ({ orders: [...rows.values()].map(staffView), hasMore: false }),
    update: async (row, patch) => {
      if (rows.get(row.id)?.revision !== row.revision) return null;
      const saved = { ...row, ...patch, revision: row.revision + 1 };
      rows.set(row.id, saved);
      return saved;
    },
  };
  const call = (action: string, body: object | string, headers?: HeadersInit, config: CommerceEnv = env) =>
    handleCommerce(new Request(`${origin}/api/commerce?action=${action}`, {
      method: "POST",
      headers: { origin, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }), config, () => repo);
  const draft = {
    requestKey: randomUUID(), paymentMethod: "cod", expectedTotalPaise: 31_745,
    details, items: [{ itemId: "sb-pizza-01", quantity: 1 }],
  };
  return { rows, call, draft, authorizeDeliveryLookup };
}

afterEach(() => vi.unstubAllGlobals());

describe("commerce API", () => {
  it("only exposes sample checkout on the local server and refuses live checkout with test keys", async () => {
    const request = new Request(`${origin}/api/commerce?action=config`);
    expect((await handleCommerce(request, {})).status).toBe(503);
    expect((await handleCommerce(request, { COMMERCE_MODE: "preview" })).status).toBe(503);
    expect(await (await handleCommerce(request, {}, undefined, true)).json()).toEqual({ mode: "preview" });
    expect((await handleCommerce(request, { ...env, COMMERCE_MODE: "live" })).status).toBe(503);
  });

  it("requires verified radius configuration for live ordering, including COD-only", () => {
    const liveEnv = {
      ...radiusEnv, COMMERCE_MODE: "live", COMMERCE_ORIGIN: "https://soulbites.in",
      COMMERCE_RAZORPAY_ENABLED: "false", COMMERCE_DELIVERY_PINS: "",
    };
    expect(loadCommerceConfig(liveEnv)).toMatchObject({ methods: ["cod"], deliveryRadius: { metres: 5000 } });
    for (const key of ["COMMERCE_KITCHEN_LATITUDE", "COMMERCE_KITCHEN_LONGITUDE", "COMMERCE_DELIVERY_RADIUS_METRES", "GOOGLE_GEOCODING_API_KEY"]) {
      expect(() => loadCommerceConfig({ ...liveEnv, [key]: "" })).toThrow(CommerceError);
    }
    expect(() => loadCommerceConfig({ ...liveEnv, COMMERCE_KITCHEN_LATITUDE: "91" })).toThrow(CommerceError);
    expect(() => loadCommerceConfig({ ...liveEnv, COMMERCE_KITCHEN_LONGITUDE: "-181" })).toThrow(CommerceError);
    expect(() => loadCommerceConfig({ ...liveEnv, COMMERCE_RAZORPAY_ENABLED: "true" })).toThrow(CommerceError);
    expect(() => loadCommerceConfig({ ...env, COMMERCE_DELIVERY_PINS: "" })).toThrow(CommerceError);
  });

  it("accepts nearby addresses with a verified neighboring PIN when the radius is the delivery rule", async () => {
    const { call, draft, rows } = fixture();
    const postalCode = "302034";
    const geocode = vi.fn(async (url: URL) => {
      expect(url.searchParams.get("components")).toBe(`country:IN|postal_code:${postalCode}`);
      return Response.json({ status: "OK", results: [{
        ...geocodedAddress,
        address_components: [
          { types: ["country"], short_name: "IN" },
          { types: ["postal_code"], short_name: postalCode },
        ],
      }] });
    });
    vi.stubGlobal("fetch", geocode);
    const response = await call("create", {
      ...draft, details: { ...jaipurDetails, postalCode },
    }, {}, { ...radiusEnv, COMMERCE_DELIVERY_PINS: "" });
    expect(response.status).toBe(201);
    expect(rows.size).toBe(1);
  });

  it("checks the PIN and rate limit before sending only the street, city and PIN to the geocoder", async () => {
    const { call, draft, rows, authorizeDeliveryLookup } = fixture();
    const geocode = vi.fn(async (url: URL) => {
      expect(url.origin).toBe("https://maps.googleapis.com");
      expect(url.searchParams.get("components")).toBe("country:IN|postal_code:302026");
      expect(url.searchParams.get("address")).toBe("12 Sample Lane, Jaipur");
      return Response.json({ status: "OK", results: [geocodedAddress] });
    });
    vi.stubGlobal("fetch", geocode);
    expect((await call("create", draft, {}, radiusEnv)).status).toBe(422);
    expect(authorizeDeliveryLookup).not.toHaveBeenCalled();

    const localDraft = { ...draft, details: { ...jaipurDetails, unitApt: "Apartment 8", deliveryNotes: "Call at gate" } };
    authorizeDeliveryLookup.mockRejectedValueOnce(new CommerceError(429, "Too many delivery checks."));
    expect((await call("create", localDraft, {}, radiusEnv)).status).toBe(429);
    expect(geocode).not.toHaveBeenCalled();
    const created = await call("create", localDraft, {}, radiusEnv);
    expect(created.status).toBe(201);
    expect(await (await call("create", localDraft, {}, radiusEnv)).json()).toEqual(await created.json());
    expect(geocode).toHaveBeenCalledTimes(1);
    expect(rows.size).toBe(1);
  });

  it("blocks outside, partial, broad, ambiguous and mismatched PIN results before payment or order creation", async () => {
    const { call, draft, rows } = fixture();
    const outside = { ...geocodedAddress, geometry: { ...geocodedAddress.geometry, location: { lat: 26.90, lng: 75.69 } } };
    const matches = [
      [outside],
      [{ ...geocodedAddress, partial_match: true }],
      [{ ...geocodedAddress, geometry: { ...geocodedAddress.geometry, location_type: "APPROXIMATE" } }],
      [{ ...geocodedAddress, types: ["locality"] }],
      [{ ...geocodedAddress, address_components: [{ types: ["country"], short_name: "IN" }, { types: ["postal_code"], short_name: "302025" }] }],
      [geocodedAddress, outside],
    ];
    const create = () => call("create", { ...draft, paymentMethod: "razorpay", details: jaipurDetails }, {}, radiusEnv);
    const geocode = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", geocode);
    for (const results of matches) {
      geocode.mockResolvedValueOnce(Response.json({ status: "OK", results }));
      expect((await create()).status).toBe(422);
    }
    geocode.mockResolvedValueOnce(Response.json({ status: "ZERO_RESULTS", results: [] }));
    expect((await create()).status).toBe(422);
    geocode.mockResolvedValueOnce(Response.json({ status: "OVER_DAILY_LIMIT", results: [] }));
    expect((await create()).status).toBe(503);
    geocode.mockRejectedValueOnce(new Error("provider timeout"));
    expect((await create()).status).toBe(503);
    expect(rows.size).toBe(0);
  });

  it("applies a strict 5 km straight-line boundary", async () => {
    const { call, draft } = fixture();
    const point = (metres: number) => ({ latitude: metres / 6_371_008.8 * (180 / Math.PI), longitude: 0 });
    const kitchen = point(0);
    expect(distanceMetres(kitchen, point(5_000))).toBeCloseTo(5_000, 8);
    const geocode = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", geocode);
    for (const [metres, status] of [[5001, 422], [5000, 422], [4999, 201]]) {
      geocode.mockResolvedValueOnce(Response.json({
        status: "OK",
        results: [{ ...geocodedAddress, geometry: { location_type: "ROOFTOP", location: { lat: point(metres).latitude, lng: 0 } } }],
      }));
      expect((await call("create", { ...draft, details: jaipurDetails }, {}, {
        ...radiusEnv, COMMERCE_KITCHEN_LATITUDE: "0", COMMERCE_KITCHEN_LONGITUDE: "0",
      })).status).toBe(status);
    }
  });

  it("enforces delivery, canonical price, request origin, private tracking and COD idempotency", async () => {
    const { call, draft, rows } = fixture();
    expect((await call("create", draft, { origin: "https://wrong.example" })).status).toBe(403);
    expect((await call("create", { ...draft, details: { ...details, postalCode: "110001" } })).status).toBe(422);
    expect((await call("create", { ...draft, expectedTotalPaise: 100 })).status).toBe(409);
    const initial = await call("create", { ...draft, items: [{ ...draft.items[0], price: 1 }] });
    expect(initial.status).toBe(201);
    const created = await initial.json() as OrderResponse;
    expect(created.order).toMatchObject({ status: "pending", paymentState: "cash_due", amounts: { totalPaise: 31745 } });
    expect(await (await call("create", draft)).json()).toEqual(created);
    expect(rows.size).toBe(1);
    expect(await (await call("create", draft, {}, { ...env, COMMERCE_DELIVERY_PINS: "411002", COMMERCE_TAX_BPS: "0" })).json()).toEqual(created);
    expect((await call("create", { ...draft, details: { ...details, address: "99 Other Road" } })).status).toBe(409);
    expect((await call("track", { id: created.order.id })).status).toBe(404);
    const tracking = await (await call("track", created.access)).json();
    expect(tracking.order).not.toHaveProperty("details");
    expect(tracking.order).not.toHaveProperty("request_key");
  });

  it("allows only staff to advance orders and requires COD collection", async () => {
    const { call, draft } = fixture();
    const { order } = await (await call("create", draft)).json() as OrderResponse;
    expect((await call("staff-list", {}, { authorization: "Bearer customer" })).status).toBe(403);
    const staffHeaders = { authorization: staff };
    const update = (revision: number, action: string, extra = {}) =>
      call("staff-update", { id: order.id, revision, action, ...extra }, staffHeaders);
    expect((await update(0, "deliver")).status).toBe(409);
    const accepted = (await (await update(0, "accept", { prepMinutes: 20, deliveryMinutes: 15 })).json()).order as StaffOrder;
    expect(accepted).toMatchObject({ status: "accepted", prepMinutes: 20, deliveryMinutes: 15 });
    expect(Date.parse(accepted.etaAt!) - Date.parse(accepted.events[1].at)).toBe(35 * 60_000);
    expect((await update(0, "prepare")).status).toBe(409);
    expect((await update(1, "prepare")).status).toBe(200);
    expect((await update(2, "ready")).status).toBe(200);
    expect((await update(3, "dispatch")).status).toBe(200);
    expect((await update(4, "deliver")).status).toBe(400);
    expect((await (await update(4, "deliver", { cashCollected: true })).json()).order.paymentState).toBe("cash_collected");
    await call("staff-kitchen", { open: false }, staffHeaders);
    expect((await call("create", { ...draft, requestKey: randomUUID() })).status).toBe(409);
  });

  it("recovers a Razorpay order by receipt after the create response is lost", async () => {
    const { call, draft } = fixture();
    const created = await (await call("create", { ...draft, paymentMethod: "razorpay" })).json() as OrderResponse;
    const razorpay = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") throw new Error("connection lost");
      if (url.includes("?receipt=")) {
        return Response.json({ items: [{ id: providerOrderId, receipt: created.order.id, amount: 31745, currency: "INR" }] });
      }
      return Response.json({ items: [] });
    });
    vi.stubGlobal("fetch", razorpay);
    expect((await call("payment", created.access)).status).toBe(502);
    const recovered = await (await call("payment", created.access)).json() as OrderResponse;
    expect(recovered.checkout?.providerOrderId).toBe(providerOrderId);
    expect(razorpay.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });

  it("binds Razorpay capture to the stored order and applies duplicate webhooks once", async () => {
    const { call, draft, rows } = fixture();
    const created = await (await call("create", { ...draft, paymentMethod: "razorpay" })).json() as OrderResponse;
    expect(created.order.status).toBe("unpaid");
    const razorpay = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/orders") && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toMatchObject({ amount: 31745, receipt: created.order.id });
        return Response.json({ id: providerOrderId, receipt: created.order.id, amount: 31745, currency: "INR" });
      }
      if (url.endsWith("/payments")) return Response.json({ items: [] });
      return Response.json({ id: paymentId, order_id: providerOrderId, amount: 31745, currency: "INR", status: "authorized" });
    });
    vi.stubGlobal("fetch", razorpay);
    const online = await (await call("payment", created.access)).json() as OrderResponse;
    expect(online.checkout?.providerOrderId).toBe(providerOrderId);
    await call("payment", created.access);
    expect(razorpay.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);

    const confirmation = {
      ...created.access, razorpay_order_id: providerOrderId, razorpay_payment_id: paymentId,
      razorpay_signature: sign(env.RAZORPAY_KEY_SECRET, `${providerOrderId}|${paymentId}`),
    };
    expect((await call("verify", { ...confirmation, razorpay_signature: "0".repeat(64) })).status).toBe(400);
    expect((await (await call("verify", confirmation)).json()).order.status).toBe("unpaid");

    const capture = (amount: number) => JSON.stringify({
      event: "payment.captured", payload: { payment: { entity: {
        id: paymentId, order_id: providerOrderId, currency: "INR", amount, status: "captured",
      } } },
    }, null, 2);
    const signed = (raw: string) => ({ "x-razorpay-signature": sign(env.RAZORPAY_WEBHOOK_SECRET, raw) });
    expect((await call("webhook", capture(31745).trim().replace("\n", ""), signed(capture(31745)))).status).toBe(401);
    expect((await call("webhook", capture(100), signed(capture(100)))).status).toBe(422);
    expect((await call("webhook", capture(31745), signed(capture(31745)))).status).toBe(200);
    expect((await call("webhook", capture(31745), signed(capture(31745)))).status).toBe(200);
    expect(rows.get(created.order.id)?.events.map((entry) => entry.status)).toEqual(["unpaid", "pending"]);

    const row = rows.get(created.order.id)!;
    const decline = await call("staff-update", {
      id: row.id, revision: row.revision, action: "decline", reason: "Kitchen is at capacity.",
    }, { authorization: staff });
    expect((await decline.json()).order.paymentState).toBe("refund_required");
    const refund = JSON.stringify({ event: "refund.processed", payload: { refund: { entity: {
      id: "rfnd_Example123", payment_id: paymentId, status: "processed", amount: 31745, currency: "INR",
    } } } });
    expect((await call("webhook", refund, signed(refund))).status).toBe(200);
    const tracked = (await (await call("track", created.access)).json()).order as CustomerOrder;
    expect(tracked).toMatchObject({ status: "declined", paymentState: "refunded" });
  });
});
