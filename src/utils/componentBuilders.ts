import { Theme } from './theme';
import { DataUtils } from './dataUtils';

/**
 * ComponentBuilders: Zentralisierte UI-Komponenten-Erstellung
 * Stellt wiederverwendbare Methoden für Header, Cards, Dialoge, etc. bereit
 */
export class ComponentBuilders {
  /** Schließt offene Dropdown-Menüs */
  private static closeOpenDropdowns(): void {
    const sortDropdown = document.getElementById('sort-dropdown');
    const viewModeDropdown = document.getElementById('view-mode-dropdown');
    if (sortDropdown) sortDropdown.style.display = 'none';
    if (viewModeDropdown) viewModeDropdown.style.display = 'none';
  }

  /** Erstellt Bild-Bereich mit Platzhalter falls kein Bild vorhanden */
  private static createImageSection(imageUrl?: string): string {
    return imageUrl ? `
      <div class="card-tile__image">
        <img src="${imageUrl}" alt="Bild" />
      </div>
    ` : `
      <div class="card-tile__image">
        <div class="card-tile__placeholder">
          <div class="card-tile__placeholder-icon">🖼️</div>
          <div>Kein Bild</div>
        </div>
      </div>
    `;
  }

  /** Erstellt Header mit Titel und Action-Buttons */
  static createHeader(title: string, actions: { label: string; id: string; className?: string }[] = [], subtitle?: string): string {
    const actionButtons = actions.map(action => {
      const classes = action.className || 'btn-secondary btn-sm';
      return `<button id="${action.id}" class="${classes}">${action.label}</button>`;
    }).join('');

    return `
      <header class="header">
        <div class="header__content">
          <div class="header__title">
            <h1 style="margin: 0; font-size: ${Theme.fonts.size.xl};">${title}</h1>
            ${subtitle ? `<div style="font-size: ${Theme.fonts.size.sm}; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">${subtitle}</div>` : ''}
          </div>
          <div class="header__actions">
            ${actionButtons}
          </div>
        </div>
      </header>
    `;
  }

