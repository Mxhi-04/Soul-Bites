import { DeliveryDetails, CheckoutFormErrors } from '../types/checkoutTypes';

export function validateCheckoutForm(details: DeliveryDetails): {
  isValid: boolean;
  errors: CheckoutFormErrors;
} {
  const errors: CheckoutFormErrors = {};

  if (!details.fullName || details.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const phoneDigits = details.phone.replace(/\D/g, '');
  if (!details.phone || phoneDigits.length < 10) {
    errors.phone = 'Please enter a valid 10-digit phone number for delivery updates.';
  }

  if (!details.address || details.address.trim().length < 5) {
    errors.address = 'Street address is required for delivery.';
  }

  if (!details.city || details.city.trim().length < 2) {
    errors.city = 'City is required.';
  }

  if (!details.postalCode || details.postalCode.trim().length < 4) {
    errors.postalCode = 'Valid postal / zip code is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
