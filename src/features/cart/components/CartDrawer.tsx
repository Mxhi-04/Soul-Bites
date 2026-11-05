import React from "react";
import { useCart } from "../hooks/useCart";
import { Modal } from "../../../components/ui/Modal/Modal";
import { APP_CONFIG } from "../../../constants/config";
import { MAX_ITEM_QUANTITY } from "../services/cartService";
import { Button } from "../../../components/ui/Button/Button";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./CartDrawer.module.css";

export interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
}) => {
  const { items, pricing, isCartOpen, closeCart, updateQuantity } = useCart();

  return (
    <Modal
      isOpen={isCartOpen}
      onClose={closeCart}
      title={`Your Order (${pricing.itemCount})`}
      variant="drawer"
      closeLabel="Close cart"
    >
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🥡</span>
          <h4>Your cart is empty</h4>
          <p>Add some soulful chef-crafted meals from our kitchen menu.</p>
          <Button variant="outline" size="sm" onClick={closeCart}>
            Browse Menu
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.itemList}>
            {items.map(({ item, quantity }) => (
              <div key={item.id} className={styles.cartItem}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={styles.itemImage}
                />
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemPrice}>
                    {formatCurrency(item.price * quantity)}
                  </div>

                  <div className={styles.quantityControls}>
                    <button
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      -
                    </button>
                    <span className={styles.qtyDisplay}>{quantity}</span>
                    <button
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      disabled={quantity >= MAX_ITEM_QUANTITY}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className={styles.priceRow}>
              <span>Delivery Fee</span>
              <span>
                {pricing.deliveryFee === 0
                  ? "FREE"
                  : formatCurrency(pricing.deliveryFee)}
              </span>
            </div>
            <div className={styles.priceRow}>
              <span>Estimated Tax</span>
              <span>{formatCurrency(pricing.tax)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <span className={styles.totalValue}>
                {formatCurrency(pricing.total)}
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={
                pricing.subtotal < APP_CONFIG.delivery.minimumOrderAmount
              }
              onClick={() => {
                closeCart();
                onProceedToCheckout();
              }}
            >
              Review Order • {formatCurrency(pricing.total)}
            </Button>
            {pricing.subtotal < APP_CONFIG.delivery.minimumOrderAmount && (
              <p role="status">
                Add{" "}
                {formatCurrency(
                  APP_CONFIG.delivery.minimumOrderAmount - pricing.subtotal,
                )}{" "}
                more to reach the{" "}
                {formatCurrency(APP_CONFIG.delivery.minimumOrderAmount)} minimum
                before fees.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};
