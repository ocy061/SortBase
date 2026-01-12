import { InventoryList, InventoryItem } from '../models';
import { StateManager } from './stateManager';
import { SortUtils, FilterUtils, DataUtils } from './dataUtils';
import { DropdownManager } from './uiManager';
import { StyleInjector, Theme } from './theme';
import { ComponentBuilders } from './componentBuilders';
import { ImageHandler } from './imageHandler';
import { LIMITS, CHAR_LIMITS, UI_TEXT } from '../constants';

// Global tracker to ensure only one info tooltip is open at a time
let currentOpenTooltip: HTMLElement | null = null;

/**
 * Renderer-Klasse: Verantwortlich für das Rendern aller UI-Views
 * - Listen-Übersicht
 * - Listen-Detailansicht
 * - Artikel-Detailansicht
 * - Alle Dialoge (Erstellen, Bearbeiten, Löschen)
 */
export class Renderer {
  private state: StateManager;
  private dropdownManager: DropdownManager;

  /** Generiert eindeutige ID basierend auf aktuellem Timestamp */
  private static generateId(): string {
    return Date.now().toString();
  }

  /** Erstellt ISO-Zeitstempel für createdAt-Felder */
  private static createTimestamp(): string {
    return new Date().toISOString();
  }

  constructor(state: StateManager) {
    this.state = state;
    this.dropdownManager = new DropdownManager();
    StyleInjector.injectGlobalStyles();
  }

  /**
   * Hauptansicht: Zeigt alle Top-Level Listen
   * Enthält Suchleiste, Filteroptionen und Erstellen-Button
   */
  async renderListOverview() {
    document.body.innerHTML = `
      <div id="app">
        ${ComponentBuilders.createHeader('📝 SortBase', [])}
        <main class="main">
          ${ComponentBuilders.createSearchBar(
            'search-list',
            this.state.listSearchQuery,
            [
              { id: 'sort-name', label: '✏️ Name', data: 'name' },
              { id: 'sort-category', label: '🏷️ Kategorie', data: 'category' },
              { id: 'sort-date', label: '📅 Datum', data: 'createdAt' },
            ],
            this.state.listSortMode,
            this.state.listSortAsc,
          )}
          <div id="lists-container"></div>
        </main>
        ${ComponentBuilders.createFooter([
          { label: '➕ Neue Liste', id: 'create-list-btn', variant: 'success' as const },
        ])}
      </div>
    `;

    this.setupListOverviewEvents();
    await this.updateListsUI();
  }

