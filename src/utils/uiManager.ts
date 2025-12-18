export class DropdownManager {
  private currentlyOpenDropdown: HTMLElement | null = null;

  openDropdown(dropdown: HTMLElement) {
    this.closeAllDropdowns();
    this.currentlyOpenDropdown = dropdown;
    dropdown.style.display = 'block';
  }

  closeDropdown(dropdown: HTMLElement) {
    if (dropdown.style.display !== 'none') {
      dropdown.style.display = 'none';
      if (this.currentlyOpenDropdown === dropdown) this.currentlyOpenDropdown = null;
    }
  }

  closeAllDropdowns() {
    document.querySelectorAll<HTMLElement>(
      '.edit-list-menu, .edit-sublist-menu, .edit-item-menu, #sort-items-dropdown, #sort-mode-dropdown, #sort-lists-dropdown'
    ).forEach(menu => {
      menu.style.display = 'none';
    });
    this.currentlyOpenDropdown = null;
  }

  setupGlobalClickListener() {
    document.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement;
      if (target.closest(
        '.edit-list-menu, .edit-sublist-menu, .edit-item-menu, .edit-list-btn, .edit-sublist-btn, .edit-item-btn, .edit-dropdown-btn, #sort-items-dropdown, #sort-mode-dropdown, #sort-lists-dropdown, #sort-items, #sort-mode-btn, #sort-lists'
      )) {
        return;
      }
      this.closeAllDropdowns();
    });
  }
}

export class OverlayManager {
  private overlayElement: HTMLElement | null = null;

  show(htmlContent: string) {
    this.closeAll();
    this.overlayElement = document.createElement('div');
    this.overlayElement.style.cssText = [
      'position:fixed', 'bottom:4.5em', 'left:0', 'width:100vw', 'z-index:1000',
      'justify-content:center', 'display:flex'
    ].join(';');
    this.overlayElement.innerHTML = htmlContent;
    document.body.appendChild(this.overlayElement);
    // Focus first input
    setTimeout(() => {
      const firstInput = this.overlayElement?.querySelector('input') as HTMLInputElement;
      firstInput?.focus();
    }, 0);
    return this.overlayElement;
  }

  close() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }

  closeAll() {
    document.querySelectorAll('[id*="form-container"]').forEach(el => {
      const elem = el as HTMLElement;
      elem.style.display = 'none';
      elem.innerHTML = '';
    });
  }

  getElement(): HTMLElement | null {
    return this.overlayElement;
  }
}
