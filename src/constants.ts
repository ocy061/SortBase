/**
 * Globale Konstanten für SortBase
 * Zentrale Definition aller Limits und wiederverwendbarer Werte
 */

/** Limits für Verschachtelung und Anzahl */
export const LIMITS = {
  /** Maximale Verschachtelungstiefe für Unterlisten */
  MAX_NESTING_LEVEL: 19,
  /** Maximale Anzahl Bilder pro Artikel */
  MAX_IMAGES_PER_ITEM: 20,
  /** Maximale Anzahl eigener Eigenschaften pro Artikel */
  MAX_PROPERTIES_PER_ITEM: 50,
} as const;

/** Zeichenlimits für Eingabefelder */
export const CHAR_LIMITS = {
  /** Maximale Länge für Namen (Listen und Artikel) */
  NAME: 70,
  /** Maximale Länge für Kategorien */
  CATEGORY: 50,
  /** Maximale Länge für Eigenschaftsnamen */
  PROPERTY_KEY: 30,
  /** Maximale Länge für Eigenschaftswerte */
  PROPERTY_VALUE: 75,
} as const;

/** Bildgrößen für Vorschauen */
export const IMAGE_SIZES = {
  /** Standard-Vorschaugröße für einzelne Bilder */
  PREVIEW: { width: '150px', height: '150px' },
  /** Galerie-Vorschaugröße für mehrere Bilder */
  GALLERY: { width: '140px', height: '140px' },
  /** Karten-Vorschaugröße */
  CARD: { width: '100px', height: '100px' },
} as const;

/** UI-Texte und Labels */
export const UI_TEXT = {
  IMAGE_HINTS: {
    OPTIONAL: 'Optional',
    OPTIONAL_HOVER_DELETE: 'Optional. Hovere über das Bild zum Löschen',
    MULTI_OPTIONAL: `Optional - max. ${LIMITS.MAX_IMAGES_PER_ITEM} Bilder`,
    IMAGE_PRESENT: 'Bild vorhanden',
    IMAGES_COUNT: (count: number) => `${count} Bild${count > 1 ? 'er' : ''} hinzugefügt`,
  },
  FIELD_HINTS: {
    NAME: `Max. ${CHAR_LIMITS.NAME} Zeichen`,
    CATEGORY: `Optional - Max. ${CHAR_LIMITS.CATEGORY} Zeichen`,
    OPTIONAL: 'Optional',
  },
  ALERTS: {
    MAX_IMAGES: (available: number) => 
      `Maximum ${LIMITS.MAX_IMAGES_PER_ITEM} Bilder erlaubt. ${available} Bild${available !== 1 ? 'er' : ''} hinzugefügt.`,
    MAX_PROPERTIES: `Maximal ${LIMITS.MAX_PROPERTIES_PER_ITEM} Eigenschaften pro Artikel erlaubt.`,
    MAX_NESTING: `Maximale Verschachtelungstiefe von ${LIMITS.MAX_NESTING_LEVEL} Ebenen erreicht.`,
  },
} as const;

/** Datenbank und Speicherung */
export const STORAGE = {
  /** Name der JSON-Datei für Daten */
  DATA_FILE: 'sortbase-data.json',
  /** Key für Listen-Übersicht-State */
  LIST_OVERVIEW_KEY: '__listOverview__',
} as const;
