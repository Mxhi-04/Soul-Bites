import React from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '../../../components/ui/Button/Button';
import { formatCurrency } from '../../../utils/formatters';
import styles from './CartDrawer.module.css';

export interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { items, pricing, isCartOpen, closeCart, updateQuantity } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeCart} role="dialog" aria-modal="true">
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Your Order ({pricing.itemCount})</h3>
          <button className={styles.closeButton} onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </div>

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
                  <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemPrice}>{formatCurrency(item.price * quantity)}</div>

                    <div className={styles.quantityControls}>
                      <button
                        className={styles.qtyButton}
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className={styles.qtyDisplay}>{quantity}</span>
                      <button
                        className={styles.qtyButton}
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
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
                  {pricing.deliveryFee === 0 ? 'FREE' : formatCurrency(pricing.deliveryFee)}
                </span>
              </div>
              <div className={styles.priceRow}>
                <span>Estimated Tax</span>
                <span>{formatCurrency(pricing.tax)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Total Amount</span>
                <span className={styles.totalValue}>{formatCurrency(pricing.total)}</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => {
                  closeCart();
                  onProceedToCheckout();
                }}
              >
                Checkout Now • {formatCurrency(pricing.total)}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
