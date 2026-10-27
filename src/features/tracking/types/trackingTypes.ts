export type OrderStatusStep = 'received' | 'preparing' | 'dispatched' | 'delivered';

export interface OrderProgressStep {
  step: OrderStatusStep;
  label: string;
  description: string;
  icon: string;
}

export interface OrderTrackingState {
  orderId: string;
  currentStep: OrderStatusStep;
  estimatedArrivalMinutes: number;
  deliveryAddress: string;
  placedAt: string;
}
