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
        <button
          type="button"
          className={styles.brand}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={`${APP_CONFIG.brandName} - Return to top`}
        >
          <img
            src="/images/soul_bites_logo.png"
            alt={APP_CONFIG.brandName}
            className={styles.brandLogo}
          />
        </button>

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
