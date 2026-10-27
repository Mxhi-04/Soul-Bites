import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MenuItem } from '../../menu/types/menuTypes';
import { CartItem, CartPricingSummary, CartContextValue } from '../types/cartTypes';
import { APP_CONFIG } from '../../../constants/config';
import { storage } from '../../../utils/storage';

const CART_STORAGE_KEY = 'soul_bites_cart';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    return storage.get<CartItem[]>(CART_STORAGE_KEY, []);
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    storage.set(CART_STORAGE_KEY, items);
  }, [items]);

  const addItem = (item: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const pricing = useMemo<CartPricingSummary>(() => {
    const subtotal = items.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
    const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

    const deliveryFee =
      subtotal >= APP_CONFIG.delivery.freeDeliveryThreshold || subtotal === 0
        ? 0
        : APP_CONFIG.delivery.deliveryFee;

    const tax = subtotal * (APP_CONFIG.delivery.taxRatePercentage / 100);
    const discount = 0;
    const total = subtotal + deliveryFee + tax - discount;

    return {
      subtotal,
      deliveryFee,
      tax,
      discount,
      total,
      itemCount,
    };
  }, [items]);

  const value: CartContextValue = {
    items,
    pricing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
