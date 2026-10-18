import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mbeund_offline_signalements';
const QUEUE_EVENT = 'mbeund_offline_queue_changed';

/**
 * Convertit un File/Blob en chaîne Base64 (pour stockage localStorage).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convertit une chaîne Base64 en File.
 */
function base64ToFile(dataUrl, filename = 'photo.jpg') {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Récupère les signalements enregistrés hors-ligne.
 */
export function getSignalementsHorsLigne() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde un signalement dans la file d'attente hors-ligne.
 */
export async function sauvegarderSignalementHorsLigne({ description, categorie, longitude, latitude, photos = [] }) {
  const items = getSignalementsHorsLigne();
  
  // Convertir les photos éventuelles en Base64
  const photosBase64 = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const file = p.file || p;
    if (file instanceof Blob || file instanceof File) {
      try {
        const b64 = await fileToBase64(file);
        photosBase64.push({ name: file.name || `photo_${i + 1}.jpg`, data: b64 });
      } catch (err) {
        console.warn('Impossible d’encoder la photo hors-ligne:', err);
      }
    }
  }

  const nouveauSignalement = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    description,
    categorie,
    longitude,
    latitude,
    photos: photosBase64,
    date_creation: new Date().toISOString(),
  };

  items.push(nouveauSignalement);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: { count: items.length } }));

  return nouveauSignalement;
}

/**
 * Supprime un signalement hors-ligne après synchronisation réussie.
 */
export function supprimerSignalementHorsLigne(id) {
  const items = getSignalementsHorsLigne().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: { count: items.length } }));
}

/**
 * Synchronise tous les signalements en attente vers le backend.
 */
export async function synchroniserSignalementsHorsLigne(createSignalementFn) {
  const items = getSignalementsHorsLigne();
  if (!items.length) return 0;

  let synchronises = 0;

  for (const item of items) {
    try {
      // Reconstituer les fichiers photos depuis le base64
      const files = (item.photos || []).map((p, idx) =>
        base64ToFile(p.data, p.name || `photo_${idx + 1}.jpg`)
      );

      await createSignalementFn({
        description: item.description,
        categorie: item.categorie,
        longitude: item.longitude,
        latitude: item.latitude,
        photos: files,
      });

      supprimerSignalementHorsLigne(item.id);
      synchronises++;
    } catch (err) {
      console.warn(`Échec de synchronisation pour le signalement ${item.id}:`, err);
      // On s'arrête si la connexion a encore coupé
      if (!navigator.onLine) break;
    }
  }

  return synchronises;
}

/**
 * Hook React pour observer et contrôler la file d'attente hors-ligne.
 */
export function useOfflineSignalements(createSignalementFn) {
  const [items, setItems] = useState(getSignalementsHorsLigne());
  const [isSyncing, setIsSyncing] = useState(false);

  const rafraichir = useCallback(() => {
    setItems(getSignalementsHorsLigne());
  }, []);

  const synchroniser = useCallback(async () => {
    if (!createSignalementFn || isSyncing || !navigator.onLine) return 0;
    setIsSyncing(true);
    try {
      const count = await synchroniserSignalementsHorsLigne(createSignalementFn);
      rafraichir();
      return count;
    } finally {
      setIsSyncing(false);
    }
  }, [createSignalementFn, isSyncing, rafraichir]);

  useEffect(() => {
    window.addEventListener(QUEUE_EVENT, rafraichir);
    window.addEventListener('online', synchroniser);

    // Tentative de synchronisation initiale si en ligne
    if (navigator.onLine && items.length > 0) {
      synchroniser();
    }

    return () => {
      window.removeEventListener(QUEUE_EVENT, rafraichir);
      window.removeEventListener('online', synchroniser);
    };
  }, [rafraichir, synchroniser, items.length]);

  return {
    pendingCount: items.length,
    pendingItems: items,
    isSyncing,
    synchroniser,
  };
}
