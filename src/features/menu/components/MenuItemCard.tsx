import React from 'react';
import { MenuItem } from '../types/menuTypes';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { formatCurrency } from '../../../utils/formatters';
import styles from './MenuItemCard.module.css';

export interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={item.imageUrl} alt={item.name} className={styles.image} loading="lazy" />
        {item.isPopular && <div className={styles.popularBadge}>Bestseller</div>}
      </div>

      <div className={styles.content}>
        <div className={styles.tagsRow}>
          {item.dietaryTags.map((tag) => (
            <Badge key={tag} variant={tag} />
          ))}
        </div>

        <div className={styles.headerRow}>
          <h3 className={styles.title}>{item.name}</h3>
          <span className={styles.price}>{formatCurrency(item.price)}</span>
        </div>

        <p className={styles.description}>{item.description}</p>

        <div className={styles.footerRow}>
          <div className={styles.metaInfo}>
            <span>⏱ ~{item.preparationTimeMinutes}m</span>
            {item.calories && <span>• {item.calories} kcal</span>}
          </div>

          <Button size="sm" variant="primary" onClick={() => onAddToCart(item)}>
            + Add
          </Button>
        </div>
      </div>
    </div>
  );
};
