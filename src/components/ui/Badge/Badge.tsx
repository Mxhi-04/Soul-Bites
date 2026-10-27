import React from 'react';
import { DietaryTag } from '../../../types';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant: DietaryTag | 'custom';
  label?: string;
  className?: string;
}

const DEFAULT_LABELS: Record<DietaryTag, string> = {
  veg: 'Veg',
  'non-veg': 'Non-Veg',
  vegan: 'Vegan',
  'gluten-free': 'Gluten Free',
  'chef-special': "Chef's Special",
};

export const Badge: React.FC<BadgeProps> = ({ variant, label, className = '' }) => {
  const variantClass =
    variant === 'veg'
      ? styles.veg
      : variant === 'non-veg'
      ? styles.nonVeg
      : variant === 'vegan'
      ? styles.vegan
      : variant === 'chef-special'
      ? styles.chefSpecial
      : variant === 'gluten-free'
      ? styles.glutenFree
      : styles.chefSpecial;

  const displayLabel = label || (variant !== 'custom' ? DEFAULT_LABELS[variant] : '');

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`}>
      <span className={styles.dot} />
      {displayLabel}
    </span>
  );
};
