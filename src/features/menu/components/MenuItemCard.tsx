import React from "react";
import { MenuItem } from "../types/menuTypes";
import { formatCurrency } from "../../../utils/formatters";
import { Badge } from "../../../components/ui/Badge/Badge";
import styles from "./MenuItemCard.module.css";

export interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
}) => {
  const subtitleText = item.subtitle || item.description;

  return (
    <div className={styles.card}>
      {/* Picture Section: Dominant & Covers Most of the Card (~60%) */}
      <div className={styles.imageWrapper}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className={styles.image}
          loading="lazy"
        />
        {item.isPopular && (
          <div className={styles.popularBadge}>Bestseller</div>
        )}
        {item.dietaryTags.includes("veg") && (
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
          <span
            className={styles.preparationTime}
            aria-label={`Preparation: ${item.preparationTimeMinutes} minutes`}
          >
            {item.preparationTimeMinutes} min
          </span>
        </div>

        {/* Row 2: Subtitle / Dish Details */}
        <p className={styles.subtitle}>{subtitleText}</p>
        <div className={styles.dietaryTags}>
          {item.dietaryTags
            .filter((tag) => tag !== "chef-special")
            .map((tag) => (
              <Badge key={tag} variant={tag} />
            ))}
        </div>
        <details className={styles.details}>
          <summary>Dish details</summary>
          <p>{item.description}</p>
          {item.spiceLevel && <p>Spice level: {item.spiceLevel}</p>}
        </details>

        {/* Row 3: Rating Stars (Left) + Price & Add Button (Right) */}
        <div className={styles.footerRow}>
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
