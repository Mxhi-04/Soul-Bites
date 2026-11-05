import { DeliveryDetails, CheckoutFormErrors } from "../types/checkoutTypes";

export function normalizePhone(phone: string): string {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  return compact.startsWith("+91") ? compact.slice(3) : compact;
}

export function validateCheckoutForm(details: DeliveryDetails) {
  const errors: CheckoutFormErrors = {};
  if (
    details.fullName.trim().length < 2 ||
    details.fullName.trim().length > 100
  )
    errors.fullName = "Enter a name between 2 and 100 characters.";
  if (!/^[6-9]\d{9}$/.test(normalizePhone(details.phone)))
    errors.phone =
      "Enter a valid 10-digit Indian mobile number, optionally with +91.";
  if (details.address.trim().length < 5 || details.address.length > 200)
    errors.address = "Enter a street address between 5 and 200 characters.";
  if (details.city.trim().length < 2 || details.city.length > 100)
    errors.city = "Enter a city between 2 and 100 characters.";
  if (!/^[1-9]\d{5}$/.test(details.postalCode.trim()))
    errors.postalCode = "Enter a valid 6-digit PIN code.";
  if (details.unitApt.length > 100)
    errors.unitApt = "Keep apartment details under 100 characters.";
  if (details.deliveryNotes.length > 300)
    errors.deliveryNotes = "Keep delivery instructions under 300 characters.";
  return { isValid: Object.keys(errors).length === 0, errors };
}
