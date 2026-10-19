import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useSignalementsApercu } from './useSignalements';
import { sanitizePublicAuthor, sanitizePublicText } from '../utils/sanitizer';

/**
 * Hook qui surveille l'arrivée de nouveaux posts ou observations dans la communauté
 * et pousse une notification sur la cloche pour informer les citoyens.
 */
export function useSyncCommunauteToNotifications() {
  const { addNotification } = useNotifications();
  const { data: signalementsData } = useSignalementsApercu();

  // 1. Écoute des signalements et observations terrain récentes issues du backend
  useEffect(() => {
    const rawFeatures = Array.isArray(signalementsData?.results?.features)
      ? signalementsData.results.features
      : Array.isArray(signalementsData?.features)
      ? signalementsData.features
      : Array.isArray(signalementsData?.results)
      ? signalementsData.results
      : Array.isArray(signalementsData)
      ? signalementsData
      : [];

    if (!rawFeatures.length) return;

    // Prendre les 5 signalements les plus récents
    rawFeatures.slice(0, 5).forEach((feat, idx) => {
      const p = feat.properties || feat;
      const rawId = feat.id ?? p.id ?? feat.pk ?? p.pk ?? idx;
      const author = sanitizePublicAuthor(p.citoyen_prenom ? `${p.citoyen_prenom} ${p.citoyen_nom || ''}`.trim() : 'Sentinelle Citoyenne');
      const quartier = p.citoyen_quartier || p.quartier || 'Thiaroye-sur-Mer';
      const titre = sanitizePublicText(p.categorie || p.titre || 'Observation terrain');
      const texte = sanitizePublicText(p.description || 'Montée des eaux signalée dans le quartier.');

      addNotification({
        dedupId: `post-communaute-backend-${rawId}`,
        type: 'communaute',
        data: {
          titre: `Nouveau post communautaire · ${author}`,
          message: `${titre} : ${texte}`,
          quartier,
          postId: `backend-sig-${rawId}`,
          url: `/citoyen/communaute?postId=backend-sig-${rawId}`,
        },
        timestamp: p.date_creation || new Date().toISOString(),
      });
    });
  }, [signalementsData, addNotification]);

  // 2. Écoute des nouveaux posts créés localement ou partagés
  useEffect(() => {
    const handleNewPostEvent = (event) => {
      const post = event.detail;
      if (!post || !post.id) return;

      const author = sanitizePublicAuthor(post.author?.name || post.authorName || 'Riverain');
      const quartier = post.author?.quartier || post.zone || 'Thiaroye-sur-Mer';
      const message = post.texte || post.content || 'Nouveau partage dans l’espace communauté';

      addNotification({
        dedupId: `post-communaute-event-${post.id}`,
        type: 'communaute',
        data: {
          titre: `Nouveau post communautaire · ${author}`,
          message: message,
          quartier,
          postId: post.id,
          url: `/citoyen/communaute?postId=${post.id}`,
        },
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('mbeund_mi_new_community_post', handleNewPostEvent);
    return () => {
      window.removeEventListener('mbeund_mi_new_community_post', handleNewPostEvent);
    };
  }, [addNotification]);
}
