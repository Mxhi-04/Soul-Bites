import React from 'react';
import { MenuCategory } from '../types/menuTypes';
import styles from './MenuCategoryFilter.module.css';

export interface MenuCategoryFilterProps {
  selectedCategory: MenuCategory;
  onSelectCategory: (category: MenuCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CATEGORIES: { id: MenuCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Items', icon: '✨' },
  { id: 'burgers', label: 'Soul Burgers', icon: '🍔' },
  { id: 'bowls', label: 'Harvest Bowls', icon: '🥗' },
  { id: 'fries', label: 'Loaded Fries', icon: '🍟' },
  { id: 'drinks', label: 'Artisan Drinks', icon: '🥤' },
  { id: 'desserts', label: 'Sweet Bites', icon: '🍰' },
];

export const MenuCategoryFilter: React.FC<MenuCategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search burgers, harvest bowls, loaded fries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{ color: 'var(--color-cream-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.categoryList}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`${styles.categoryChip} ${isActive ? styles.activeChip : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
