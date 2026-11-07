/**
 * Safe localStorage wrapper with fallback handling
 */

export const storage = {
  get<T>(
    key: string,
    defaultValue: T,
    area: "localStorage" | "sessionStorage" = "localStorage",
  ): T {
    try {
      const item = window[area].getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`[storage] Error reading key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(
    key: string,
    value: T,
    area: "localStorage" | "sessionStorage" = "localStorage",
  ): boolean {
    try {
      window[area].setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[storage] Error saving key "${key}":`, error);
      return false;
    }
  },

  remove(
    key: string,
    area: "localStorage" | "sessionStorage" = "localStorage",
  ): void {
    try {
      window[area].removeItem(key);
    } catch (error) {
      console.warn(`[storage] Error removing key "${key}":`, error);
    }
  },
};

export function accountStorageKey(key: string, accountId?: string): string {
  return accountId ? `${key}:${accountId}` : key;
}
