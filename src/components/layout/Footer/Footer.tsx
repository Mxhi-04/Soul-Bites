import React from 'react';
import { APP_CONFIG } from '../../../constants/config';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandColumn}>
          <img
            src="/images/soul_bites_logo.png"
            alt={APP_CONFIG.brandName}
            className={styles.brandLogo}
          />
          <div className={styles.brandTagline}>{APP_CONFIG.tagline}</div>
          <p className={styles.description}>
            Crafted in our certified culinary hub, packaged in eco-insulated boxes, and delivered
            steaming hot straight to your doorstep.
          </p>
        </div>

        <div>
          <h4 className={styles.columnTitle}>Kitchen Standards</h4>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span className={styles.badgeHighlight}>✓</span> {APP_CONFIG.kitchenInfo.hygieneRating}
            </li>
            <li className={styles.listItem}>
              <span className={styles.badgeHighlight}>✓</span> 100% Contactless Preparation
            </li>
            <li className={styles.listItem}>
              <span className={styles.badgeHighlight}>✓</span> Daily Sanitized Workstations
            </li>
            <li className={styles.listItem}>
              <span className={styles.badgeHighlight}>✓</span> Fresh Daily Local Sourcing
            </li>
          </ul>
        </div>

        <div>
          <h4 className={styles.columnTitle}>Operating Hours</h4>
          <ul className={styles.list}>
            <li>Monday – Sunday: {APP_CONFIG.operatingHours.open} – {APP_CONFIG.operatingHours.close}</li>
            <li>Direct Hub: {APP_CONFIG.kitchenInfo.kitchenHub}</li>
            <li>Support: {APP_CONFIG.kitchenInfo.contactPhone}</li>
            <li>Email: {APP_CONFIG.kitchenInfo.contactEmail}</li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottomBar}`}>
        <span>© {new Date().getFullYear()} {APP_CONFIG.brandName}. All rights reserved.</span>
        <span>Premium Cloud Kitchen Experience</span>
      </div>
    </footer>
  );
};
