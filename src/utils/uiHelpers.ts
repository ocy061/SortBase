import { InventoryList, InventoryItem } from '../models';
import { ListSortMode, ListViewMode } from './stateManager';

export class DialogHelpers {
  static createConfirmDialog(message: string): Promise<boolean> {
    return new Promise(resolve => {
      document.getElementById('modal-confirm-dialog')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'modal-confirm-dialog';
      overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100vw', 'height:100vh',
        'background:rgba(0,0,0,0.3)', 'display:flex', 'align-items:center',
        'justify-content:center', 'z-index:9999'
      ].join(';');
      overlay.innerHTML = `
        <div style="background:#fff;padding:2em;border-radius:8px;box-shadow:0 2px 8px #0003;min-width:250px;max-width:90vw;">
          <div style="margin-bottom:1em;">${message}</div>
          <button id="modal-confirm-yes">Ja</button>
          <button id="modal-confirm-no">Nein</button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#modal-confirm-yes')?.addEventListener('click', () => { overlay.remove(); resolve(true); });
      overlay.querySelector('#modal-confirm-no')?.addEventListener('click', () => { overlay.remove(); resolve(false); });
    });
  }
}

export class BreadcrumbHelpers {
  static createListBreadcrumb(listPath: { name: string; id: string; category?: string }[]): string {
    return `
      <nav class="breadcrumb-bar" style="display:flex;align-items:center;flex-wrap:wrap;gap:0.2em;row-gap:0.3em;font-size:0.98em;user-select:none;max-width:100%;">
        <span style="color:#222;font-weight:bold;white-space:nowrap;">Liste:</span>
        ${listPath.map((entry, idx) => {
          const isLast = idx === listPath.length - 1;
          const cat = entry.category ? ` <span style="color:#888;font-weight:normal;">(${entry.category})</span>` : '';
          return `
            ${idx > 0 ? '<span style="color:#888;">&#8594;</span>' : ''}
            ${isLast
              ? `<b style="color:#222;text-decoration:underline;white-space:nowrap;">${entry.name}${cat}</b>`
              : `<a href="#" class="breadcrumb-link" data-list-id="${entry.id}" style="color:#222;text-decoration:none;padding:2px 6px;border-radius:4px;white-space:nowrap;">${entry.name}${cat}</a>`}
          `;
        }).join('')}
      </nav>
    `;
  }

  static createItemBreadcrumb(listPath: { name: string; id: string; category?: string }[], itemName: string): string {
    return `
      <nav class="breadcrumb-bar" style="display:flex;align-items:center;flex-wrap:wrap;gap:0.2em;row-gap:0.3em;font-size:0.98em;user-select:none;max-width:100%;">
        <span style="color:#222;font-weight:bold;white-space:nowrap;">Artikel in:</span>
        ${listPath.map((entry, idx) => {
          const isLast = idx === listPath.length - 1;
          const cat = entry.category ? ` <span style="color:#888;font-weight:normal;">(${entry.category})</span>` : '';
          return `
            ${idx > 0 ? '<span style="color:#888;">&#8594;</span>' : ''}
            ${isLast
              ? `<span style="font-weight:bold;color:#222;">${entry.name}${cat}</span>`
              : `<a href="#" class="breadcrumb-link" data-list-id="${entry.id}" style="color:#222;text-decoration:none;padding:2px 6px;border-radius:4px;white-space:nowrap;">${entry.name}${cat}</a>`}
          `;
        }).join('')}
        <span style="color:#888;">&#8594;</span>
        <span style="font-weight:bold;color:#222;text-decoration:underline;white-space:nowrap;">${itemName}</span>
      </nav>
    `;
  }
}

export class FormHelpers {
  static createListForm(name: string = '', category: string = ''): string {
    return `
      <form class="edit-list-form">
        <input class="edit-list-name" value="${name}" placeholder="Name der Liste" required />
        <input class="edit-list-category" value="${category}" placeholder="Kategorie (optional)" />
        <button type="submit">Speichern</button>
        <button type="button" class="cancel-edit-list">Abbrechen</button>
      </form>
    `;
  }

  static createAddListForm(): string {
    return `
      <form id="add-list-form" style="background:#fff;padding:1.5em 2em;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:260px;max-width:90vw;display:flex;flex-direction:column;gap:0.7em;align-items:stretch;">
        <input id="list-name" placeholder="Name der Liste" required />
        <input id="list-category" placeholder="Kategorie (optional)" />
        <div style="display:flex;gap:1em;justify-content:flex-end;">
          <button type="submit">Erstellen</button>
          <button type="button" id="cancel-add-list">Abbrechen</button>
        </div>
      </form>
    `;
  }

  static createAddItemForm(): string {
    return `
      <form id="add-item-form" style="background:#fff;padding:1.5em 2em;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:260px;max-width:90vw;display:flex;flex-direction:column;gap:0.7em;align-items:stretch;">
        <input id="item-name" placeholder="Name des Artikels" required />
        <input id="item-purchasePrice" type="number" placeholder="Kaufpreis in € (optional)" step="any" />
        <input id="item-currentValue" type="number" placeholder="Aktueller Wert in € (optional)" step="any" />
        <div style="font-size:0.9em;color:#888;margin-bottom:0.5em;">Gewinn/Verlust wird automatisch berechnet.</div>
        <div style="display:flex;gap:1em;justify-content:flex-end;">
          <button type="submit">Hinzufügen</button>
          <button type="button" id="cancel-add-item">Abbrechen</button>
        </div>
      </form>
    `;
  }

  static createAddSublistForm(): string {
    return `
      <form id="add-sublist-form" style="background:#fff;padding:1.5em 2em;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:260px;max-width:90vw;display:flex;flex-direction:column;gap:0.7em;align-items:stretch;">
        <input id="sublist-name" placeholder="Name der Unterliste" required />
        <input id="sublist-category" placeholder="Kategorie (optional)" />
        <div style="display:flex;gap:1em;justify-content:flex-end;">
          <button type="submit">Hinzufügen</button>
          <button type="button" id="cancel-add-sublist">Abbrechen</button>
        </div>
      </form>
    `;
  }

  static createItemDetailsForm(item: InventoryItem): string {
    const properties = (item.properties ?? {}) as Record<string, string>;
    const propCount = Object.keys(properties).length;
    const MAX_PROPERTIES = 30;
    return `
      <form id="edit-properties-form" style="background:#fff;padding:2em 2.5em;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:280px;max-width:95vw;display:flex;flex-direction:column;gap:1em;align-items:stretch;">
        <h3>Eigenschaften bearbeiten</h3>
        <label>Name:<input id="edit-name" value="${item.name}" required /></label>
        <label>Kaufpreis:<input id="edit-purchasePrice" type="number" value="${typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice) ? item.purchasePrice : ''}" step="any" /></label>
        <label>Aktueller Wert:<input id="edit-currentValue" type="number" value="${typeof item.currentValue === 'number' && !isNaN(item.currentValue) ? item.currentValue : ''}" step="any" /></label>
        <div id="edit-properties-list" style="display:flex;flex-direction:column;gap:0.5em;max-height:320px;overflow-y:auto;padding-right:2px;">
          ${Object.entries(properties).map(([k, v], idx) => `
            <div style='display:flex;gap:0.5em;align-items:center;' data-prop-idx="${idx}">
              <input class="edit-prop-key" value="${k}" style="width:7em;" />
              <span>:</span>
              <input class="edit-prop-value" value="${v}" style="flex:1;" />
              <button type="button" class="delete-prop-btn" title="Eigenschaft löschen" style="color:#b00;">🗑️</button>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:1em;justify-content:flex-end;">
          <button type="submit">Speichern</button>
          <button type="button" id="cancel-edit-properties">Abbrechen</button>
        </div>
      </form>
    `;
  }
}
