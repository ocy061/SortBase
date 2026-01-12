import { LIMITS } from './constants';

/**
 * Datenmodell für eine Inventar-Liste
 * Unterstützt Verschachtelung bis zu ${LIMITS.MAX_NESTING_LEVEL} Ebenen tief
 */
export interface InventoryList {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  items: InventoryItem[];
  sublists?: InventoryList[]; // Unterlisten (max. ${LIMITS.MAX_NESTING_LEVEL} Ebenen Tiefe)
  level?: number; // Verschachtelungstiefe (0 = Hauptliste, max. ${LIMITS.MAX_NESTING_LEVEL})
  hideFinancials?: boolean; // Finanzielle Werte verbergen (Privatsphäre)
}

/**
 * Datenmodell für einen Artikel
 * Artikel können zu jeder Liste hinzugefügt werden
 */
export interface InventoryItem {
  id: string;
  name: string;
  imageUrls?: string[];
  purchasePrice: number;
  currentValue: number;
  createdAt: string;
  properties?: Record<string, string | number>;
  hideFinancials?: boolean; // Finanzielle Werte verbergen (Privatsphäre)
}
