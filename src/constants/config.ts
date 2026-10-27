/**
 * Soul Bites Cloud Kitchen Configuration
 */

export const APP_CONFIG = {
  brandName: 'Soul Bites',
  tagline: 'Artisanal Comfort Food Straight From Our Cloud Kitchen',
  operatingHours: {
    open: '11:00 AM',
    close: '11:30 PM',
    isOpenNow: true,
  },
  delivery: {
    averagePrepTimeMinutes: 20,
    averageDeliveryTimeMinutes: 15,
    minimumOrderAmount: 149,
    deliveryFee: 35,
    freeDeliveryThreshold: 499,
    taxRatePercentage: 5.0,
    currencySymbol: '₹',
    currencyCode: 'INR',
  },
  kitchenInfo: {
    hygieneRating: '5-Star FSSAI Certified',
    kitchenHub: 'Central Kitchen Hub #04',
    contactPhone: '+1 (555) 768-5248',
    contactEmail: 'orders@soulbiteskitchen.com',
  },
} as const;
