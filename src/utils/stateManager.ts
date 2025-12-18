import { InventoryList } from '../models';

export type ListSortMode = 'name' | 'category' | 'createdAt';
export type ListViewMode = 'all' | 'sublists' | 'items';

export interface DetailViewStateEntry {
  listViewMode: ListViewMode;
  combinedSortMode: 'name' | 'category' | 'purchasePrice' | 'currentValue' | 'createdAt';
  combinedSortAsc: boolean;
  combinedSearchQuery: string;
}

export interface ListOverviewStateEntry {
  listSortMode: ListSortMode;
  listSortAsc: boolean;
}

export type DetailViewState = {
  [listId: string]: DetailViewStateEntry | ListOverviewStateEntry;
};

/**
 * StateManager: Verwaltet den gesamten Anwendungszustand
 * - Listen-Daten (mit Verschachtelung)
 * - Filter- und Sort-Einstellungen pro Ansicht
 * - Persistierung in JSON-Datei
 */
export class StateManager {
  lists: InventoryList[] = [];
  selectedListId: string | null = null;
  
  // Listen-Übersicht: Globale Einstellungen
  listSortMode: ListSortMode = 'name';
  listSortAsc: boolean = true;
  listSearchQuery = '';
  
  // Detail-Ansicht
  detailViewState: DetailViewState = {};

  /** Lädt Daten aus JSON-Datei und stellt Level-Hierarchie wieder her */
  async loadData() {
    try {
      const data = await window.inventarAPI.loadLists();
      if (data && Array.isArray(data.lists)) {
        this.lists = data.lists;
        this.normalizeLevels(this.lists, 0);
        const so = data.sortOptions;
        if (so) {
          if ((so as any).detailViewState) {
            this.detailViewState = (so as any).detailViewState;
            const entry = this.detailViewState['__listOverview__'];
            if (this.isListOverviewStateEntry(entry)) {
              if (entry.listSortMode) this.listSortMode = entry.listSortMode;
              if (typeof entry.listSortAsc === 'boolean') this.listSortAsc = entry.listSortAsc;
            }
          }
          if ((so as any).listSearchQuery) this.listSearchQuery = (so as any).listSearchQuery;
        }
      } else if (Array.isArray(data)) {
        this.lists = data;
        this.normalizeLevels(this.lists, 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  /** Speichert alle Daten und Einstellungen in JSON-Datei */
  async saveData() {
    try {
      await window.inventarAPI.saveLists({
        lists: this.lists,
        sortOptions: {
          listSortMode: this.listSortMode,
          listSortAsc: this.listSortAsc,
          detailViewState: this.detailViewState,
          listSearchQuery: this.listSearchQuery,
        },
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
    }
  }

  /** Findet Liste rekursiv anhand der ID (durchsucht auch Unterlisten) */
  findListById(id: string): InventoryList | undefined {
    const walk = (lists: InventoryList[]): InventoryList | undefined => {
      for (const list of lists) {
        if (list.id === id) return list;
        if (list.sublists) {
          const found = walk(list.sublists);
          if (found) return found;
        }
      }
      return undefined;
    };
    return walk(this.lists);
  }

  findParentList(childId: string): InventoryList | null {
    const walk = (lists: InventoryList[]): InventoryList | null => {
      for (const list of lists) {
        if (list.sublists?.some(sub => sub.id === childId)) return list;
        if (list.sublists) {
          const found = walk(list.sublists);
          if (found) return found;
        }
      }
      return null;
    };
    return walk(this.lists);
  }

  /** Erstellt Breadcrumb-Pfad von Root bis zur Ziel-Liste */
  getListBreadcrumb(targetListId: string): { name: string; id: string; category?: string }[] {
    const path: { name: string; id: string; category?: string }[] = [];
    const walk = (lists: InventoryList[], id: string): boolean => {
      for (const l of lists) {
        if (l.id === id) {
          path.push({ name: l.name, id: l.id, category: l.category });
          return true;
        }
        if (l.sublists && walk(l.sublists, id)) {
          path.unshift({ name: l.name, id: l.id, category: l.category });
          return true;
        }
      }
      return false;
    };
    walk(this.lists, targetListId);
    return path;
  }

  getDetailViewState(listId: string): DetailViewStateEntry {
    const entry = this.detailViewState[listId];
    if (this.isDetailViewStateEntry(entry)) {
      return entry;
    }
    return {
      listViewMode: 'all',
      combinedSortMode: 'name',
      combinedSortAsc: true,
      combinedSearchQuery: '',
    };
  }

  setDetailViewState(listId: string, state: DetailViewStateEntry) {
    this.detailViewState[listId] = state;
    this.saveData();
  }

  persistListOverviewSort() {
    this.detailViewState['__listOverview__'] = {
      listSortMode: this.listSortMode,
      listSortAsc: this.listSortAsc,
    };
    this.saveData();
  }

  private isDetailViewStateEntry(entry: any): entry is DetailViewStateEntry {
    return entry && typeof entry.listViewMode === 'string' && typeof entry.combinedSortMode === 'string';
  }

  private isListOverviewStateEntry(entry: any): entry is ListOverviewStateEntry {
    return entry && typeof entry.listSortMode === 'string' && typeof entry.listSortAsc === 'boolean';
  }

  private normalizeLevels(lists: InventoryList[], level: number) {
    for (const list of lists) {
      list.level = level;
      if (list.sublists && list.sublists.length > 0) {
        this.normalizeLevels(list.sublists, level + 1);
      }
    }
  }
}
