import { LIMITS, UI_TEXT, IMAGE_SIZES } from '../constants';

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
          style="display: none;"
        />
        <label for="image-input" class="btn-secondary" style="display: inline-block; cursor: pointer; margin-bottom: 6px;">
          🖼️ Bild auswählen
        </label>
        <div id="image-status" style="font-size: 0.8rem; color: #6b7280; margin-top: 6px;">
          ${currentImageUrl ? UI_TEXT.IMAGE_HINTS.IMAGE_PRESENT : UI_TEXT.IMAGE_HINTS.OPTIONAL}
        </div>
        ${currentImageUrl ? `
          <div id="image-preview" style="margin-top: 12px; border-radius: 6px; overflow: hidden; max-width: 150px; max-height: 150px; display: flex; align-items: center; justify-content: center; background: #f8fafc; position: relative;">
            <img id="preview-img" src="${currentImageUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
            <button type="button" id="remove-image-btn" class="btn-danger btn-sm" style="position: absolute; top: 6px; right: 6px; width: 32px; height: 32px; padding: 0; font-size: 16px; border-radius: 6px; display: none; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; font-weight: bold; z-index: 10; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); transition: all 0.2s ease; line-height: 1;">🗑️</button>
          </div>
        ` : `
          <div id="image-preview" style="display: none; margin-top: 12px; border-radius: 6px; overflow: hidden; max-width: 150px; max-height: 150px; display: flex; align-items: center; justify-content: center; background: #f8fafc; position: relative;">
            <img id="preview-img" style="width: 100%; height: 100%; object-fit: contain;" />
            <button type="button" id="remove-image-btn" class="btn-danger btn-sm" style="position: absolute; top: 6px; right: 6px; width: 32px; height: 32px; padding: 0; font-size: 16px; border-radius: 6px; display: none; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; font-weight: bold; z-index: 10; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); transition: all 0.2s ease; line-height: 1;">🗑️</button>
          </div>
        `}
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
    const imageStatus = document.getElementById('image-status');

    if (!input) return;

    // Set initial state: hide delete button by default
    if (removeBtn && preview?.style.display === 'flex') {
      removeBtn.style.display = 'none';
    }

    // Add hover listeners to preview container
    if (preview) {
      preview.addEventListener('mouseenter', () => {
        if (removeBtn) removeBtn.style.display = 'block';
      });
      preview.addEventListener('mouseleave', () => {
        if (removeBtn) removeBtn.style.display = 'none';
      });
    }

    // Add hover effect to delete button
    if (removeBtn) {
      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.backgroundColor = '#b91c1c';
        removeBtn.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4)';
      });
      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
        removeBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
      });
    }

    input.addEventListener('change', async () => {
      if (input.files?.length) {
        const base64 = await this.fileToBase64(input.files[0]);
        if (preview) {
          preview.style.display = 'flex';
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
        if (imageStatus) imageStatus.textContent = UI_TEXT.IMAGE_HINTS.IMAGE_PRESENT;
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
        if (imageStatus) imageStatus.textContent = UI_TEXT.IMAGE_HINTS.OPTIONAL;
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

  /**
   * Erstellt Galerie-Input für mehrere Bilder
   */
  /**
   * Erstellt Galerie-Input für mehrere Bilder
   */
  static createMultiImageGallery(currentImageUrls: string[] = []): string {
    return `
      <div class="form-group">
        <label class="form-group__label">Bilder</label>
        <input 
          id="multi-image-input" 
          type="file" 
          accept="image/*" 
          multiple
          style="display: none;"
        />
        <label for="multi-image-input" class="btn-secondary" style="display: inline-block; cursor: pointer; margin-bottom: 6px;">
          🖼️ Bilder auswählen
        </label>
        <div id="image-count-display" style="font-size: 0.8rem; color: #6b7280; margin-top: 6px;">
          ${currentImageUrls.length > 0 ? UI_TEXT.IMAGE_HINTS.IMAGES_COUNT(currentImageUrls.length) : UI_TEXT.IMAGE_HINTS.MULTI_OPTIONAL}
        </div>
        <div id="image-gallery" style="display: flex; gap: 16px; margin-top: 12px; overflow-x: auto; padding-bottom: 8px;">
          ${currentImageUrls.map((url, idx) => `
            <div class="gallery-item" data-index="${idx}" style="position: relative; cursor: pointer; flex-shrink: 0; border-radius: 8px; overflow: hidden;">
              <img src="${url}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 2px solid transparent; transition: border 0.2s;" />
              <button type="button" class="delete-image-btn" data-index="${idx}" style="position: absolute; top: 6px; right: 6px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 6px; width: 40px; height: 40px; cursor: pointer; font-weight: bold; display: none; z-index: 10; font-size: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); transition: all 0.2s ease; padding: 0; line-height: 1;">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Lädt mehrere Bilder aus Input und fügt zur Galerie hinzu
   */
  static async loadMultipleImagesFromInput(inputId: string = 'multi-image-input'): Promise<string[]> {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input?.files?.length) return [];
    
    try {
      const images: string[] = [];
      for (let i = 0; i < input.files.length; i++) {
        const base64 = await this.fileToBase64(input.files[i]);
        images.push(base64);
      }
      return images;
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
      return [];
    }
  }

  /**
   * Setup interaktive Galerie mit Lösch-Funktionalität
   */
  static setupMultiImageGallery(existingImages: string[] = [], onImagesChange?: (images: string[]) => void): string[] {
    const gallery = document.getElementById('image-gallery');
    const input = document.getElementById('multi-image-input') as HTMLInputElement;
    const imageCountDisplay = document.getElementById('image-count-display');
    let imageList = [...existingImages];

    if (!gallery) return imageList;

    const updateGallery = () => {
      gallery.innerHTML = imageList
        .map((url, idx) => `
          <div class="gallery-item" data-index="${idx}" style="position: relative; cursor: pointer; flex-shrink: 0; border-radius: 8px; overflow: hidden;">
            <img src="${url}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 2px solid transparent; transition: border 0.2s;" />
            <button type="button" class="delete-image-btn" data-index="${idx}" style="position: absolute; top: 6px; right: 6px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 6px; width: 40px; height: 40px; cursor: pointer; font-weight: bold; display: none; z-index: 10; font-size: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25); transition: all 0.2s ease; padding: 0; line-height: 1;">🗑️</button>
          </div>
        `)
        .join('');

      // Update image count display
      if (imageCountDisplay) {
        imageCountDisplay.textContent = imageList.length > 0 
          ? UI_TEXT.IMAGE_HINTS.IMAGES_COUNT(imageList.length)
          : UI_TEXT.IMAGE_HINTS.MULTI_OPTIONAL;
      }

      // Attach hover and click handlers to all items
      document.querySelectorAll('.gallery-item').forEach((item) => {
        const deleteBtn = item.querySelector('.delete-image-btn') as HTMLButtonElement;
        item.addEventListener('mouseenter', () => {
          if (deleteBtn) deleteBtn.style.display = 'block';
        });
        item.addEventListener('mouseleave', () => {
          if (deleteBtn) deleteBtn.style.display = 'none';
        });
        
        // Add hover effect to delete button
        deleteBtn?.addEventListener('mouseenter', () => {
          deleteBtn.style.backgroundColor = '#b91c1c';
          deleteBtn.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4)';
        });
        deleteBtn?.addEventListener('mouseleave', () => {
          deleteBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
          deleteBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
        });
      });

      document.querySelectorAll('.delete-image-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt((btn as HTMLButtonElement).getAttribute('data-index') || '0');
          imageList.splice(idx, 1);
          updateGallery();
          if (onImagesChange) onImagesChange(imageList);
        });
      });

      if (onImagesChange) onImagesChange(imageList);
    };

    // Setup file input change
    if (input) {
      input.addEventListener('change', async () => {
        const newImages = await this.loadMultipleImagesFromInput();
        if (newImages.length > 0) {
          // Limit to max images per item
          const remainingSlots = LIMITS.MAX_IMAGES_PER_ITEM - imageList.length;
          const imagesToAdd = newImages.slice(0, remainingSlots);
          imageList = [...imageList, ...imagesToAdd];
          
          // Show warning if user tried to add more than available slots
          if (newImages.length > remainingSlots) {
            alert(UI_TEXT.ALERTS.MAX_IMAGES(remainingSlots));
          }
          
          updateGallery();
        }
        input.value = ''; // Reset file input
      });
    }

    updateGallery();
    return imageList;
  }
}
