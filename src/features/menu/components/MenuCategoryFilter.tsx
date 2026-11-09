import React from "react";
import { MenuCategory } from "../types/menuTypes";
import { DietaryTag } from "../../../types";
import styles from "./MenuCategoryFilter.module.css";

export interface MenuCategoryFilterProps {
  selectedCategory: MenuCategory;
  onSelectCategory: (category: MenuCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dietaryTag: DietaryTag | "all";
  onDietaryChange: (tag: DietaryTag | "all") => void;
}

const CATEGORIES: { id: MenuCategory; label: string; icon: string }[] = [
  { id: "all", label: "All Items", icon: "✨" },
  { id: "pizzas", label: "Woodfired Pizzas", icon: "🍕" },
  { id: "burgers", label: "Soul Burgers", icon: "🍔" },
  { id: "bowls", label: "Harvest Bowls", icon: "🥗" },
  { id: "fries", label: "Loaded Fries", icon: "🍟" },
  { id: "drinks", label: "Artisan Drinks", icon: "🥤" },
  { id: "desserts", label: "Sweet Bites", icon: "🍰" },
];

export const MenuCategoryFilter: React.FC<MenuCategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  dietaryTag,
  onDietaryChange,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <span>🔍</span>
        <input
          type="text"
          aria-label="Search menu"
          className={styles.searchInput}
          placeholder="Search burgers, harvest bowls, loaded fries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
            style={{ color: "var(--color-cream-muted)", cursor: "pointer" }}
          >
            ✕
          </button>
        )}
      </div>

      <label className={styles.dietaryLabel}>
        Dietary preference
        <select
          value={dietaryTag}
          onChange={(event) =>
            onDietaryChange(event.target.value as DietaryTag | "all")
          }
        >
          <option value="all">All preferences</option>
          <option value="veg">Vegetarian (including vegan)</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-free</option>
        </select>
      </label>

      <div className={styles.categoryList}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isActive}
              className={`${styles.categoryChip} ${isActive ? styles.activeChip : ""}`}
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
