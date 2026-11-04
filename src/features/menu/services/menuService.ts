import { MenuItem, MenuFilterOptions } from '../types/menuTypes';
import { DietaryTag } from '../../../types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'sb-pizza-01',
    name: 'Artisanal Woodfired Paneer Tikka Pizza',
    description: 'Hand-stretched sourdough crust loaded with fiery tandoori spiced paneer cubes, crunchy caramelized red onions, aromatic herbs, and gooey stretchy mozzarella.',
    price: 269,
    category: 'pizzas',
    dietaryTags: ['veg', 'chef-special'],
    spiceLevel: 'medium',
    imageUrl: '/images/tandoori_paneer_pizza.jpg',
    preparationTimeMinutes: 20,
    calories: 640,
    isPopular: true,
  },
  {
    id: 'sb-01',
    name: 'Soul Fire Smash Burger',
    description: 'Double smashed patties, melted smoked cheddar, caramelized onions, house truffle aioli on a toasted brioche bun.',
    price: 249,
    category: 'burgers',
    dietaryTags: ['non-veg', 'chef-special'],
    spiceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 18,
    calories: 740,
    isPopular: true,
  },
  {
    id: 'sb-02',
    name: 'Crispy Truffle Hot Honey Chicken Burger',
    description: 'Buttermilk fried crisp chicken thigh, hot honey drizzle, crunchy purple slaw, and dill pickles in golden potato bun.',
    price: 279,
    category: 'burgers',
    dietaryTags: ['non-veg', 'chef-special'],
    spiceLevel: 'spicy',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 20,
    calories: 680,
    isPopular: true,
  },
  {
    id: 'sb-05',
    name: 'Charcoal Truffle Loaded Fries',
    description: 'Hand-cut double cooked fries dusted with aromatic charcoal sea salt, white truffle oil, shaved parmesan, and chives.',
    price: 169,
    category: 'fries',
    dietaryTags: ['veg', 'chef-special'],
    spiceLevel: 'mild',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 12,
    calories: 460,
    isPopular: true,
  },
  {
    id: 'sb-03',
    name: 'Golden Harvest Soul Bowl',
    description: 'Warm quinoa base, roasted sweet potato, charred avocado, spiced chickpeas, baby kale, and creamy golden turmeric tahini dressing.',
    price: 229,
    category: 'bowls',
    dietaryTags: ['vegan', 'gluten-free'],
    spiceLevel: 'mild',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 15,
    calories: 520,
  },
  {
    id: 'sb-04',
    name: 'Smoked BBQ Pulled Jackfruit Burger',
    description: 'Slow-cooked hickory smoked jackfruit, crisp apple slaw, house tangy BBQ glaze on an artisan sesame seed bun.',
    price: 219,
    category: 'burgers',
    dietaryTags: ['vegan'],
    spiceLevel: 'mild',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 16,
    calories: 490,
  },
  {
    id: 'sb-06',
    name: 'Firecracker Cajun Fries',
    description: 'Crispy skin-on fries tossed in zesty Cajun spices served with house golden garlic sauce dip.',
    price: 139,
    category: 'fries',
    dietaryTags: ['vegan', 'gluten-free'],
    spiceLevel: 'spicy',
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 10,
    calories: 390,
  },
  {
    id: 'sb-07',
    name: 'Artisan Golden Mango Passion Elixir',
    description: 'Cold-pressed Alphonso mango nectar, passion fruit pulp, crushed mint leaves, and sparkling spring water.',
    price: 119,
    category: 'drinks',
    dietaryTags: ['vegan', 'gluten-free'],
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 5,
    calories: 140,
  },
  {
    id: 'sb-08',
    name: 'Warm Salted Caramel Brownie Skillet Bite',
    description: 'Rich dark chocolate fudge brownie infused with espresso, topped with warm salted caramel sauce and toasted pecans.',
    price: 149,
    category: 'desserts',
    dietaryTags: ['veg'],
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 8,
    calories: 420,
    isPopular: true,
  },
];

export const menuService = {
  getMenuItems(filters?: MenuFilterOptions): Promise<MenuItem[]> {
    return new Promise((resolve) => {
      let items = [...INITIAL_MENU_ITEMS];

      if (filters?.category && filters.category !== 'all') {
        items = items.filter((item) => item.category === filters.category);
      }

      if (filters?.dietaryTag && filters.dietaryTag !== 'all') {
        items = items.filter((item) => item.dietaryTags.includes(filters.dietaryTag as DietaryTag));
      }

      if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
      }

      resolve(items);
    });
  },

  getItemById(id: string): MenuItem | undefined {
    return INITIAL_MENU_ITEMS.find((item) => item.id === id);
  },
};