  static createSearchBar(
    searchId: string,
    searchValue: string,
    sortOptions: { id: string; label: string; data: string }[],
    currentSortMode: string,
    currentSortAsc: boolean,
    isDetailView: boolean = false,
  ): string {
    return `
      <div class="search-bar" ${isDetailView ? `style="flex-grow: 1; margin-right: ${Theme.spacing.sm};"` : ''}>
        <input 
          id="${searchId}" 
          type="text" 
          placeholder="🔍 Suchen..." 
          value="${searchValue}"
          class="search-bar__input"
        />
        <div class="search-bar__controls" style="position: relative;">
          <button id="filter-btn" class="btn-secondary btn-sm">🧹 Filtern</button>
          <div id="filter-popup" class="filter-popup" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.md}; box-shadow: 0 8px 20px rgba(0,0,0,0.08); z-index: 20; min-width: 220px;">
            <div class="filter-group" style="display: flex; flex-direction: column; gap: ${Theme.spacing.sm};">
              <div class="filter-group__title" style="font-weight: 600;">Sortieren</div>
              <div class="filter-options" style="display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                ${sortOptions.map(opt => `
                  <button class="dropdown__item sort-option" data-mode="${opt.data}" style="text-align: left; ${currentSortMode === opt.data ? `background-color: ${Theme.colors.hover};` : ''}">
                    ${opt.label}
                  </button>
                `).join('')}
              </div>
            </div>
              <div class="filter-group" style="margin-top: ${Theme.spacing.md}; display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                <div class="filter-group__title" style="font-weight: 600;">Richtung</div>
                <button id="sort-direction-btn" class="btn-secondary btn-sm" title="Sortierrichtung umkehren">${currentSortAsc ? '↑ Aufsteigend' : '↓ Absteigend'}</button>
            </div>
            <div class="filter-actions" style="margin-top: ${Theme.spacing.md}; display: flex; gap: ${Theme.spacing.sm}; justify-content: flex-end;">
              <button id="apply-filters-btn" class="btn-primary btn-sm">Übernehmen</button>
              <button id="reset-filters-btn" class="btn-danger btn-sm">Zurücksetzen</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static createSearchBarWithViewMode(
    searchId: string,
    searchValue: string,
    sortOptions: { id: string; label: string; data: string }[],
    currentSortMode: string,
    currentSortAsc: boolean,
    currentMode: string,
    hasSubLists: boolean,
  ): string {
    const modes = [
      { value: 'all', label: '📁+📦 Alles' },
      ...(hasSubLists ? [{ value: 'sublists', label: '📁 Unterlisten' }] : []),
      { value: 'items', label: '📦 Artikel' },
    ];

    const currentLabelObj = modes.find(m => m.value === currentMode);
    const currentLabel = currentLabelObj ? `${currentLabelObj.label} anzeigen` : 'Ansicht';

    return `
      <div style="display: flex; gap: ${Theme.spacing.sm}; align-items: flex-start; margin-bottom: ${Theme.spacing.md};">
        <div class="search-bar" style="flex-grow: 1;">
          <input 
            id="${searchId}" 
            type="text" 
            placeholder="🔍 Suchen..." 
            value="${searchValue}"
            class="search-bar__input"
          />
          <div class="search-bar__controls" style="position: relative;">
            <button id="filter-btn" class="btn-secondary btn-sm">🧹 Filtern</button>
            <div id="filter-popup" class="filter-popup" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: ${Theme.colors.surface}; border: 1px solid ${Theme.colors.border}; border-radius: ${Theme.borderRadius.md}; padding: ${Theme.spacing.md}; box-shadow: 0 8px 20px rgba(0,0,0,0.08); z-index: 20; min-width: 240px;">
              <div class="filter-group" style="display: flex; flex-direction: column; gap: ${Theme.spacing.sm};">
                <div class="filter-group__title" style="font-weight: 600;">Sortieren</div>
                <div class="filter-options" style="display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                  ${sortOptions.map(opt => `
                    <button class="dropdown__item sort-option" data-mode="${opt.data}" style="text-align: left; ${currentSortMode === opt.data ? `background-color: ${Theme.colors.hover};` : ''}">
                      ${opt.label}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div class="filter-group" style="margin-top: ${Theme.spacing.md}; display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                <div class="filter-group__title" style="font-weight: 600;">Richtung</div>
                <button id="sort-direction-btn" class="btn-secondary btn-sm" title="Sortierrichtung umkehren">${currentSortAsc ? '↑ Aufsteigend' : '↓ Absteigend'}</button>
              </div>
              <div class="filter-group" style="margin-top: ${Theme.spacing.md}; display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                <div class="filter-group__title" style="font-weight: 600;">Anzeigen</div>
                <div class="filter-options" style="display: flex; flex-direction: column; gap: ${Theme.spacing.xs};">
                  ${modes.map(mode => `
                    <button class="dropdown__item view-mode-option" data-mode="${mode.value}" style="text-align: left; ${mode.value === currentMode ? `background-color: ${Theme.colors.hover};` : ''}">
                      ${mode.label}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div class="filter-actions" style="margin-top: ${Theme.spacing.md}; display: flex; gap: ${Theme.spacing.sm}; justify-content: flex-end;">
                <button id="apply-filters-btn" class="btn-primary btn-sm">Übernehmen</button>
                <button id="reset-filters-btn" class="btn-danger btn-sm">Zurücksetzen</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }



  /**
   * Erstellt eine Listen-Card (Tile-Layout)
   * Mit Bild, Titel, Kategorie und Action-Buttons
   */
  static createListCard(
    item: { id: string; name: string; category?: string; imageUrl?: string; items?: any[]; sublists?: any[]; hideFinancials?: boolean },
    onView: () => void,
    onEdit: () => void,
    onDelete: () => void,
  ): HTMLElement {
    const div = document.createElement('div');
    div.className = 'card-tile card-tile--list';
    div.style.cursor = 'pointer';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';

    // Calculate totals from items and sublists
    const totals = DataUtils.calculateListTotals(item);
    const hasPurchase = totals.purchasePrice !== undefined;
    const hasValue = totals.currentValue !== undefined;
    const hasProfit = totals.profit !== undefined;

    let totalsInfo = '';
    // Nur finanzielle Werte anzeigen wenn hideFinancials nicht true ist
    if (!item.hideFinancials) {
      if (hasPurchase) totalsInfo += `Bezahlt: ${DataUtils.formatCurrency(totals.purchasePrice!)}, `;
      if (hasValue) totalsInfo += `Wert: ${DataUtils.formatCurrency(totals.currentValue!)}`;
      if (hasProfit) {
        const profit = totals.profit!;
        const profitLabel = profit > 0 ? 'Gewinn:' : profit < 0 ? 'Verlust:' : 'Gewinn/Verlust:';
        const profitColor = profit > 0 ? Theme.colors.success : profit < 0 ? Theme.colors.danger : Theme.colors.textSecondary;
        totalsInfo += `, <span style="color: ${profitColor}; font-weight: 600;">${profitLabel} ${profit > 0 ? '+' : ''}${DataUtils.formatCurrency(profit)}</span>`;
      }
    }

    div.innerHTML = `
      ${this.createImageSection(item.imageUrl)}
      <div class="card-tile__content" style="flex-grow: 1;">
        <div class="card-tile__title" style="color: ${Theme.colors.primary};">${item.name}</div>
        ${item.category ? `<div class="card-tile__subtitle">${item.category}</div>` : ''}
        ${totalsInfo ? `<div class="card-tile__subtitle">${totalsInfo}</div>` : ''}
      </div>
      <div class="card-tile__actions" style="display: flex; gap: ${Theme.spacing.sm}; justify-content: space-between; margin-top: auto;">
        <div class="card-tile__badge" onclick="event.stopPropagation();">📂 Liste</div>
        <div style="display: flex; gap: ${Theme.spacing.sm};">
          <button class="btn-secondary btn-sm" data-action="edit">⚙️ Bearbeiten</button>
          <button class="btn-danger btn-sm" data-action="delete">🗑️ Löschen</button>
        </div>
      </div>
    `;

    const editBtn = div.querySelector('[data-action="edit"]') as HTMLButtonElement;
    const deleteBtn = div.querySelector('[data-action="delete"]') as HTMLButtonElement;

    div.addEventListener('click', onView);
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeOpenDropdowns();
      onEdit();
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeOpenDropdowns();
      onDelete();
    });

    return div;
  }

  /**
   * Erstellt eine Artikel-Card (Tile-Layout)
   * Mit Bild, Name, Preis-Informationen und Action-Buttons
   */
  static createItemCard(
    item: { id: string; name: string; purchasePrice: any; currentValue: any; imageUrls?: string[]; hideFinancials?: boolean },
    onView: () => void,
    onEdit: () => void,
    onDelete: () => void,
  ): HTMLElement {
    const div = document.createElement('div');
    div.style.cursor = 'pointer';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    const hasPurchase = typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice);
    const hasValue = typeof item.currentValue === 'number' && !isNaN(item.currentValue);
    const hasBoth = hasPurchase && hasValue;
    const profit = hasBoth ? (item.currentValue as number) - (item.purchasePrice as number) : NaN;
    const profitLabel = profit > 0 ? 'Gewinn:' : profit < 0 ? 'Verlust:' : 'Gewinn/Verlust:';
    let priceInfo = '';

    // Nur finanzielle Werte anzeigen wenn hideFinancials nicht true ist
    if (!item.hideFinancials) {
      if (hasPurchase) priceInfo += `Bezahlt: ${DataUtils.formatCurrency(item.purchasePrice)}, `;
      if (hasValue) priceInfo += `Wert: ${DataUtils.formatCurrency(item.currentValue)}`;
      if (hasBoth) {
        const profitColor = profit > 0 ? Theme.colors.success : profit < 0 ? Theme.colors.danger : Theme.colors.textSecondary;
        priceInfo += `, <span style="color: ${profitColor}; font-weight: 600;">${profitLabel} ${profit > 0 ? '+' : ''}${DataUtils.formatCurrency(profit)}</span>`;
      }
    }

    div.className = 'card-tile card-tile--item';
    
    // Use first image or show image count
    const hasImages = item.imageUrls && item.imageUrls.length > 0;
    const firstImage = hasImages ? item.imageUrls![0] : undefined;
    const imageCount = hasImages ? item.imageUrls!.length : 0;
    
    div.innerHTML = `
      ${this.createImageSection(firstImage)}
      ${hasImages && imageCount > 1 ? `
        <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">+${imageCount - 1}</div>
      ` : ''}
      <div class="card-tile__content" style="flex-grow: 1;">
        <div class="card-tile__title" style="color: ${Theme.colors.success};">${item.name}</div>
        ${priceInfo ? `<div class="card-tile__subtitle">${priceInfo}</div>` : ''}
      </div>
      <div class="card-tile__actions" style="display: flex; gap: ${Theme.spacing.sm}; justify-content: space-between; margin-top: auto;">
        <div class="card-tile__badge" onclick="event.stopPropagation();">📦 Artikel</div>
        <div style="display: flex; gap: ${Theme.spacing.sm};">
          <button class="btn-secondary btn-sm" data-action="edit">⚙️ Bearbeiten</button>
          <button class="btn-danger btn-sm" data-action="delete">🗑️ Löschen</button>
        </div>
      </div>
    `;

    const editBtn = div.querySelector('[data-action="edit"]') as HTMLButtonElement;
    const deleteBtn = div.querySelector('[data-action="delete"]') as HTMLButtonElement;

    div.addEventListener('click', onView);
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeOpenDropdowns();
      onEdit();
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeOpenDropdowns();
      onDelete();
    });

    return div;
  }

  /** Erstellt Breadcrumb-Navigation für Hierarchie-Anzeige */
  static createBreadcrumb(items: { label: string; id?: string; onClick?: () => void }[]): string {
    return `
      <nav class="breadcrumb">
        ${items.map((item, idx) => `
          ${idx > 0 ? `<span class="breadcrumb__separator">›</span>` : ''}
          ${item.id
            ? `<a href="#" class="breadcrumb__item" data-list-id="${item.id}">${item.label}</a>`
            : `<span class="breadcrumb__current">${item.label}</span>`
          }
        `).join('')}
      </nav>
    `;
  }

  static createConfirmDialog(message: string, confirmLabel: string = 'Ja', cancelLabel: string = 'Nein'): HTMLElement {
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="modal">
        <div class="modal__content">
          <p>${message}</p>
        </div>
        <div class="modal__actions">
          <button id="dialog-cancel" class="btn-secondary">${cancelLabel}</button>
          <button id="dialog-confirm" class="btn-danger">${confirmLabel}</button>
        </div>
      </div>
    `;
    return div;
  }

  static createInlineForm(title: string, fields: Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    value?: string;
    required?: boolean;
    step?: string;
    maxLength?: number;
    max?: number;
  }>): HTMLElement {
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">${title}</h2>
        </div>
        <form id="inline-form" class="modal__content form">
          ${fields.map(field => `
            <div class="form-group">
              <label for="${field.id}" class="form-group__label">${field.label}</label>
              <input
                id="${field.id}"
                type="${field.type || 'text'}"
                placeholder="${field.placeholder || ''}"
                value="${field.value || ''}"
                ${field.required ? 'required' : ''}
                ${field.step ? `step="${field.step}"` : ''}
                ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                ${field.max ? `max="${field.max}"` : ''}
                class="form-group__input"
              />
              ${field.maxLength ? `<div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">Max. ${field.maxLength} Zeichen</div>` : ''}
              ${field.max ? `<div style="font-size: 0.8rem; color: ${Theme.colors.textSecondary}; margin-top: ${Theme.spacing.xs};">Wert kann maximal 9.999.999.999.999,99 betragen.</div>` : ''}
            </div>
          `).join('')}
          <div class="modal__actions">
            <button type="button" id="form-cancel" class="btn-secondary">Abbrechen</button>
            <button type="submit" class="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    `;
    return div;
  }

  static createFooter(buttons: { label: string; id: string; variant?: 'primary' | 'secondary' | 'danger' | 'success' }[]): string {
    return `
      <footer class="footer">
        ${buttons.map(btn => {
          const className = `btn-${btn.variant || 'success'}`;
          return `<button id="${btn.id}" class="${className}">${btn.label}</button>`;
        }).join('')}
      </footer>
    `;
  }

  static createEmptyState(icon: string, title: string, description: string): string {
    return `
      <div style="
        text-align: center;
        padding: ${Theme.spacing.xxl};
        color: ${Theme.colors.textSecondary};
      ">
        <div style="font-size: 3rem; margin-bottom: ${Theme.spacing.lg};">${icon}</div>
        <h3 style="color: ${Theme.colors.text}; margin-bottom: ${Theme.spacing.sm};">${title}</h3>
        <p>${description}</p>
      </div>
    `;
  }
}
