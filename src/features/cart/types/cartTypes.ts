import { MenuItem } from "../../menu/types/menuTypes";

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface CartPricingSummary {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface CartContextValue {
  items: CartItem[];
  pricing: CartPricingSummary;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  completeCheckout: (snapshot: CartItem[]) => Promise<void>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}
