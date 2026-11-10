import type { OrderingMode, PaymentMethod, PricingRules } from "../../src/features/orders/types/orderTypes.ts";

export type CommerceEnv = Record<string, string | undefined>;

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryRadius {
  kitchen: Coordinates;
  metres: number;
  geocodingKey: string;
}

export interface CommerceConfig {
  mode: OrderingMode;
  origin: string;
  supabaseUrl: string;
  supabaseKey: string;
  accessSecret: string;
  deliveryPins: Set<string>;
  deliveryRadius: DeliveryRadius | null;
  pricing: PricingRules;
  methods: PaymentMethod[];
  razorpay: RazorpayConfig | null;
}

export class CommerceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function loadCommerceConfig(env: CommerceEnv): CommerceConfig | null {
  const mode = env.COMMERCE_MODE;
  if (!mode || mode === "preview") return null;

  const invalid = () => new CommerceError(503, "Online ordering is not configured.");
  if (mode !== "test" && mode !== "live") throw invalid();

  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value) throw invalid();
    return value;
  };
  const integer = (key: string, min: number, max: number) => {
    const value = required(key);
    const amount = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(amount) || amount < min || amount > max)
      throw invalid();
    return amount;
  };

  const origin = required("COMMERCE_ORIGIN");
  try {
    const url = new URL(origin);
    if (url.origin !== origin || (url.protocol !== "https:" && (
      mode === "live" || url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)
    ))) throw invalid();
  } catch {
    throw invalid();
  }

  const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) throw invalid();
  const supabaseKey = required("SUPABASE_SECRET_KEY");
  if (!supabaseKey.startsWith("sb_secret_") && !supabaseKey.startsWith("eyJ")) throw invalid();
  const accessSecret = required("COMMERCE_ACCESS_SECRET");
  if (accessSecret.length < 32) throw invalid();

  const configuredPins = env.COMMERCE_DELIVERY_PINS?.trim();
  const deliveryPins = new Set(configuredPins ? configuredPins.split(",").map((pin) => pin.trim()) : []);
  if ([...deliveryPins].some((pin) => !/^[1-9]\d{5}$/.test(pin))) throw invalid();

  const coordinate = (key: string, max: number) => {
    const value = required(key);
    const number = Number(value);
    if (!/^-?\d+(\.\d+)?$/.test(value) || Math.abs(number) > max) throw invalid();
    return number;
  };
  const radiusKeys = [
    "COMMERCE_KITCHEN_LATITUDE", "COMMERCE_KITCHEN_LONGITUDE",
    "COMMERCE_DELIVERY_RADIUS_METRES", "GOOGLE_GEOCODING_API_KEY",
  ];
  const deliveryRadius = mode === "live" || radiusKeys.some((key) => env[key]?.trim()) ? {
    kitchen: {
      latitude: coordinate("COMMERCE_KITCHEN_LATITUDE", 90),
      longitude: coordinate("COMMERCE_KITCHEN_LONGITUDE", 180),
    },
    metres: integer("COMMERCE_DELIVERY_RADIUS_METRES", 1, 100_000),
    geocodingKey: required("GOOGLE_GEOCODING_API_KEY"),
  } : null;
  if (!deliveryRadius && !deliveryPins.size) throw invalid();

  const pricing = {
    minimumPaise: integer("COMMERCE_MINIMUM_PAISE", 100, 10_000_000),
    deliveryPaise: integer("COMMERCE_DELIVERY_PAISE", 0, 1_000_000),
    freeDeliveryPaise: integer("COMMERCE_FREE_DELIVERY_PAISE", 0, 10_000_000),
    taxBps: integer("COMMERCE_TAX_BPS", 0, 10_000),
  };

  const methods: PaymentMethod[] = [];
  if (env.COMMERCE_COD_ENABLED === "true") methods.push("cod");
  const razorpay = env.COMMERCE_RAZORPAY_ENABLED === "true" ? {
    keyId: required("RAZORPAY_KEY_ID"),
    keySecret: required("RAZORPAY_KEY_SECRET"),
    webhookSecret: required("RAZORPAY_WEBHOOK_SECRET"),
  } : null;
  if (razorpay) {
    if (!razorpay.keyId.startsWith(`rzp_${mode}_`) || razorpay.webhookSecret.length < 16)
      throw invalid();
    methods.push("razorpay");
  }
  if (!methods.length) throw invalid();

  return { mode, origin, supabaseUrl, supabaseKey, accessSecret, deliveryPins, deliveryRadius, pricing, methods, razorpay };
}
