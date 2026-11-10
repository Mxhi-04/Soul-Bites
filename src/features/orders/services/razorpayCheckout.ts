import type { GatewayCheckout } from "../types/orderTypes";

export interface RazorpayConfirmation {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  handler: (confirmation: RazorpayConfirmation) => void;
  modal: { ondismiss: () => void };
}

type CheckoutConstructor = new (options: RazorpayOptions) => { open(): void };

let loading: Promise<CheckoutConstructor> | undefined;

function loadCheckout() {
  const site = window as Window & { Razorpay?: CheckoutConstructor };
  if (site.Razorpay) return Promise.resolve(site.Razorpay);

  loading ??= new Promise<CheckoutConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    const failed = () => {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error("Razorpay checkout could not load. Try again."));
    };
    const timer = window.setTimeout(failed, 10_000);
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onerror = failed;
    script.onload = () => {
      window.clearTimeout(timer);
      if (site.Razorpay) resolve(site.Razorpay);
      else failed();
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });

  return loading;
}

export async function openRazorpay(checkout: GatewayCheckout) {
  const Razorpay = await loadCheckout();
  return new Promise<RazorpayConfirmation | null>((resolve) => {
    new Razorpay({
      key: checkout.keyId,
      order_id: checkout.providerOrderId,
      amount: checkout.amount,
      currency: "INR",
      name: "Soul Bites",
      description: "Vegetarian kitchen order",
      handler: resolve,
      modal: { ondismiss: () => resolve(null) },
    }).open();
  });
}
