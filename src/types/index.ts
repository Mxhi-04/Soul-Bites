/**
 * Shared Type Definitions for Soul Bites
 */

export type DietaryTag = 'veg' | 'non-veg' | 'vegan' | 'gluten-free' | 'chef-special';

export type SpiceLevel = 'mild' | 'medium' | 'spicy' | 'extra-spicy';

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}
