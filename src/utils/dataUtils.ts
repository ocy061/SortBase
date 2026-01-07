import { InventoryList, InventoryItem } from '../models';
import { ListSortMode, ListViewMode } from './stateManager';

/** Sortier-Utilities für Listen und Artikel */
export class SortUtils {
  static sortLists(
    lists: InventoryList[],
    mode: ListSortMode,
    ascending: boolean
  ): InventoryList[] {
    const sorted = [...lists].sort((a, b) => {
      let cmp = 0;
      if (mode === 'name') cmp = a.name.localeCompare(b.name);
      else if (mode === 'category') cmp = (a.category || '').localeCompare(b.category || '');
      else if (mode === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return ascending ? cmp : -cmp;
    });
    return sorted;
  }

  static sortItems(
    items: InventoryItem[],
    mode: 'name' | 'category' | 'purchasePrice' | 'currentValue' | 'createdAt',
    ascending: boolean
  ): InventoryItem[] {
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      if (mode === 'name') cmp = a.name.localeCompare(b.name);
      else if (mode === 'purchasePrice') cmp = a.purchasePrice - b.purchasePrice;
      else if (mode === 'currentValue') cmp = a.currentValue - b.currentValue;
      else if (mode === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return ascending ? cmp : -cmp;
    });
    return sorted;
  }

  static sortMixed(
    lists: InventoryList[],
    items: InventoryItem[],
    mode: 'name' | 'category' | 'purchasePrice' | 'currentValue' | 'createdAt',
    ascending: boolean
  ): { lists: InventoryList[]; items: InventoryItem[] } {
    return {
      lists: this.sortLists(lists, mode as ListSortMode, ascending),
      items: this.sortItems(items, mode, ascending),
    };
  }
}

/** Filter-Utilities für Suche in Listen und Artikeln */
export class FilterUtils {
  static filterLists(lists: InventoryList[], query: string): InventoryList[] {
    if (!query) return lists;
    const q = query.toLowerCase();
    return lists.filter(l => l.name.toLowerCase().includes(q) || (l.category?.toLowerCase().includes(q) ?? false));
  }

  static filterItems(items: InventoryItem[], query: string): InventoryItem[] {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(q));
  }

  static filterMixed(
    lists: InventoryList[],
    items: InventoryItem[],
    query: string
  ): { lists: InventoryList[]; items: InventoryItem[] } {
    return {
      lists: this.filterLists(lists, query),
      items: this.filterItems(items, query),
    };
  }
}

/** Daten-Utilities für Berechnungen und Formatierung */
export class DataUtils {
  static calculateProfit(purchasePrice: number, currentValue: number): number {
    if (typeof purchasePrice !== 'number' || isNaN(purchasePrice) || 
        typeof currentValue !== 'number' || isNaN(currentValue)) {
      return NaN;
    }
    return currentValue - purchasePrice;
  }

  static formatCurrency(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${value.toFixed(2)}€`;
  }

  static formatProfit(profit: number): { value: string; color: string; label: string } {
    if (isNaN(profit)) return { value: '-', color: 'black', label: '' };
    const color = profit > 0 ? 'green' : profit < 0 ? 'red' : 'black';
    const vorzeichen = profit > 0 ? '+' : '';
    const label = profit > 0 ? 'Gewinn' : profit < 0 ? 'Verlust' : '±0';
    return { value: `${vorzeichen}${profit.toFixed(2)}€`, color, label };
  }

  static hasValidPrice(purchasePrice: any, currentValue: any): boolean {
    return (
      typeof purchasePrice === 'number' && !isNaN(purchasePrice) &&
      typeof currentValue === 'number' && !isNaN(currentValue)
    );
  }

  /**
   * Calculates total purchase price, current value, and profit for a list
   * by recursively summing all items in the list and its sublists.
   * Returns undefined for values if no valid items exist.
   */
  static calculateListTotals(list: any): {
    purchasePrice: number | undefined;
    currentValue: number | undefined;
    profit: number | undefined;
  } {
    let totalPurchase = 0;
    let totalValue = 0;
    let hasPurchase = false;
    let hasValue = false;

    // Recursive helper to sum items from a list and its sublists
    const sumItems = (currentList: any) => {
      // Sum direct items
      if (currentList.items && Array.isArray(currentList.items)) {
        currentList.items.forEach((item: any) => {
          if (typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice)) {
            totalPurchase += item.purchasePrice;
            hasPurchase = true;
          }
          if (typeof item.currentValue === 'number' && !isNaN(item.currentValue)) {
            totalValue += item.currentValue;
            hasValue = true;
          }
        });
      }

      // Recursively sum sublists
      if (currentList.sublists && Array.isArray(currentList.sublists)) {
        currentList.sublists.forEach((sublist: any) => {
          sumItems(sublist);
        });
      }
    };

    sumItems(list);

    const purchasePrice = hasPurchase ? totalPurchase : undefined;
    const currentValue = hasValue ? totalValue : undefined;
    const profit =
      hasPurchase && hasValue
        ? totalValue - totalPurchase
        : undefined;

    return { purchasePrice, currentValue, profit };
  }
}
