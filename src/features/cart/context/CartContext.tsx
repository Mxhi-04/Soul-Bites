import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MenuItem } from "../../menu/types/menuTypes";
import { CartItem } from "../types/cartTypes";
import { storage } from "../../../utils/storage";
import { CartContext } from "./cartState";
import {
  calculatePricing,
  CART_STORAGE_KEY,
  hydrateCart,
  MAX_ITEM_QUANTITY,
  serializeCart,
} from "../services/cartService";

export const CartProvider: React.FC<{
  children: React.ReactNode;
  storageKey?: string;
}> = ({ children, storageKey = CART_STORAGE_KEY }) => {
  const [items, setItems] = useState<CartItem[]>(() =>
    hydrateCart(storage.get<unknown>(storageKey, [])),
  );
  const currentItems = useRef(items);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const mutate = useCallback(
    (update: (current: CartItem[]) => CartItem[]) => {
      const commit = () => {
        const current = hydrateCart(
          storage.get<unknown>(storageKey, serializeCart(currentItems.current)),
        );
        const next = update(current);
        storage.set(storageKey, serializeCart(next));
        currentItems.current = next;
        setItems(next);
      };
      // Serialize mutations across tabs; incoming storage events never echo a write.
      if (navigator.locks)
        void navigator.locks.request(storageKey, commit).catch(commit);
      else commit();
    },
    [storageKey],
  );

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (
        event.storageArea !== localStorage ||
        (event.key !== storageKey && event.key !== null)
      )
        return;
      const next = hydrateCart(storage.get<unknown>(storageKey, []));
      currentItems.current = next;
      setItems(next);
    };
    window.addEventListener("storage", sync);
    mutate((current) => current); // Validate and migrate storage once, under the same lock.
    return () => window.removeEventListener("storage", sync);
  }, [mutate, storageKey]);

  const addItem = (item: MenuItem) =>
    mutate((current) =>
      hydrateCart([...current, { item: { id: item.id }, quantity: 1 }]),
    );
  const removeItem = (id: string) =>
    mutate((current) => current.filter(({ item }) => item.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    if (!Number.isSafeInteger(delta)) return;
    mutate((current) =>
      hydrateCart(
        current.map((row) =>
          row.item.id === id
            ? {
                ...row,
                quantity: Math.min(MAX_ITEM_QUANTITY, row.quantity + delta),
              }
            : row,
        ),
      ),
    );
  };
  const completeCheckout = (snapshot: CartItem[]) =>
    mutate((current) =>
      hydrateCart(
        current.map((row) => ({
          ...row,
          quantity:
            row.quantity -
            (snapshot.find((purchased) => purchased.item.id === row.item.id)
              ?.quantity ?? 0),
        })),
      ),
    );
  const pricing = useMemo(() => calculatePricing(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        pricing,
        addItem,
        removeItem,
        updateQuantity,
        completeCheckout,
        clearCart: () => mutate(() => []),
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
