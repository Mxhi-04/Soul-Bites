import React from "react";
import { APP_CONFIG } from "../../../constants/config";
import { ShoppingCartIcon } from "../../ui/Icons/ShoppingCartIcon";
import styles from "./Navbar.module.css";

export interface NavbarProps {
  cartItemCount: number;
  signedIn?: boolean;
  onOpenCart: () => void;
  onOpenTracking?: () => void;
  hasActiveOrder?: boolean;
  showOrderTracking?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  signedIn = false,
  onOpenCart,
  onOpenTracking,
  hasActiveOrder = false,
  showOrderTracking = false,
}) => {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => window.scrollTo({ top: 0 })}
          aria-label={`${APP_CONFIG.brandName} - Return to top`}
        >
          <img
            src="/images/soul_bites_logo_small.webp"
            width={192}
            height={138}
            alt={APP_CONFIG.brandName}
            className={styles.brandLogo}
          />
        </button>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#featured">Featured</a>
          <a href="#menu">Menu</a>
          <a href="#questions">FAQ</a>
          {showOrderTracking && <a href="/track">Track order</a>}
        </nav>

        <div className={styles.actions}>
          <a className={styles.signIn} href="/login">
            {signedIn ? "Account" : "Sign in"}
          </a>
          {hasActiveOrder && onOpenTracking && (
            <button className={styles.cartButton} onClick={onOpenTracking}>
              <span>View preview</span>
            </button>
          )}

          <button
            className={styles.cartButton}
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartItemCount} ${cartItemCount === 1 ? "item" : "items"}`}
          >
            <span className={styles.cartIconWrapper}>
              <ShoppingCartIcon size={20} color="var(--color-golden-yellow)" />
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
