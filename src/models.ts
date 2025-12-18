
/**
 * Datenmodell für eine Inventar-Liste
 * Unterstützt Verschachtelung bis zu 9 Ebenen tief
 */
export interface InventoryList {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  items: InventoryItem[];
  sublists?: InventoryList[]; // Unterlisten (max. 3 Ebenen)
  level?: number; // Verschachtelungstiefe (0 = Hauptliste)
}

/**
 * Datenmodell für einen Artikel
 * Artikel können zu jeder Liste hinzugefügt werden
 */
export interface InventoryItem {
  id: string;
  name: string;
  imageUrl?: string;
  purchasePrice: number;
  currentValue: number;
  createdAt: string;
  properties?: Record<string, string | number>;
}
