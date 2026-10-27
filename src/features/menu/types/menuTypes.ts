import { DietaryTag, SpiceLevel } from '../../../types';

export type MenuCategory = 'all' | 'burgers' | 'bowls' | 'fries' | 'drinks' | 'desserts';

export interface MenuItemCustomization {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  dietaryTags: DietaryTag[];
  spiceLevel?: SpiceLevel;
  imageUrl: string;
  preparationTimeMinutes: number;
  calories?: number;
  customizations?: MenuItemCustomization[];
  isPopular?: boolean;
}

export interface MenuFilterOptions {
  category: MenuCategory;
  dietaryTag?: DietaryTag | 'all';
  searchQuery?: string;
}
