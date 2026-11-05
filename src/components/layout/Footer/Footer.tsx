import React from "react";
import { APP_CONFIG } from "../../../constants/config";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandColumn}>
          <img
            src="/images/soul_bites_logo_small.png"
            width={192}
            height={138}
            loading="lazy"
            alt={APP_CONFIG.brandName}
            className={styles.brandLogo}
          />
          <div className={styles.brandTagline}>{APP_CONFIG.tagline}</div>
          <p className={styles.description}>
            Browse our sample menu and explore your order. Live ordering and
            delivery are coming soon.
          </p>
        </div>

        <div>
          <h2 className={styles.columnTitle}>Before you order</h2>
          <ul className={styles.list}>
            <li>Menu items and photography are illustrative.</li>
            <li>
              Ingredients and allergen information must be confirmed with the
              kitchen before live ordering.
            </li>
            <li>No payment is collected in this demo.</li>
          </ul>
        </div>

        <div>
          <h2 className={styles.columnTitle}>Explore Soul Bites</h2>
          <ul className={styles.list}>
            <li>
              <a href="#menu">Browse the menu</a>
            </li>
            <li>
              Delivery locations and opening hours will be published before
              launch.
            </li>
            <li>Support and business details are being confirmed.</li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottomBar}`}>
        <span>
          © {new Date().getFullYear()} {APP_CONFIG.brandName}. All rights
          reserved.
        </span>
        <span>Premium Cloud Kitchen Experience</span>
      </div>
    </footer>
  );
};
