/**
 * Design-System für einheitliches und benutzerfreundliches UI
 * Definiert Farben, Abstände, Schriften, Schatten, etc.
 */

export const Theme = {
  // Farben
  colors: {
    primary: '#2563eb',       // Blau
    secondary: '#64748b',     // Grau
    success: '#16a34a',       // Grün
    danger: '#dc2626',        // Rot
    warning: '#f59e0b',       // Orange
    background: '#f8fafc',    // Sehr helles Grau
    surface: '#ffffff',       // Weiß
    border: '#e2e8f0',        // Helles Grau
    text: '#1e293b',          // Dunkelgrau
    textSecondary: '#64748b', // Mittles Grau
    hover: '#f1f5f9',         // Sehr helles Grau
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  // Border Radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Typography
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Z-Index
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    tooltip: 50,
  },
};

/**
 * StyleInjector: Injiziert globale CSS-Styles
 * Wird einmalig beim App-Start aufgerufen
 */
export class StyleInjector {
  static injectGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html, body {
        font-family: ${Theme.fonts.family};
        color: ${Theme.colors.text};
        background-color: ${Theme.colors.background};
        font-size: 14px;
        line-height: 1.5;
      }

      /* Scrollbar-Styling */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${Theme.colors.background};
      }
      ::-webkit-scrollbar-thumb {
        background: ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.sm};
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${Theme.colors.secondary};
      }

      /* Typography */
      h1 {
        font-size: ${Theme.fonts.size.xxl};
        font-weight: ${Theme.fonts.weight.bold};
        margin-bottom: ${Theme.spacing.lg};
        color: ${Theme.colors.text};
      }

      h2 {
        font-size: ${Theme.fonts.size.xl};
        font-weight: ${Theme.fonts.weight.semibold};
        margin-bottom: ${Theme.spacing.md};
        color: ${Theme.colors.text};
      }

      h3 {
        font-size: ${Theme.fonts.size.lg};
        font-weight: ${Theme.fonts.weight.semibold};
        margin-bottom: ${Theme.spacing.md};
        color: ${Theme.colors.text};
        margin-top: ${Theme.spacing.lg};
      }

      /* Buttons */
      button {
        font-family: ${Theme.fonts.family};
        font-size: ${Theme.fonts.size.sm};
        font-weight: ${Theme.fonts.weight.medium};
        padding: 0.5rem 1rem;
        border: none;
        border-radius: ${Theme.borderRadius.md};
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        white-space: nowrap;
        min-height: 36px;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Button Primary */
      .btn-primary {
        background-color: ${Theme.colors.primary};
        color: white;
        box-shadow: ${Theme.shadows.sm};
      }
      .btn-primary:hover:not(:disabled) {
        background-color: #1d4ed8;
        box-shadow: ${Theme.shadows.md};
      }
      .btn-primary:active:not(:disabled) {
        transform: scale(0.98);
      }

      /* Button Secondary */
      .btn-secondary {
        background-color: ${Theme.colors.background};
        color: ${Theme.colors.text};
        border: 1px solid ${Theme.colors.border};
        box-shadow: ${Theme.shadows.sm};
      }
      .btn-secondary:hover:not(:disabled) {
        background-color: ${Theme.colors.hover};
        border-color: ${Theme.colors.secondary};
      }

      /* Button Danger */
      .btn-danger {
        background-color: ${Theme.colors.danger};
        color: white;
        box-shadow: ${Theme.shadows.sm};
      }
      .btn-danger:hover:not(:disabled) {
        background-color: #b91c1c;
        box-shadow: ${Theme.shadows.md};
      }

      /* Button Success */
      .btn-success {
        background-color: ${Theme.colors.success};
        color: white;
        box-shadow: ${Theme.shadows.sm};
      }
      .btn-success:hover:not(:disabled) {
        background-color: #15803d;
        box-shadow: ${Theme.shadows.md};
      }

      /* Button Small */
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: ${Theme.fonts.size.xs};
        min-height: 32px;
      }

      /* Inputs */
      input, textarea, select {
        font-family: ${Theme.fonts.family};
        font-size: ${Theme.fonts.size.sm};
        padding: 0.5rem 0.75rem;
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        background-color: ${Theme.colors.surface};
        color: ${Theme.colors.text};
        transition: all 0.2s ease;
        width: 100%;
      }

      input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: ${Theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      input::placeholder {
        color: ${Theme.colors.textSecondary};
      }

      /* Layout */
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 ${Theme.spacing.md};
      }

      .header {
        background-color: ${Theme.colors.surface};
        border-bottom: 1px solid ${Theme.colors.border};
        padding: ${Theme.spacing.lg};
        box-shadow: ${Theme.shadows.sm};
        position: sticky;
        top: 0;
        z-index: ${Theme.zIndex.sticky};
      }

      .header__content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: ${Theme.spacing.md};
        flex-wrap: wrap;
      }

      .header__title {
        display: flex;
        align-items: center;
        gap: ${Theme.spacing.md};
        flex: 1;
        min-width: 200px;
      }

      .header__actions {
        display: flex;
        gap: ${Theme.spacing.sm};
        flex-wrap: wrap;
      }

      .main {
        padding: ${Theme.spacing.lg};
        padding-bottom: calc(${Theme.spacing.lg} + 80px);
        min-height: calc(100vh - 180px);
      }

      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: ${Theme.colors.surface};
        border-top: 1px solid ${Theme.colors.border};
        padding: ${Theme.spacing.lg};
        display: flex;
        justify-content: center;
        gap: ${Theme.spacing.xl};
        z-index: ${Theme.zIndex.fixed};
        box-shadow: ${Theme.shadows.lg};
      }

      /* Cards */
      .card {
        background-color: ${Theme.colors.surface};
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        padding: ${Theme.spacing.md};
        box-shadow: ${Theme.shadows.sm};
        transition: all 0.2s ease;
      }

      .card:hover {
        box-shadow: ${Theme.shadows.md};
        border-color: ${Theme.colors.primary};
      }

      .card-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: ${Theme.spacing.sm};
      }
      /* Tile Cards (image-friendly) */
      .card-tile {
        display: flex;
        flex-direction: column;
        gap: ${Theme.spacing.xs};
        padding: ${Theme.spacing.xs};
        background-color: ${Theme.colors.surface};
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        transition: all 0.2s ease;
      }

      .card-tile:hover {
        background-color: ${Theme.colors.hover};
        box-shadow: ${Theme.shadows.md};
        border-color: ${Theme.colors.primary};
      }

      .card-tile__badge {
        padding: 0.375rem 0.75rem;
        border-radius: ${Theme.borderRadius.md};
        font-size: ${Theme.fonts.size.xs};
        font-weight: ${Theme.fonts.weight.medium};
        background-color: ${Theme.colors.background};
        border: 1px solid ${Theme.colors.border};
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .card-tile--list .card-tile__badge {
        color: ${Theme.colors.primary};
        border-color: ${Theme.colors.primary};
      }

      .card-tile--item .card-tile__badge {
        color: ${Theme.colors.success};
        border-color: ${Theme.colors.success};
      }

      .card-tile__image {
        width: 100%;
        border-radius: ${Theme.borderRadius.md};
        overflow: hidden;
        aspect-ratio: 1 / 1; /* Square image area */
        max-height: 200px;
        background-color: ${Theme.colors.background};
        border: 1px solid ${Theme.colors.border};
      }

      .card-tile__placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: ${Theme.spacing.xs};
        color: ${Theme.colors.textSecondary};
        font-size: ${Theme.fonts.size.sm};
      }
      .card-tile__placeholder-icon {
        font-size: 1.75rem;
        line-height: 1;
      }

      .card-tile__image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .card-tile__content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 ${Theme.spacing.xs};
      }

      .card-tile__title {
        font-weight: ${Theme.fonts.weight.semibold};
        color: ${Theme.colors.text};
      }

      .card-tile__subtitle {
        font-size: ${Theme.fonts.size.xs};
        color: ${Theme.colors.textSecondary};
      }

      .card-tile__actions {
        display: flex;
        gap: ${Theme.spacing.sm};
        justify-content: flex-end;
        padding: ${Theme.spacing.xs};
      }

      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${Theme.spacing.md};
        background-color: ${Theme.colors.surface};
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        transition: all 0.2s ease;
      }

      .card-row:hover {
        background-color: ${Theme.colors.hover};
        box-shadow: ${Theme.shadows.md};
      }

      .card-row__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .card-row__title {
        font-weight: ${Theme.fonts.weight.semibold};
        color: ${Theme.colors.text};
        cursor: pointer;
        text-decoration: none;
        padding: 2px 0;
      }

      .card-row__title:hover {
        color: ${Theme.colors.primary};
      }

      .card-row__subtitle {
        font-size: ${Theme.fonts.size.xs};
        color: ${Theme.colors.textSecondary};
      }

      .card-row__actions {
        display: flex;
        gap: ${Theme.spacing.sm};
        margin-left: ${Theme.spacing.md};
      }

      /* Search & Filter Bar */
      .search-bar {
        display: flex;
        gap: ${Theme.spacing.md};
        margin-bottom: ${Theme.spacing.lg};
        flex-wrap: wrap;
        align-items: center;
      }

      .search-bar__input {
        flex: 1;
        min-width: 200px;
      }

      .search-bar__controls {
        display: flex;
        gap: ${Theme.spacing.sm};
        align-items: center;
      }

      /* Dropdown Menu */
      .dropdown {
        position: relative;
        display: inline-block;
      }

      .dropdown__trigger {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .dropdown__menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        background-color: ${Theme.colors.surface};
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        box-shadow: ${Theme.shadows.lg};
        z-index: ${Theme.zIndex.dropdown};
        min-width: 160px;
        overflow: hidden;
      }

      .dropdown__item {
        display: block;
        width: 100%;
        padding: ${Theme.spacing.sm} ${Theme.spacing.md};
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        color: ${Theme.colors.text};
        font-size: ${Theme.fonts.size.sm};
        transition: background-color 0.2s ease;
        border-radius: 0;
      }

      .dropdown__item:hover {
        background-color: ${Theme.colors.hover};
      }

      .dropdown__item--danger {
        color: ${Theme.colors.danger};
      }

      .dropdown__item--danger:hover {
        background-color: rgba(220, 38, 38, 0.1);
      }

      /* Breadcrumb */
      .breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: ${Theme.spacing.sm};
        margin-bottom: ${Theme.spacing.md};
        font-size: ${Theme.fonts.size.sm};
      }

      .breadcrumb__item {
        color: ${Theme.colors.text};
        text-decoration: none;
        padding: 2px 4px;
        border-radius: ${Theme.borderRadius.sm};
        transition: all 0.2s ease;
      }

      .breadcrumb__item:hover {
        background-color: ${Theme.colors.hover};
      }

      .breadcrumb__separator {
        color: ${Theme.colors.textSecondary};
      }

      .breadcrumb__current {
        font-weight: ${Theme.fonts.weight.semibold};
        color: ${Theme.colors.text};
      }

      /* Forms */
      .form {
        max-width: 500px;
      }

      .form-group {
        margin-bottom: ${Theme.spacing.md};
        display: flex;
        flex-direction: column;
        gap: ${Theme.spacing.sm};
      }

      .form-group__label {
        font-weight: ${Theme.fonts.weight.medium};
        color: ${Theme.colors.text};
        font-size: ${Theme.fonts.size.sm};
      }

      .form-group__input {
        border: 1px solid ${Theme.colors.border};
        border-radius: ${Theme.borderRadius.md};
        padding: 0.5rem 0.75rem;
      }

      .form-group__hint {
        font-size: ${Theme.fonts.size.xs};
        color: ${Theme.colors.textSecondary};
      }

      .form__actions {
        display: flex;
        gap: ${Theme.spacing.md};
        justify-content: flex-end;
        margin-top: ${Theme.spacing.lg};
      }

      /* Modal Dialog */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${Theme.zIndex.modal};
      }

      .modal {
        background-color: ${Theme.colors.surface};
        border-radius: ${Theme.borderRadius.lg};
        box-shadow: ${Theme.shadows.xl};
        padding: ${Theme.spacing.xl};
        max-width: 500px;
        width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal__header {
        margin-bottom: ${Theme.spacing.lg};
        padding-bottom: ${Theme.spacing.md};
        border-bottom: 1px solid ${Theme.colors.border};
      }

      .modal__title {
        font-size: ${Theme.fonts.size.lg};
        font-weight: ${Theme.fonts.weight.semibold};
        color: ${Theme.colors.text};
        margin: 0;
      }

      .modal__content {
        margin-bottom: ${Theme.spacing.lg};
      }

      .modal__actions {
        display: flex;
        gap: ${Theme.spacing.md};
        justify-content: flex-end;
      }

      /* Alerts */
      .alert {
        padding: ${Theme.spacing.md};
        border-radius: ${Theme.borderRadius.md};
        border-left: 4px solid;
        margin-bottom: ${Theme.spacing.md};
      }

      .alert--success {
        background-color: rgba(22, 163, 74, 0.1);
        border-color: ${Theme.colors.success};
        color: #15803d;
      }

      .alert--error {
        background-color: rgba(220, 38, 38, 0.1);
        border-color: ${Theme.colors.danger};
        color: #991b1b;
      }

      .alert--warning {
        background-color: rgba(245, 158, 11, 0.1);
        border-color: ${Theme.colors.warning};
        color: #92400e;
      }

      /* Badge */
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: ${Theme.borderRadius.full};
        font-size: ${Theme.fonts.size.xs};
        font-weight: ${Theme.fonts.weight.semibold};
        background-color: ${Theme.colors.background};
        color: ${Theme.colors.text};
      }

      .badge--primary {
        background-color: rgba(37, 99, 235, 0.1);
        color: ${Theme.colors.primary};
      }

      .badge--success {
        background-color: rgba(22, 163, 74, 0.1);
        color: ${Theme.colors.success};
      }

      .badge--danger {
        background-color: rgba(220, 38, 38, 0.1);
        color: ${Theme.colors.danger};
      }

      /* Responsive */
      @media (max-width: 768px) {
        .card-list {
          grid-template-columns: 1fr;
        }
        .header__content {
          flex-direction: column;
          align-items: flex-start;
        }

        .main {
          padding: ${Theme.spacing.md};
          min-height: calc(100vh - 160px);
        }

        .search-bar {
          flex-direction: column;
        }

        .search-bar__input {
          min-width: 100%;
        }

        .footer {
          gap: ${Theme.spacing.md};
          padding: ${Theme.spacing.md};
          flex-wrap: wrap;
        }

        .modal {
          width: 95vw;
          padding: ${Theme.spacing.lg};
        }

      }

      @media (max-width: 1200px) {
        .card-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      /* Wider screens: scale to 4, 5, 6, and 7 columns */
      @media (min-width: 1400px) {
        .card-list {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
      @media (min-width: 1800px) {
        .card-list {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }
      @media (min-width: 2200px) {
        .card-list {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }
      }
      @media (min-width: 2600px) {
        .card-list {
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }
}
