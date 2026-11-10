import type { MenuItem, MenuFilterOptions } from "../types/menuTypes.ts";
import type { DietaryTag } from "../../../types/index.ts";

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "sb-pizza-01",
    name: "Artisanal Woodfired Paneer Tikka Pizza",
    subtitle: "with tandoori paneer & vegetarian mozzarella",
    description:
      "Hand-stretched sourdough crust loaded with fiery tandoori spiced paneer cubes, crunchy caramelized red onions, aromatic herbs, and vegetarian mozzarella.",
    price: 269,
    rating: 4.9,
    category: "pizzas",
    dietaryTags: ["veg", "chef-special"],
    spiceLevel: "medium",
    imageUrl: "/images/tandoori_paneer_pizza.jpg",
    preparationTimeMinutes: 20,
    calories: 640,
    isPopular: true,
  },
  {
    id: "sb-aloo-tikki",
    name: "Soul Fire Aloo Tikki Burger",
    subtitle: "with crispy potato tikki & vegetarian cheddar",
    description:
      "Golden potato and pea tikki, vegetarian cheddar, ripe tomato, red onion, and crisp lettuce on a toasted eggless sesame bun.",
    price: 249,
    category: "burgers",
    dietaryTags: ["veg", "chef-special"],
    spiceLevel: "medium",
    imageUrl: "/images/landing/aloo-tikki-card.webp",
    preparationTimeMinutes: 18,
    isPopular: true,
  },
  {
    id: "sb-hot-honey-paneer",
    name: "Crispy Hot Honey Paneer Burger",
    subtitle: "with hot honey drizzle & purple slaw",
    description:
      "Crisp crumbed paneer, hot honey, crunchy purple slaw, and dill pickles in a golden eggless potato bun.",
    price: 279,
    category: "burgers",
    dietaryTags: ["veg", "chef-special"],
    spiceLevel: "spicy",
    imageUrl: "/images/landing/hot-honey-paneer.webp",
    preparationTimeMinutes: 20,
    isPopular: true,
  },
  {
    id: "sb-05",
    name: "Charcoal Truffle Loaded Fries",
    subtitle: "with white truffle oil & shaved vegetarian cheese",
    description:
      "Hand-cut, double-cooked fries with charcoal sea salt, white truffle oil, chives, and shaved hard cheese made with vegetarian rennet.",
    price: 169,
    rating: 4.7,
    category: "fries",
    dietaryTags: ["veg", "chef-special"],
    spiceLevel: "mild",
    imageUrl: "/images/landing/fries.webp",
    preparationTimeMinutes: 12,
    calories: 460,
    isPopular: true,
  },
  {
    id: "sb-03",
    name: "Golden Harvest Soul Bowl",
    subtitle: "with roasted sweet potato & turmeric tahini",
    description:
      "Warm quinoa base, roasted sweet potato, charred avocado, spiced chickpeas, baby kale, and creamy golden turmeric tahini dressing.",
    price: 229,
    rating: 4.8,
    category: "bowls",
    dietaryTags: ["vegan", "gluten-free"],
    spiceLevel: "mild",
    imageUrl: "/images/landing/bowl.webp",
    preparationTimeMinutes: 15,
    calories: 520,
  },
  {
    id: "sb-04",
    name: "Smoked BBQ Pulled Jackfruit Burger",
    subtitle: "with hickory jackfruit & crisp apple slaw",
    description:
      "Slow-cooked hickory smoked jackfruit, crisp apple slaw, house tangy BBQ glaze on a plant-based sesame bun.",
    price: 219,
    rating: 4.6,
    category: "burgers",
    dietaryTags: ["vegan"],
    spiceLevel: "mild",
    imageUrl: "/images/landing/pulled-jackfruit.webp",
    preparationTimeMinutes: 16,
    calories: 490,
  },
  {
    id: "sb-06",
    name: "Firecracker Cajun Fries",
    subtitle: "with zesty cajun spices & garlic dip",
    description:
      "Crispy skin-on fries tossed in zesty Cajun spices served with an egg-free, dairy-free golden garlic dip.",
    price: 139,
    rating: 4.7,
    category: "fries",
    dietaryTags: ["vegan", "gluten-free"],
    spiceLevel: "spicy",
    imageUrl:
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80",
    preparationTimeMinutes: 10,
    calories: 390,
  },
  {
    id: "sb-07",
    name: "Artisan Golden Mango Passion Elixir",
    subtitle: "with Alphonso mango nectar & mint leaves",
    description:
      "Cold-pressed Alphonso mango nectar, passion fruit pulp, crushed mint leaves, and sparkling spring water.",
    price: 119,
    rating: 4.9,
    category: "drinks",
    dietaryTags: ["vegan", "gluten-free"],
    imageUrl:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    preparationTimeMinutes: 5,
    calories: 140,
  },
  {
    id: "sb-08",
    name: "Warm Salted Caramel Brownie Skillet Bite",
    subtitle: "with espresso dark fudge & pecans",
    description:
      "Rich eggless dark chocolate fudge brownie infused with espresso, topped with warm salted caramel sauce and toasted pecans.",
    price: 149,
    rating: 4.9,
    category: "desserts",
    dietaryTags: ["veg"],
    imageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    preparationTimeMinutes: 8,
    calories: 420,
    isPopular: true,
  },
];

export const menuService = {
  getMenuItems(filters?: MenuFilterOptions): Promise<MenuItem[]> {
    return new Promise((resolve) => {
      let items = [...INITIAL_MENU_ITEMS];

      if (filters?.category && filters.category !== "all") {
        items = items.filter((item) => item.category === filters.category);
      }

      if (filters?.dietaryTag && filters.dietaryTag !== "all") {
        items = items.filter(
          (item) =>
            item.dietaryTags.includes(filters.dietaryTag as DietaryTag) ||
            (filters.dietaryTag === "veg" &&
              item.dietaryTags.includes("vegan")),
        );
      }

      if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
        const query = filters.searchQuery.toLowerCase().trim();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query),
        );
      }

      resolve(items);
    });
  },

  getItemById(id: string): MenuItem | undefined {
    return INITIAL_MENU_ITEMS.find((item) => item.id === id);
  },
};
