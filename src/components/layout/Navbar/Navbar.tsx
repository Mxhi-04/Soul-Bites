import React from 'react';
import { APP_CONFIG } from '../../../constants/config';
import { ShoppingCartIcon } from '../../ui/Icons/ShoppingCartIcon';
import styles from './Navbar.module.css';

export interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenTracking?: () => void;
  hasActiveOrder?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  onOpenCart,
  onOpenTracking,
  hasActiveOrder = false,
}) => {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logoBadge}>SB</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>{APP_CONFIG.brandName}</span>
            <span className={styles.brandTagline}>Cloud Kitchen</span>
          </div>
        </div>

        <div className={styles.kitchenStatus}>
          <span className={styles.statusIndicator} />
          <span>Kitchen Active • 20–35 min delivery</span>
        </div>

        <div className={styles.actions}>
          {hasActiveOrder && onOpenTracking && (
            <button className={styles.cartButton} onClick={onOpenTracking}>
              <span>🛵 Track Order</span>
            </button>
          )}

          <button
            className={styles.cartButton}
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartItemCount} items`}
          >
            <span className={styles.cartIconWrapper}>
              <ShoppingCartIcon size={20} color="var(--color-golden-yellow)" glow={cartItemCount > 0} />
            </span>
            <span className={styles.cartLabel}>Cart</span>
            {cartItemCount > 0 && (
              <span className={styles.cartCount}>{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
