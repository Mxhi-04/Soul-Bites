import { createContext } from "react";
import { CartContextValue } from "../types/cartTypes";
export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);
