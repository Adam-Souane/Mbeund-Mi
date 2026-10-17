/**
 * Utilitaire de compression d'image côté client (HTML5 Canvas).
 * Réduit le poids des images avant téléversement pour une navigation rapide même sur réseau 3G/4G restreint.
 */

export async function compressImageClient(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) {
  // Si le fichier n'est pas une image, retourner tel quel
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Si l'environnement ne supporte pas Image ou Canvas 2D (ex: SSR, tests jsdom), retourner tel quel
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('jsdom'))
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Si la compression produit un fichier plus grand ou échoue, garder l'original
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