  private setupListOverviewEvents() {
    const searchInput = document.getElementById('search-list') as HTMLInputElement;
    const filterBtn = document.getElementById('filter-btn') as HTMLButtonElement;
    const filterPopup = document.getElementById('filter-popup') as HTMLDivElement;
    const sortDirBtn = document.getElementById('sort-direction-btn') as HTMLButtonElement;
    const applyFiltersBtn = document.getElementById('apply-filters-btn') as HTMLButtonElement;
    const resetFiltersBtn = document.getElementById('reset-filters-btn') as HTMLButtonElement;
    const createListBtn = document.getElementById('create-list-btn') as HTMLButtonElement;

    let pendingSortMode = this.state.listSortMode;
    let pendingSortAsc = this.state.listSortAsc;

    const updateFilterUI = () => {
      document.querySelectorAll('.sort-option').forEach(btn => {
        const mode = (btn as HTMLElement).getAttribute('data-mode');
        (btn as HTMLElement).style.backgroundColor = mode === pendingSortMode ? Theme.colors.hover : '';
      });
      if (sortDirBtn) sortDirBtn.textContent = pendingSortAsc ? '↑ Aufsteigend' : '↓ Absteigend';
    };

    const applyFilters = async () => {
      this.state.listSortMode = pendingSortMode as any;
      this.state.listSortAsc = pendingSortAsc;
      this.state.persistListOverviewSort();
      await this.updateListsUI();
      updateFilterUI();
      if (filterPopup) filterPopup.style.display = 'none';
    };

    const resetFilters = async () => {
      pendingSortMode = 'name';
      pendingSortAsc = true;
      updateFilterUI();
      await applyFilters();
    };

    updateFilterUI();

    // Toggle filter popup
    filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!filterPopup) return;
      pendingSortMode = this.state.listSortMode;
      pendingSortAsc = this.state.listSortAsc;
      updateFilterUI();
      filterPopup.style.display = filterPopup.style.display === 'block' ? 'none' : 'block';
    });

    // Search
    searchInput?.addEventListener('input', async () => {
      this.state.listSearchQuery = searchInput.value.toLowerCase();
      await this.state.saveData();
      await this.updateListsUI();
    });

    // Sort options
    document.querySelectorAll('.sort-option').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const mode = (ev.target as HTMLElement).getAttribute('data-mode') as any;
        if (mode) {
          pendingSortMode = mode;
          updateFilterUI();
        }
      });
    });

    // Sort direction
    sortDirBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingSortAsc = !pendingSortAsc;
      updateFilterUI();
    });

    applyFiltersBtn?.addEventListener('click', async () => {
      await applyFilters();
    });

    resetFiltersBtn?.addEventListener('click', async () => {
      await resetFilters();
    });

    // Create list button
    createListBtn?.addEventListener('click', () => {
      if (filterPopup) filterPopup.style.display = 'none';
      this.showAddListDialog();
    });

    // Close popup on any click outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (filterPopup && !filterBtn?.contains(target) && !filterPopup.contains(target)) {
        filterPopup.style.display = 'none';
      }
    });
  }

  private async updateListsUI() {
    const container = document.getElementById('lists-container');
    if (!container) return;

    let filteredLists = FilterUtils.filterLists(this.state.lists, this.state.listSearchQuery);
    filteredLists = SortUtils.sortLists(filteredLists, this.state.listSortMode, this.state.listSortAsc);

    if (filteredLists.length === 0) {
      if (this.state.listSearchQuery) {
        container.innerHTML = ComponentBuilders.createEmptyState(
          '🔍',
          'Keine Treffer gefunden',
          `Keine Listen entsprechen der Suche "${this.state.listSearchQuery}".`
        );
      } else {
        container.innerHTML = ComponentBuilders.createEmptyState(
          '📭',
          'Keine Listen vorhanden',
          'Erstellen Sie eine neue Liste, um zu starten.'
        );
      }
      return;
    }

    container.innerHTML = '<div class="card-list" id="lists-grid"></div>';
    const grid = document.getElementById('lists-grid');

    filteredLists.forEach((list) => {
      const card = ComponentBuilders.createListCard(
        list,
        () => this.renderListDetail(list.id),
        () => this.showEditListDialog(list),
        () => this.showDeleteListConfirm(list),
      );
      grid?.appendChild(card);
    });
  }

  private showAddListDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Neue Liste erstellen</h2>
          <button type="button" id="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: ${Theme.colors.textSecondary}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; flex-shrink: 0;">✕</button>
        </div>
        <form id="inline-form" class="modal__content form">
          ${ImageHandler.createImageInput()}
          <div class="form-group">
            <label class="form-group__label">Listenname</label>
            <input id="list-name" type="text" placeholder="z.B. Meine Sammlung" required maxlength="${CHAR_LIMITS.NAME}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.NAME}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label">Kategorie</label>
            <input id="list-category" type="text" placeholder="z.B. Elektronik" maxlength="${CHAR_LIMITS.CATEGORY}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.CATEGORY}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Finanz-Werte
              <span id="info-financials" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Eingetragene Artikel mit Kaufpreis, aktuellem Wert bzw. Profit/Verlust werden automatisch summiert und in der Listen-Übersicht angezeigt. Diese Anzeige kann hier an/aus gestellt werden.</div>
            </label>
            <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm}; margin-top: ${Theme.spacing.xs};">
              <input id="list-hide-financials" type="checkbox" checked style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 0.95rem; color: ${Theme.colors.text};">Anzeige aktivieren</span>
            </div>
          </div>
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);
    ImageHandler.setupImagePreview('image-input');

    const form = dialog.querySelector('#inline-form') as HTMLFormElement;
    const cancelBtn = dialog.querySelector('#form-cancel') as HTMLButtonElement;
    const closeBtn = dialog.querySelector('#modal-close') as HTMLButtonElement;
    
    // Setup info tooltip
    const infoIcon = dialog.querySelector('#info-financials') as HTMLElement;
    const tooltip = dialog.querySelector('#info-tooltip') as HTMLElement;
    if (infoIcon && tooltip) {
      infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentOpenTooltip && currentOpenTooltip !== tooltip) {
          currentOpenTooltip.style.display = 'none';
        }
        const willOpen = tooltip.style.display === 'none';
        tooltip.style.display = willOpen ? 'block' : 'none';
        currentOpenTooltip = willOpen ? tooltip : null;
      });
      const closeTooltip = (e: MouseEvent) => {
        if (tooltip.style.display !== 'none' && !tooltip.contains(e.target as Node) && !infoIcon.contains(e.target as Node)) {
          tooltip.style.display = 'none';
          if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
        }
      };
      document.addEventListener('click', closeTooltip);
      const cleanup = () => {
        document.removeEventListener('click', closeTooltip);
        if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
      };
      cancelBtn.addEventListener('click', cleanup);
      closeBtn.addEventListener('click', cleanup);
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (dialog.querySelector('#list-name') as HTMLInputElement).value.trim();
      const category = (dialog.querySelector('#list-category') as HTMLInputElement).value.trim();
      const imageUrl = await ImageHandler.loadImageFromInput('image-input');
      if (!name) return;

      const newList: InventoryList = {
        id: Renderer.generateId(),
        name,
        category: category || undefined,
        imageUrl: imageUrl || undefined,
        createdAt: Renderer.createTimestamp(),
        items: [],
        sublists: [],
        level: 0,
      };

      this.state.lists.push(newList);
      await this.state.saveData();
      dialog.remove();
      await this.updateListsUI();
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
    closeBtn?.addEventListener('click', () => dialog.remove());
  }

  private showEditListDialog(list: InventoryList, onSaved?: () => Promise<void> | void) {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Liste bearbeiten</h2>
          <button type="button" id="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: ${Theme.colors.textSecondary}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; flex-shrink: 0;">✕</button>
        </div>
        <form id="inline-form" class="modal__content form">
          ${ImageHandler.createImageInput(list.imageUrl)}
          <div class="form-group">
            <label class="form-group__label">Listenname</label>
            <input id="list-name" type="text" value="${list.name}" required maxlength="${CHAR_LIMITS.NAME}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.NAME}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label">Kategorie</label>
            <input id="list-category" type="text" value="${list.category || ''}" maxlength="${CHAR_LIMITS.CATEGORY}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.CATEGORY}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Finanz-Werte
              <span id="info-financials" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Eingetragene Artikel mit Kaufpreis, aktuellem Wert bzw. Profit/Verlust werden automatisch summiert und in der Listen-Übersicht angezeigt. Diese Anzeige kann hier an/aus gestellt werden.</div>
            </label>
            <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm}; margin-top: ${Theme.spacing.xs};">
              <input id="list-hide-financials" type="checkbox" ${list.hideFinancials ? '' : 'checked'} style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 0.95rem; color: ${Theme.colors.text};">Anzeige aktivieren</span>
            </div>
          </div>
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);
    ImageHandler.setupImagePreview('image-input');

    const form = dialog.querySelector('#inline-form') as HTMLFormElement;
    const cancelBtn = dialog.querySelector('#form-cancel') as HTMLButtonElement;
    const closeBtn = dialog.querySelector('#modal-close') as HTMLButtonElement;
    const removeImageBtn = dialog.querySelector('#remove-image-btn') as HTMLButtonElement;

    let currentImage = list.imageUrl;
    
    // Setup info tooltip
    const infoIcon = dialog.querySelector('#info-financials') as HTMLElement;
    const tooltip = dialog.querySelector('#info-tooltip') as HTMLElement;
    if (infoIcon && tooltip) {
      infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentOpenTooltip && currentOpenTooltip !== tooltip) {
          currentOpenTooltip.style.display = 'none';
        }
        const willOpen = tooltip.style.display === 'none';
        tooltip.style.display = willOpen ? 'block' : 'none';
        currentOpenTooltip = willOpen ? tooltip : null;
      });
      const closeTooltip = (e: MouseEvent) => {
        if (tooltip.style.display !== 'none' && !tooltip.contains(e.target as Node) && !infoIcon.contains(e.target as Node)) {
          tooltip.style.display = 'none';
          if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
        }
      };
      document.addEventListener('click', closeTooltip);
      const cleanup = () => {
        document.removeEventListener('click', closeTooltip);
        if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
      };
      cancelBtn.addEventListener('click', cleanup);
      closeBtn.addEventListener('click', cleanup);
    }

    removeImageBtn?.addEventListener('click', () => {
      currentImage = undefined;
      const preview = dialog.querySelector('#image-preview') as HTMLDivElement;
      if (preview) preview.style.display = 'none';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      list.name = (dialog.querySelector('#list-name') as HTMLInputElement).value.trim();
      list.category = (dialog.querySelector('#list-category') as HTMLInputElement).value.trim() || undefined;
      list.hideFinancials = !(dialog.querySelector('#list-hide-financials') as HTMLInputElement).checked;
      
      const newImage = await ImageHandler.loadImageFromInput('image-input');
      list.imageUrl = newImage || currentImage || undefined;
      
      await this.state.saveData();
      dialog.remove();
      if (onSaved) {
        await onSaved();
      } else {
        await this.updateListsUI();
      }
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
    closeBtn?.addEventListener('click', () => dialog.remove());
  }

  private async showDeleteListConfirm(list: InventoryList) {
    const dialog = ComponentBuilders.createConfirmDialog(
      `Möchten Sie die Liste "${list.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      'Löschen',
      'Abbrechen'
    );

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('#dialog-confirm') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#dialog-cancel') as HTMLButtonElement;

    confirmBtn?.addEventListener('click', async () => {
      const idx = this.state.lists.findIndex(l => l.id === list.id);
      if (idx !== -1) {
        this.state.lists.splice(idx, 1);
        await this.state.saveData();
        dialog.remove();
        await this.updateListsUI();
      }
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
  }

  /**
   * Detailansicht einer Liste: Zeigt Unterlisten und Artikel
   * Unterstützt verschiedene Anzeigemodi (Alles, Nur Unterlisten, Nur Artikel)
   */
  async renderListDetail(listId: string) {
    const list = this.state.findListById(listId);
    if (!list) {
      await this.renderListOverview();
      return;
    }

    const parentList = this.state.findParentList(listId);
    const detailState = this.state.getDetailViewState(listId);
    const breadcrumb = this.state.getListBreadcrumb(listId);

    const backButtons = [{ label: '← Zurück zur Übersicht', id: 'back-overview', className: 'btn-secondary' }];
    if (parentList) {
      backButtons.unshift({ label: '← Eine Ebene zurück', id: 'back-parent', className: 'btn-secondary' });
    }

    document.body.innerHTML = `
      <div id="app">
        ${ComponentBuilders.createHeader(`📂 ${list.name}`, backButtons, list.category)}
        <main class="main">
          <div style="margin-bottom: ${Theme.spacing.lg};">
            ${ComponentBuilders.createBreadcrumb(breadcrumb.map((item, idx) => ({
              label: item.name,
              id: item.id,
            })))}
          </div>
          ${ComponentBuilders.createSearchBarWithViewMode(
            'search-items',
            detailState.combinedSearchQuery,
            [
              { id: 'sort-name', label: '✏️ Name', data: 'name' },
              { id: 'sort-date', label: '📅 Datum', data: 'createdAt' },
              { id: 'sort-price', label: '💵 Kaufpreis', data: 'purchasePrice' },
              { id: 'sort-value', label: '💰 Wert', data: 'currentValue' },
            ],
            detailState.combinedSortMode,
            detailState.combinedSortAsc,
            detailState.listViewMode,
            list.level! < LIMITS.MAX_NESTING_LEVEL,
          )}
          <div id="content-container"></div>
        </main>
        ${ComponentBuilders.createFooter([
          ...(list.level! < LIMITS.MAX_NESTING_LEVEL ? [{ label: '➕ Neue Unterliste', id: 'add-sublist-btn', variant: 'success' as const }] : []),
          { label: '➕ Neuer Artikel', id: 'add-item-btn', variant: 'success' as const },
        ])}
      </div>
    `;

    this.setupDetailViewEvents(list, listId, detailState);

    // Setup breadcrumb navigation
    document.querySelectorAll('.breadcrumb__item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetListId = (e.target as HTMLElement).getAttribute('data-list-id');
        if (targetListId) {
          this.renderListDetail(targetListId);
        }
      });
    });

    document.getElementById('back-overview')?.addEventListener('click', () => this.renderListOverview());
    if (parentList) {
      document.getElementById('back-parent')?.addEventListener('click', () => this.renderListDetail(parentList.id));
    }
  }

  private setupDetailViewEvents(list: InventoryList, listId: string, detailState: any) {
    const searchInput = document.getElementById('search-items') as HTMLInputElement;
    const filterBtn = document.getElementById('filter-btn') as HTMLButtonElement;
    const filterPopup = document.getElementById('filter-popup') as HTMLDivElement;
    const sortDirBtn = document.getElementById('sort-direction-btn') as HTMLButtonElement;
    const applyFiltersBtn = document.getElementById('apply-filters-btn') as HTMLButtonElement;
    const resetFiltersBtn = document.getElementById('reset-filters-btn') as HTMLButtonElement;

    let currentViewMode = detailState.listViewMode;
    let currentSortMode = detailState.combinedSortMode;
    let currentSortAsc = detailState.combinedSortAsc;
    let currentSearch = detailState.combinedSearchQuery;

    let pendingViewMode = currentViewMode;
    let pendingSortMode = currentSortMode;
    let pendingSortAsc = currentSortAsc;

    const updateFilterUI = () => {
      document.querySelectorAll('.sort-option').forEach(btn => {
        const mode = (btn as HTMLElement).getAttribute('data-mode');
        (btn as HTMLElement).style.backgroundColor = mode === pendingSortMode ? Theme.colors.hover : '';
      });
      document.querySelectorAll('.view-mode-option').forEach(btn => {
        const mode = (btn as HTMLElement).getAttribute('data-mode');
        (btn as HTMLElement).style.backgroundColor = mode === pendingViewMode ? Theme.colors.hover : '';
      });
      if (sortDirBtn) sortDirBtn.textContent = pendingSortAsc ? '↑ Aufsteigend' : '↓ Absteigend';
    };

    const persistAndRender = () => {
      this.state.setDetailViewState(listId, {
        listViewMode: currentViewMode,
        combinedSortMode: currentSortMode,
        combinedSortAsc: currentSortAsc,
        combinedSearchQuery: currentSearch,
      });
      this.renderContentSections(list, listId, currentViewMode, currentSortMode, currentSortAsc, currentSearch);
    };

    const applyFilters = () => {
      currentViewMode = pendingViewMode;
      currentSortMode = pendingSortMode;
      currentSortAsc = pendingSortAsc;
      persistAndRender();
      if (filterPopup) filterPopup.style.display = 'none';
    };

    const resetFilters = () => {
      pendingViewMode = 'all';
      pendingSortMode = 'name';
      pendingSortAsc = true;
      updateFilterUI();
      currentViewMode = pendingViewMode;
      currentSortMode = pendingSortMode;
      currentSortAsc = pendingSortAsc;
      persistAndRender();
      if (filterPopup) filterPopup.style.display = 'none';
    };

    updateFilterUI();

    // Toggle filter popup
    filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!filterPopup) return;
      pendingViewMode = currentViewMode;
      pendingSortMode = currentSortMode;
      pendingSortAsc = currentSortAsc;
      updateFilterUI();
      filterPopup.style.display = filterPopup.style.display === 'block' ? 'none' : 'block';
    });

    // Search
    searchInput?.addEventListener('input', async () => {
      currentSearch = searchInput.value.toLowerCase();
      this.state.setDetailViewState(listId, {
        listViewMode: currentViewMode,
        combinedSortMode: currentSortMode,
        combinedSortAsc: currentSortAsc,
        combinedSearchQuery: currentSearch,
      });
      this.renderContentSections(list, listId, currentViewMode, currentSortMode, currentSortAsc, currentSearch);
    });

    // View mode options inside filter popup
    document.querySelectorAll('.view-mode-option').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const mode = (ev.target as HTMLElement).getAttribute('data-mode') as any;
        if (mode) {
          pendingViewMode = mode;
          updateFilterUI();
        }
      });
    });

    // Sort options inside filter popup
    document.querySelectorAll('.sort-option').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const mode = (ev.target as HTMLElement).getAttribute('data-mode') as any;
        if (mode) {
          pendingSortMode = mode;
          updateFilterUI();
        }
      });
    });

    document.getElementById('sort-direction-btn')?.addEventListener('click', () => {
      pendingSortAsc = !pendingSortAsc;
      updateFilterUI();
    });

    applyFiltersBtn?.addEventListener('click', () => {
      applyFilters();
    });

    resetFiltersBtn?.addEventListener('click', () => {
      resetFilters();
    });

    // Add buttons
    document.getElementById('add-sublist-btn')?.addEventListener('click', () => {
      if (filterPopup) filterPopup.style.display = 'none';
      this.showAddSublistDialog(list);
    });
    document.getElementById('add-item-btn')?.addEventListener('click', () => {
      if (filterPopup) filterPopup.style.display = 'none';
      this.showAddItemDialog(list, listId);
    });

    // Close popup on outside click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (filterPopup && !filterBtn?.contains(target) && !filterPopup.contains(target)) {
        filterPopup.style.display = 'none';
      }
    });

    // Initial render
    this.renderContentSections(list, listId, currentViewMode, currentSortMode, currentSortAsc, currentSearch);
  }

  /**
   * Rendert Unterlisten und Artikel basierend auf aktuellen Filter-Einstellungen
   * Zeigt passende Empty-States wenn keine Ergebnisse vorhanden
   */
  private renderContentSections(
    list: InventoryList,
    listId: string,
    viewMode: string,
    sortMode: string,
    sortAsc: boolean,
    searchQuery: string
  ) {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = '';
    const currentLevel = list.level ?? 0;

    let hasSublistsToShow = false;
    let hasItemsToShow = false;
    let filteredSublistsCount = 0;
    let filteredItemsCount = 0;

    // === UNTERLISTEN-SEKTION ===
    // Zeige Unterlisten nur wenn: ViewMode erlaubt, Level-Limit nicht erreicht, und Unterlisten vorhanden
    if ((viewMode === 'all' || viewMode === 'sublists') && currentLevel < LIMITS.MAX_NESTING_LEVEL && list.sublists?.length) {
      const sublistsDiv = document.createElement('div');
      sublistsDiv.innerHTML = `<h3 style="margin-top: ${Theme.spacing.lg};">📁 Unterlisten</h3>`;
      const sublistsContainer = document.createElement('div');
      sublistsContainer.className = 'card-list';

      let sublists = [...(list.sublists || [])];
      sublists = FilterUtils.filterLists(sublists, searchQuery);
      filteredSublistsCount = sublists.length;
      sublists = SortUtils.sortLists(sublists, sortMode as any, sortAsc);

      if (sublists.length > 0) {
        hasSublistsToShow = true;
        sublists.forEach(sublist => {
          const card = ComponentBuilders.createListCard(
            sublist,
            () => this.renderListDetail(sublist.id),
            () => this.showEditListDialog(sublist, () => this.renderListDetail(list.id)),
            () => this.showDeleteSublistConfirm(list, sublist),
          );
          sublistsContainer.appendChild(card);
        });

        sublistsDiv.appendChild(sublistsContainer);
        container.appendChild(sublistsDiv);
      }
    }

    // === ARTIKEL-SEKTION ===
    // Zeige horizontale Trennlinie wenn beide Sektionen sichtbar sind
    if ((viewMode === 'all' || viewMode === 'items') && list.items?.length) {
      const itemsDiv = document.createElement('div');
      itemsDiv.innerHTML = `
        ${hasSublistsToShow ? `<hr style="border: none; border-top: 2px solid ${Theme.colors.border}; margin: ${Theme.spacing.xl} 0;">` : ''}
        <h3 style="margin-top: ${Theme.spacing.lg};">📦 Artikel</h3>
      `;
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'card-list';

      let items = [...list.items];
      items = FilterUtils.filterItems(items, searchQuery);
      filteredItemsCount = items.length;
      items = SortUtils.sortItems(items, sortMode as any, sortAsc);

      if (items.length > 0) {
        hasItemsToShow = true;
        items.forEach(item => {
          const card = ComponentBuilders.createItemCard(
            item,
            () => this.renderItemDetail(listId, item.id),
            () => this.showEditItemDialog(list, item, listId),
            () => this.showDeleteItemConfirm(list, item, listId),
          );
          itemsContainer.appendChild(card);
        });

        itemsDiv.appendChild(itemsContainer);
        container.appendChild(itemsDiv);
      }
    }

    // === EMPTY STATES ===
    // Zeige passende Meldung wenn keine Ergebnisse vorhanden
    if (!hasSublistsToShow && !hasItemsToShow) {
      if (searchQuery && (list.sublists?.length || list.items?.length)) {
        container.innerHTML = ComponentBuilders.createEmptyState(
          '🔍',
          'Keine Treffer gefunden',
          `Keine Inhalte entsprechen der Suche "${searchQuery}".`
        );
      } else if (!list.sublists?.length && !list.items?.length) {
        container.innerHTML = ComponentBuilders.createEmptyState(
          '📭',
          'Keine Inhalte vorhanden',
          'Fügen Sie Unterlisten oder Artikel hinzu, um zu starten.'
        );
      }
    }
  }

  private showAddSublistDialog(list: InventoryList) {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Neue Unterliste erstellen</h2>
          <button type="button" id="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: ${Theme.colors.textSecondary}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; flex-shrink: 0;">✕</button>
        </div>
        <form id="inline-form" class="modal__content form">
          ${ImageHandler.createImageInput()}
          <div class="form-group">
            <label class="form-group__label">Name</label>
            <input id="sublist-name" type="text" required maxlength="${CHAR_LIMITS.NAME}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.NAME}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label">Kategorie</label>
            <input id="sublist-category" type="text" maxlength="${CHAR_LIMITS.CATEGORY}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.CATEGORY}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Finanz-Werte
              <span id="info-financials" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Eingetragene Artikel mit Kaufpreis, aktuellem Wert bzw. Profit/Verlust werden automatisch summiert und in der Listen-Übersicht angezeigt. Diese Anzeige kann hier an/aus gestellt werden.</div>
            </label>
            <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm}; margin-top: ${Theme.spacing.xs};">
              <input id="sublist-hide-financials" type="checkbox" checked style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 0.95rem; color: ${Theme.colors.text};">Anzeige aktivieren</span>
            </div>
          </div>
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);
    ImageHandler.setupImagePreview('image-input');

    const form = dialog.querySelector('#inline-form') as HTMLFormElement;
    const cancelBtn = dialog.querySelector('#form-cancel') as HTMLButtonElement;
    const closeBtn = dialog.querySelector('#modal-close') as HTMLButtonElement;
    
    // Setup info tooltip
    const infoIcon = dialog.querySelector('#info-financials') as HTMLElement;
    const tooltip = dialog.querySelector('#info-tooltip') as HTMLElement;
    if (infoIcon && tooltip) {
      infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentOpenTooltip && currentOpenTooltip !== tooltip) {
          currentOpenTooltip.style.display = 'none';
        }
        const willOpen = tooltip.style.display === 'none';
        tooltip.style.display = willOpen ? 'block' : 'none';
        currentOpenTooltip = willOpen ? tooltip : null;
      });
      const closeTooltip = (e: MouseEvent) => {
        if (tooltip.style.display !== 'none' && !tooltip.contains(e.target as Node) && !infoIcon.contains(e.target as Node)) {
          tooltip.style.display = 'none';
          if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
        }
      };
      document.addEventListener('click', closeTooltip);
      const cleanup = () => {
        document.removeEventListener('click', closeTooltip);
        if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
      };
      cancelBtn.addEventListener('click', cleanup);
      closeBtn.addEventListener('click', cleanup);
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (dialog.querySelector('#sublist-name') as HTMLInputElement).value.trim();
      const category = (dialog.querySelector('#sublist-category') as HTMLInputElement).value.trim();
      const hideFinancials = (dialog.querySelector('#sublist-hide-financials') as HTMLInputElement).checked;
      const imageUrl = await ImageHandler.loadImageFromInput('image-input');

      const newSublist: InventoryList = {
        id: Renderer.generateId(),
        name,
        category: category || undefined,
        imageUrl: imageUrl || undefined,
        createdAt: Renderer.createTimestamp(),
        items: [],
        sublists: [],
        level: (list.level ?? 0) + 1,
        hideFinancials: hideFinancials ? true : undefined,
      };

      if (!list.sublists) list.sublists = [];
      list.sublists.push(newSublist);
      await this.state.saveData();
      dialog.remove();
      await this.renderListDetail(list.id);
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
    closeBtn?.addEventListener('click', () => dialog.remove());
  }

  private showAddItemDialog(list: InventoryList, listId: string) {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Neuen Artikel hinzufügen</h2>
          <button type="button" id="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: ${Theme.colors.textSecondary}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; flex-shrink: 0;">✕</button>
        </div>
        <form id="inline-form" class="modal__content form">
          ${ImageHandler.createMultiImageGallery()}
          <div class="form-group">
            <label class="form-group__label">Artikelname</label>
            <input id="item-name" type="text" required maxlength="${CHAR_LIMITS.NAME}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.NAME}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Kaufpreis in €
              <span id="info-purchase" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-purchase-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Falls Kaufpreis und aktueller Wert angegeben werden, wird automatisch Profit/Verlust berechnet und angezeigt.</div>
            </label>
            <input id="item-purchase" type="number" step="0.01" max="9999999999999.99" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.OPTIONAL}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Aktueller Wert in €
              <span id="info-value" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-value-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Falls Kaufpreis und aktueller Wert angegeben werden, wird automatisch Profit/Verlust berechnet und angezeigt.</div>
            </label>
            <input id="item-value" type="number" step="0.01" max="9999999999999.99" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.OPTIONAL}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Finanz-Werte
              <span id="info-financials" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Kaufpreis, aktueller Wert bzw. Profit/Verlust werden in der Listen-Übersicht angezeigt. Diese Anzeige kann hier an/aus gestellt werden.</div>
            </label>
            <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm}; margin-top: ${Theme.spacing.xs};">
              <input id="item-hide-financials" type="checkbox" checked style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 0.95rem; color: ${Theme.colors.text};">Anzeige aktivieren</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-group__label">Eigene Eigenschaften</label>
            <div id="properties-container" style="display: flex; flex-direction: column; gap: ${Theme.spacing.xs};"></div>
            <button type="button" id="add-property-btn" class="btn-secondary btn-sm" style="margin-top: ${Theme.spacing.sm};">➕ Eigenschaft hinzufügen</button>
          </div>
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);

    const form = dialog.querySelector('#inline-form') as HTMLFormElement;
    const cancelBtn = dialog.querySelector('#form-cancel') as HTMLButtonElement;
    const closeBtn = dialog.querySelector('#modal-close') as HTMLButtonElement;
    const addPropertyBtn = dialog.querySelector('#add-property-btn') as HTMLButtonElement;
    const propertiesContainer = dialog.querySelector('#properties-container') as HTMLDivElement;
    
    // Setup info tooltips
    const setupInfoTooltip = (iconId: string, tooltipId: string) => {
      const icon = dialog.querySelector(`#${iconId}`) as HTMLElement;
      const tooltip = dialog.querySelector(`#${tooltipId}`) as HTMLElement;
      if (icon && tooltip) {
        icon.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentOpenTooltip && currentOpenTooltip !== tooltip) {
            currentOpenTooltip.style.display = 'none';
          }
          const willOpen = tooltip.style.display === 'none';
          tooltip.style.display = willOpen ? 'block' : 'none';
          currentOpenTooltip = willOpen ? tooltip : null;
        });
        const closeTooltip = (e: MouseEvent) => {
          if (tooltip.style.display !== 'none' && !tooltip.contains(e.target as Node) && !icon.contains(e.target as Node)) {
            tooltip.style.display = 'none';
            if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
          }
        };
        document.addEventListener('click', closeTooltip);
        const cleanup = () => {
          document.removeEventListener('click', closeTooltip);
          if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
        };
        cancelBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);
      }
    };
    
    setupInfoTooltip('info-purchase', 'info-purchase-tooltip');
    setupInfoTooltip('info-value', 'info-value-tooltip');
    setupInfoTooltip('info-financials', 'info-tooltip');

    // Setup multi-image gallery with callback to track changes
    let imageUrls: string[] = [];
    imageUrls = ImageHandler.setupMultiImageGallery(imageUrls, (images) => {
      imageUrls = images;
    });

    let propertyIndex = 0;

    const addPropertyRow = (key: string = '', value: string = '') => {
      const row = document.createElement('div');
      row.style.cssText = `display: flex; gap: ${Theme.spacing.xs}; align-items: center;`;
      row.innerHTML = `
        <input type="text" placeholder="Eigenschaft" value="${key}" class="prop-key" style="flex: 1; padding: 8px; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.sm};" maxlength="${CHAR_LIMITS.PROPERTY_KEY}" />
        <input type="text" placeholder="Wert" value="${value}" class="prop-value" style="flex: 2; padding: 8px; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.sm};" maxlength="${CHAR_LIMITS.PROPERTY_VALUE}" />
        <button type="button" class="btn-danger btn-sm remove-prop-btn">🗑️</button>
      `;
      propertiesContainer.appendChild(row);
      row.querySelector('.remove-prop-btn')?.addEventListener('click', () => {
        row.remove();
        updateAddPropertyButtonState();
      });
      propertyIndex++;
    };

    const updateAddPropertyButtonState = () => {
      const propertyCount = propertiesContainer.querySelectorAll('div').length;
      if (addPropertyBtn) {
        if (propertyCount >= LIMITS.MAX_PROPERTIES_PER_ITEM) {
          addPropertyBtn.disabled = true;
          addPropertyBtn.style.opacity = '0.5';
          addPropertyBtn.style.cursor = 'not-allowed';
          addPropertyBtn.title = UI_TEXT.ALERTS.MAX_PROPERTIES;
        } else {
          addPropertyBtn.disabled = false;
          addPropertyBtn.style.opacity = '1';
          addPropertyBtn.style.cursor = 'pointer';
          addPropertyBtn.title = '';
        }
      }
    };

    addPropertyBtn?.addEventListener('click', () => {
      const propertyCount = propertiesContainer.querySelectorAll('div').length;
      if (propertyCount >= LIMITS.MAX_PROPERTIES_PER_ITEM) {
        alert(UI_TEXT.ALERTS.MAX_PROPERTIES);
        return;
      }
      addPropertyRow();
      updateAddPropertyButtonState();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (dialog.querySelector('#item-name') as HTMLInputElement).value.trim();
      const purchasePrice = parseFloat((dialog.querySelector('#item-purchase') as HTMLInputElement).value) || NaN;
      const currentValue = parseFloat((dialog.querySelector('#item-value') as HTMLInputElement).value) || NaN;

      const properties: Record<string, string | number> = {};
      propertiesContainer.querySelectorAll('div').forEach(row => {
        const key = (row.querySelector('.prop-key') as HTMLInputElement)?.value.trim();
        const value = (row.querySelector('.prop-value') as HTMLInputElement)?.value.trim();
        if (key) {
          const numValue = parseFloat(value);
          properties[key] = !isNaN(numValue) ? numValue : value;
        }
      });

      const newItem: InventoryItem = {
        id: Renderer.generateId(),
        name,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        purchasePrice,
        currentValue,
        createdAt: Renderer.createTimestamp(),
        properties: Object.keys(properties).length > 0 ? properties : undefined,
      };

      list.items.push(newItem);
      await this.state.saveData();
      dialog.remove();
      await this.renderListDetail(listId);
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
    closeBtn?.addEventListener('click', () => dialog.remove());
  }

  private showEditItemDialog(list: InventoryList, item: InventoryItem, listId: string, afterSave?: () => void) {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Artikel bearbeiten</h2>
          <button type="button" id="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: ${Theme.colors.textSecondary}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; flex-shrink: 0;">✕</button>
        </div>
        <form id="inline-form" class="modal__content form">
          ${ImageHandler.createMultiImageGallery(item.imageUrls || [])}
          <div class="form-group">
            <label class="form-group__label">Artikelname</label>
            <input id="item-name" type="text" value="${item.name}" required maxlength="${CHAR_LIMITS.NAME}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.NAME}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Kaufpreis in €
              <span id="info-purchase" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-purchase-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Falls Kaufpreis und aktueller Wert angegeben werden, wird automatisch Profit/Verlust berechnet und angezeigt.</div>
            </label>
            <input id="item-purchase" type="number" step="0.01" max="9999999999999.99" value="${(typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice)) ? item.purchasePrice : ''}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.OPTIONAL}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Aktueller Wert in €
              <span id="info-value" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-value-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Falls Kaufpreis und aktueller Wert angegeben werden, wird automatisch Profit/Verlust berechnet und angezeigt.</div>
            </label>
            <input id="item-value" type="number" step="0.01" max="9999999999999.99" value="${(typeof item.currentValue === 'number' && !isNaN(item.currentValue)) ? item.currentValue : ''}" class="form-group__input" />
            <div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${UI_TEXT.FIELD_HINTS.OPTIONAL}</div>
          </div>
          <div class="form-group">
            <label class="form-group__label" style="display: inline-flex; align-items: center; gap: ${Theme.spacing.xs}; position: relative;">
              Finanz-Werte
              <span id="info-financials" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #999; color: #999; font-size: 11px; font-weight: bold; cursor: pointer; user-select: none;">i</span>
              <div id="info-tooltip" style="display: none; position: absolute; top: 100%; left: 0; margin-top: 4px; background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.sm}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px; z-index: 10000; font-size: 0.85rem; font-weight: normal; color: ${Theme.colors.text};">Kaufpreis, aktueller Wert bzw. Profit/Verlust werden in der Listen-Übersicht angezeigt. Diese Anzeige kann hier an/aus gestellt werden.</div>
            </label>
            <div style="display: flex; align-items: center; gap: ${Theme.spacing.sm}; margin-top: ${Theme.spacing.xs};">
              <input id="item-hide-financials" type="checkbox" ${item.hideFinancials ? '' : 'checked'} style="width: 18px; height: 18px; cursor: pointer;" />
              <span style="font-size: 0.95rem; color: ${Theme.colors.text};">Anzeige aktivieren</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-group__label">Eigene Eigenschaften</label>
            <div id="properties-container" style="display: flex; flex-direction: column; gap: ${Theme.spacing.xs};"></div>
            <button type="button" id="add-property-btn" class="btn-secondary btn-sm" style="margin-top: ${Theme.spacing.sm};">➕ Eigenschaft hinzufügen</button>
          </div>
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);

    const form = dialog.querySelector('#inline-form') as HTMLFormElement;
    const cancelBtn = dialog.querySelector('#form-cancel') as HTMLButtonElement;
    const closeBtn = dialog.querySelector('#modal-close') as HTMLButtonElement;
    const addPropertyBtn = dialog.querySelector('#add-property-btn') as HTMLButtonElement;
    const propertiesContainer = dialog.querySelector('#properties-container') as HTMLDivElement;
    
    // Setup info tooltips
    const setupInfoTooltip = (iconId: string, tooltipId: string) => {
      const icon = dialog.querySelector(`#${iconId}`) as HTMLElement;
      const tooltip = dialog.querySelector(`#${tooltipId}`) as HTMLElement;
      if (icon && tooltip) {
        icon.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentOpenTooltip && currentOpenTooltip !== tooltip) {
            currentOpenTooltip.style.display = 'none';
          }
          const willOpen = tooltip.style.display === 'none';
          tooltip.style.display = willOpen ? 'block' : 'none';
          currentOpenTooltip = willOpen ? tooltip : null;
        });
        const closeTooltip = (e: MouseEvent) => {
          if (tooltip.style.display !== 'none' && !tooltip.contains(e.target as Node) && !icon.contains(e.target as Node)) {
            tooltip.style.display = 'none';
            if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
          }
        };
        document.addEventListener('click', closeTooltip);
        const cleanup = () => {
          document.removeEventListener('click', closeTooltip);
          if (currentOpenTooltip === tooltip) currentOpenTooltip = null;
        };
        cancelBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);
      }
    };
    
    setupInfoTooltip('info-purchase', 'info-purchase-tooltip');
    setupInfoTooltip('info-value', 'info-value-tooltip');
    setupInfoTooltip('info-financials', 'info-tooltip');

    // Setup multi-image gallery with existing images and callback
    let imageUrls: string[] = item.imageUrls || [];
    imageUrls = ImageHandler.setupMultiImageGallery(imageUrls, (images) => {
      imageUrls = images;
    });

    let propertyIndex = 0;

    const addPropertyRow = (key: string = '', value: string = '') => {
      const row = document.createElement('div');
      row.style.cssText = `display: flex; gap: ${Theme.spacing.xs}; align-items: center;`;
      row.innerHTML = `
        <input type="text" placeholder="Eigenschaft" value="${key}" class="prop-key" style="flex: 1; padding: 8px; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.sm};" maxlength="${CHAR_LIMITS.PROPERTY_KEY}" />
        <input type="text" placeholder="Wert" value="${value}" class="prop-value" style="flex: 2; padding: 8px; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.sm};" maxlength="${CHAR_LIMITS.PROPERTY_VALUE}" />
        <button type="button" class="btn-danger btn-sm remove-prop-btn">🗑️</button>
      `;
      propertiesContainer.appendChild(row);
      row.querySelector('.remove-prop-btn')?.addEventListener('click', () => {
        row.remove();
        updateAddPropertyButtonState();
      });
      propertyIndex++;
    };

    const updateAddPropertyButtonState = () => {
      const propertyCount = propertiesContainer.querySelectorAll('div').length;
      if (addPropertyBtn) {
        if (propertyCount >= LIMITS.MAX_PROPERTIES_PER_ITEM) {
          addPropertyBtn.disabled = true;
          addPropertyBtn.style.opacity = '0.5';
          addPropertyBtn.style.cursor = 'not-allowed';
          addPropertyBtn.title = UI_TEXT.ALERTS.MAX_PROPERTIES;
        } else {
          addPropertyBtn.disabled = false;
          addPropertyBtn.style.opacity = '1';
          addPropertyBtn.style.cursor = 'pointer';
          addPropertyBtn.title = '';
        }
      }
    };

    // Load existing properties
    if (item.properties) {
      Object.entries(item.properties).forEach(([key, value]) => {
        addPropertyRow(key, String(value));
      });
    }

    updateAddPropertyButtonState();

    addPropertyBtn?.addEventListener('click', () => {
      const propertyCount = propertiesContainer.querySelectorAll('div').length;
      if (propertyCount >= LIMITS.MAX_PROPERTIES_PER_ITEM) {
        alert(UI_TEXT.ALERTS.MAX_PROPERTIES);
        return;
      }
      addPropertyRow();
      updateAddPropertyButtonState();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      item.name = (dialog.querySelector('#item-name') as HTMLInputElement).value.trim();
      item.purchasePrice = parseFloat((dialog.querySelector('#item-purchase') as HTMLInputElement).value) || NaN;
      item.currentValue = parseFloat((dialog.querySelector('#item-value') as HTMLInputElement).value) || NaN;
      item.hideFinancials = !(dialog.querySelector('#item-hide-financials') as HTMLInputElement).checked;

      const properties: Record<string, string | number> = {};
      propertiesContainer.querySelectorAll('div').forEach(row => {
        const key = (row.querySelector('.prop-key') as HTMLInputElement)?.value.trim();
        const value = (row.querySelector('.prop-value') as HTMLInputElement)?.value.trim();
        if (key) {
          const numValue = parseFloat(value);
          properties[key] = !isNaN(numValue) ? numValue : value;
        }
      });

      item.properties = Object.keys(properties).length > 0 ? properties : undefined;
      item.imageUrls = imageUrls.length > 0 ? imageUrls : undefined;

      await this.state.saveData();
      dialog.remove();
      if (afterSave) {
        afterSave();
      } else {
        await this.renderListDetail(listId);
      }
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
    closeBtn?.addEventListener('click', () => dialog.remove());
  }

  private async showDeleteSublistConfirm(parentList: InventoryList, sublist: InventoryList) {
    const dialog = ComponentBuilders.createConfirmDialog(
      `Möchten Sie die Unterliste "${sublist.name}" wirklich löschen?`,
      'Löschen',
      'Abbrechen'
    );

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('#dialog-confirm') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#dialog-cancel') as HTMLButtonElement;

    confirmBtn?.addEventListener('click', async () => {
      const idx = parentList.sublists?.findIndex(s => s.id === sublist.id) ?? -1;
      if (idx !== -1 && parentList.sublists) {
        parentList.sublists.splice(idx, 1);
        await this.state.saveData();
        dialog.remove();
        await this.renderListDetail(parentList.id);
      }
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
  }

  private async showDeleteItemConfirm(list: InventoryList, item: InventoryItem, listId: string) {
    const dialog = ComponentBuilders.createConfirmDialog(
      `Möchten Sie den Artikel "${item.name}" wirklich löschen?`,
      'Löschen',
      'Abbrechen'
    );

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('#dialog-confirm') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#dialog-cancel') as HTMLButtonElement;

    confirmBtn?.addEventListener('click', async () => {
      const idx = list.items.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        list.items.splice(idx, 1);
        await this.state.saveData();
        dialog.remove();
        await this.renderListDetail(listId);
      }
    });

    cancelBtn?.addEventListener('click', () => dialog.remove());
  }

  /**
   * Artikel-Detailansicht: Zeigt alle Details eines Artikels
   * Ermöglicht Navigation zwischen Artikeln (Vorheriger/Nächster)
   */
  async renderItemDetail(listId: string, itemId: string) {
    const list = this.state.findListById(listId);
    if (!list) return;
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    const breadcrumb = this.state.getListBreadcrumb(listId);
    const profit = DataUtils.calculateProfit(item.purchasePrice, item.currentValue);
    const hasPurchase = typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice);
    const hasValue = typeof item.currentValue === 'number' && !isNaN(item.currentValue);
    const profitLabel = profit > 0 ? 'Gewinn' : profit < 0 ? 'Verlust' : 'Gewinn/Verlust';
    
    // === NAVIGATION ZWISCHEN ARTIKELN ===
    // Wende gleiche Filter/Sortierung an wie in Listenansicht für konsistente Reihenfolge
    const detailState = this.state.getDetailViewState(listId);
    
    let visibleItems = [...list.items];
    visibleItems = FilterUtils.filterItems(visibleItems, detailState.combinedSearchQuery);
    visibleItems = SortUtils.sortItems(visibleItems, detailState.combinedSortMode as any, detailState.combinedSortAsc);
    
    // Bestimme Position des aktuellen Artikels für Vor/Zurück-Navigation
    const currentIndex = visibleItems.findIndex(i => i.id === itemId);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < visibleItems.length - 1;
    const previousItem = hasPrevious ? visibleItems[currentIndex - 1] : null;
    const nextItem = hasNext ? visibleItems[currentIndex + 1] : null;

    document.body.innerHTML = `
      <div id="app">
        ${ComponentBuilders.createHeader(`📦 ${item.name}`, [
          { label: '← Zurück zur Liste', id: 'back-list', className: 'btn-secondary' },
        ])}
        <main class="main">
          <div style="margin-bottom: ${Theme.spacing.lg};">
            ${ComponentBuilders.createBreadcrumb(
              breadcrumb.map((i, idx) => ({
                label: i.name,
                id: i.id,
              }))
            )}
          </div>

          <div class="card" style="max-width: 900px; margin: 0 auto;">
            <div style="display: grid; gap: ${Theme.spacing.md};">
              ${item.imageUrls && item.imageUrls.length > 0 ? `
                <div style="width: 100%; border-radius: ${Theme.borderRadius.md}; overflow-x: auto; overflow-y: hidden; max-height: 400px; background: ${Theme.colors.background}; display: flex; align-items: center; gap: ${Theme.spacing.sm}; padding: ${Theme.spacing.xs}; padding-left: calc((100% - 350px) / 2);">
                  ${item.imageUrls.map((url, idx) => `
                    <img src="${url}" alt="Bild ${idx + 1}" style="width: 350px; height: 380px; object-fit: contain; flex-shrink: 0; border-radius: ${Theme.borderRadius.sm};" />
                  `).join('')}
                </div>
              ` : ''}
              <div style="display:flex; justify-content: space-between; align-items: center;">
                <div><strong>Name:</strong> ${item.name}</div>
                <button id="edit-item-btn" class="btn-secondary btn-sm">⚙️ Bearbeiten</button>
              </div>
              ${!item.hideFinancials && hasPurchase ? `
                <div>
                  <strong>Kaufpreis:</strong> ${DataUtils.formatCurrency(item.purchasePrice)}
                </div>
              ` : ''}
              ${!item.hideFinancials && hasValue ? `
                <div>
                  <strong>Aktueller Wert:</strong> ${DataUtils.formatCurrency(item.currentValue)}
                </div>
              ` : ''}
              ${!item.hideFinancials && !isNaN(profit) ? `
                <div>
                  <strong>${profitLabel}:</strong>
                  <span style="font-weight: 600; color: ${profit > 0 ? Theme.colors.success : profit < 0 ? Theme.colors.danger : Theme.colors.textSecondary};">
                    ${profit > 0 ? '+' : ''}${DataUtils.formatCurrency(profit)}
                  </span>
                </div>
              ` : ''}
              ${item.properties && Object.keys(item.properties).length > 0 ? `
                ${Object.entries(item.properties).map(([key, value]) => `
                  <div><strong>${key}:</strong> ${value}</div>
                `).join('')}
              ` : ''}
              <div>
                <strong>Erstellt am:</strong> ${new Date(item.createdAt).toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        </main>
        <footer class="footer">
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 100%;">
            <div>
              ${hasPrevious ? `<button id="prev-item-btn" class="btn-secondary">← Vorheriger Artikel</button>` : ''}
            </div>
            <div>
              ${hasNext ? `<button id="next-item-btn" class="btn-secondary">Nächster Artikel →</button>` : ''}
            </div>
          </div>
        </footer>
      </div>
    `;
    // Setup breadcrumb navigation
    document.querySelectorAll('.breadcrumb__item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetListId = (e.target as HTMLElement).getAttribute('data-list-id');
        if (targetListId) {
          this.renderListDetail(targetListId);
        }
      });
    });
    document.getElementById('back-list')?.addEventListener('click', () => this.renderListDetail(listId));
    // Wire edit button to open edit dialog
    document.getElementById('edit-item-btn')?.addEventListener('click', () => {
      this.showEditItemDialog(list!, item!, listId, () => this.renderItemDetail(listId, itemId));
    });
    
    // Wire navigation buttons
    document.getElementById('prev-item-btn')?.addEventListener('click', () => {
      if (previousItem) {
        this.renderItemDetail(listId, previousItem.id);
      }
    });
    document.getElementById('next-item-btn')?.addEventListener('click', () => {
      if (nextItem) {
        this.renderItemDetail(listId, nextItem.id);
      }
    });
  }

  private getSortLabel(mode: string): string {
    const labels: Record<string, string> = {
      name: 'Name ✏️',
      category: 'Kategorie 🏷️',
      createdAt: 'Datum 📅',
      purchasePrice: 'Kaufpreis 💵',
      currentValue: 'Wert 💰',
    };
    return labels[mode] || 'Name ✏️';
  }
}
