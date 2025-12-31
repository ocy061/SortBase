/**
 * ImageHandler: Zentrale Bildverarbeitung
 * - Konvertierung zu Base64 für JSON-Speicherung
 * - Vorschau-Funktionalität
 * - HTML-Generierung für Bild-Inputs
 */
export class ImageHandler {
  /**
   * Konvertiert eine Bilddatei zu Base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Erstellt ein Bild-Upload-Input-HTML-Element
   */
  static createImageInput(currentImageUrl: string = ''): string {
    return `
      <div class="form-group">
        <label class="form-group__label">Bild</label>
        <input 
          id="image-input" 
          type="file" 
          accept="image/*" 
          class="form-group__input"
          style="padding: 6px;"
        />
        <div style="font-size: 0.8rem; color: #6b7280; margin-top: 6px;">Optional</div>
        ${currentImageUrl ? `
          <div id="image-preview" style="margin-top: 12px; border-radius: 6px; overflow: hidden; max-width: 150px; max-height: 150px; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
            <img id="preview-img" src="${currentImageUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        ` : `
          <div id="image-preview" style="display: none; margin-top: 12px; border-radius: 6px; overflow: hidden; max-width: 150px; max-height: 150px; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
            <img id="preview-img" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        `}
        <button type="button" id="remove-image-btn" class="btn-danger btn-sm" style="margin-top: 8px; ${currentImageUrl ? '' : 'display: none;'}">Bild entfernen</button>
      </div>
    `;
  }

  /**
   * Lädt ein Bild aus dem Input-Element
   */
  static async loadImageFromInput(inputId: string = 'image-input'): Promise<string | null> {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input?.files?.length) return null;
    
    try {
      return await this.fileToBase64(input.files[0]);
    } catch (error) {
      console.error('Fehler beim Laden des Bildes:', error);
      return null;
    }
  }

  /**
   * Zeigt Bild-Vorschau an
   */
  static setupImagePreview(inputId: string = 'image-input'): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img') as HTMLImageElement;
    const removeBtn = document.getElementById('remove-image-btn') as HTMLButtonElement;

    if (!input) return;

    input.addEventListener('change', async () => {
      if (input.files?.length) {
        const base64 = await this.fileToBase64(input.files[0]);
        if (preview) {
          preview.style.display = 'block';
          if (previewImg) {
            previewImg.src = base64;
          } else {
            // Create img element if not existing (new image case)
            const img = document.createElement('img');
            img.id = 'preview-img';
            img.src = base64;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
            preview.appendChild(img);
          }
        }
        if (removeBtn) removeBtn.style.display = 'inline-block';
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        // Clear file input selection
        input.value = '';
        // Hide preview and clear image src
        if (preview) preview.style.display = 'none';
        if (previewImg) previewImg.src = '';
        // Hide remove button again
        removeBtn.style.display = 'none';
        // Emit a custom event so callers can react (e.g., clear currentImage)
        const ev = new CustomEvent('image-cleared');
        removeBtn.dispatchEvent(ev);
      });
    }
  }

  /**
   * Erstellt ein Bild-Element für die Anzeige
   */
  static createImageElement(imageUrl: string | undefined, width: string = '100px', height: string = '100px'): string {
    if (!imageUrl) return '';
    return `<img src="${imageUrl}" style="width: ${width}; height: ${height}; object-fit: cover; border-radius: 6px; margin-right: 12px;" />`;
  }
}
