export type PaymentMethod = 'card' | 'apple-pay' | 'cash-on-delivery';

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  unitApt?: string;
  city: string;
  postalCode: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
}

export interface CheckoutFormErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface PlacedOrder {
  orderId: string;
  itemsCount: number;
  total: number;
  deliveryAddress: string;
  estimatedArrivalMinutes: number;
  placedAt: string;
}
