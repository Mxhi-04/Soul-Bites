import React from 'react';
import { MenuItem } from '../types/menuTypes';
import { formatCurrency } from '../../../utils/formatters';
import styles from './MenuItemCard.module.css';

export interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
  const ratingValue = item.rating ?? 4.8;
  const subtitleText = item.subtitle || item.description;

  return (
    <div className={styles.card}>
      {/* Picture Section: Dominant & Covers Most of the Card (~60%) */}
      <div className={styles.imageWrapper}>
        <img src={item.imageUrl} alt={item.name} className={styles.image} loading="lazy" />
        {item.isPopular && <div className={styles.popularBadge}>Bestseller</div>}
        {item.dietaryTags.includes('veg') && (
          <div className={styles.dietBadge} title="Vegetarian">
            <span className={styles.vegDot} />
          </div>
        )}
      </div>

      {/* Content Section: Name, Rating, Subtitle, Price & Add */}
      <div className={styles.content}>
        {/* Row 1: Dish Name (Left) + Numeric Rating (Right) */}
        <div className={styles.headerRow}>
          <h3 className={styles.title} title={item.name}>
            {item.name}
          </h3>
          <span className={styles.ratingScore}>{ratingValue.toFixed(1)}</span>
        </div>

        {/* Row 2: Subtitle / Dish Details */}
        <p className={styles.subtitle}>{subtitleText}</p>

        {/* Row 3: Rating Stars (Left) + Price & Add Button (Right) */}
        <div className={styles.footerRow}>
          <div className={styles.starsRow} aria-label={`Rating: ${ratingValue} stars`}>
            <span className={styles.star}>★</span>
            <span className={styles.star}>★</span>
            <span className={styles.star}>★</span>
          </div>

          <div className={styles.priceActionWrapper}>
            <span className={styles.price}>{formatCurrency(item.price)}</span>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => onAddToCart(item)}
              aria-label={`Add ${item.name} to cart for ${formatCurrency(item.price)}`}
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
