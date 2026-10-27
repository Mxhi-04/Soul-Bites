/**
 * Formatting utilities for currency, time, and text
 */

import { APP_CONFIG } from '../constants/config';

export function formatCurrency(amount: number): string {
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${APP_CONFIG.delivery.currencySymbol}${formatted}`;
}

export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} hr ${remaining} mins` : `${hours} hr`;
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
