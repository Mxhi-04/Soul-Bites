import React from "react";
import { useCart } from "../hooks/useCart";
import { Modal } from "../../../components/ui/Modal/Modal";
import { APP_CONFIG } from "../../../constants/config";
import { MAX_ITEM_QUANTITY } from "../services/cartService";
import { Button } from "../../../components/ui/Button/Button";
import { orderLines, priceOrder } from "../../orders/services/orderPricing";
import type { CommerceAvailability } from "../../orders/types/orderTypes";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./CartDrawer.module.css";

export interface CartDrawerProps {
  onProceedToCheckout: () => void;
  commerce: CommerceAvailability | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  commerce,
}) => {
  const { items, pricing, isCartOpen, closeCart, updateQuantity } = useCart();

  const live = commerce && commerce.mode !== "preview" ? commerce : null;
  const amounts = live ? priceOrder(orderLines(items), live.pricing) : null;
  const fee = amounts ? amounts.deliveryPaise / 100 : pricing.deliveryFee;
  const tax = amounts ? amounts.taxPaise / 100 : pricing.tax;
  const total = amounts ? amounts.totalPaise / 100 : pricing.total;
  const minimum = live ? live.pricing.minimumPaise / 100 : APP_CONFIG.delivery.minimumOrderAmount;

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
            {commerce && (
              <>
                <div className={styles.priceRow}>
                  <span>Delivery Fee</span>
                  <span>{fee === 0 ? "FREE" : formatCurrency(fee)}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>{live ? "Tax" : "Estimated Tax"}</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total Amount</span>
                  <span className={styles.totalValue}>{formatCurrency(total)}</span>
                </div>
              </>
            )}

            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={
                !commerce || Boolean(live && !live.acceptingOrders) || pricing.subtotal < minimum
              }
              onClick={() => {
                closeCart();
                onProceedToCheckout();
              }}
            >
              {commerce ? `Review Order • ${formatCurrency(total)}` : "Ordering currently unavailable"}
            </Button>
            {(!commerce || (live && !live.acceptingOrders)) && (
              <p role="status">{commerce ? "The kitchen is paused for new orders." : "Your cart is saved. Check back shortly to order."}</p>
            )}
            {commerce && pricing.subtotal < minimum && (
              <p role="status">
                Add{" "}
                {formatCurrency(
                  minimum - pricing.subtotal,
                )}{" "}
                more to reach the{" "}
                {formatCurrency(minimum)} minimum
                before fees.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};
