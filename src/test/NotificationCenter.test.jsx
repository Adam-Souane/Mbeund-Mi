import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationCenter from '../shared/components/NotificationCenter';
import { NotificationProvider, useNotifications } from '../shared/contexts/NotificationContext';

// Composant d'aide pour tester l'ajout dynamique de notifications
function NotificationTestRig({ onMount }) {
  const { addNotification } = useNotifications();
  return (
    <div>
      <NotificationCenter />
      <button
        onClick={() =>
          addNotification({
            id: 888,
            dedupId: 'post-test-888',
            type: 'communaute',
            data: {
              titre: 'Nouveau post communautaire · Awa Ndiaye',
              message: 'Passage piéton dégagé à Thiaroye Plage',
              quartier: 'Thiaroye Plage',
              postId: 'post-888',
              url: '/citoyen/communaute?postId=post-888',
            },
            timestamp: new Date().toISOString(),
          })
        }
      >
        Ajouter Post Communautaire
      </button>
    </div>
  );
}

describe('NotificationCenter - Système de cloche et comptage précis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('affiche le nombre de notifications à côté de la cloche lorsque des notifications sont non lues', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationCenter />
        </NotificationProvider>
      </MemoryRouter>
    );

    // Vérifie la présence de la cloche et du badge de nombre
    const notifBtn = screen.getByRole('button', { name: /Centre de notifications/i });
    expect(notifBtn).toBeInTheDocument();

    const countBadge = screen.getByTestId('notification-unread-count');
    expect(countBadge).toBeInTheDocument();
    // Par défaut, DEFAULT_NOTIFICATIONS a 3 notifications non lues
    expect(countBadge.textContent).toBe('3');
  });

  it('diminue le nombre de 1 quand l’utilisateur consulte une notification', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationCenter />
        </NotificationProvider>
      </MemoryRouter>
    );

    const notifBtn = screen.getByRole('button', { name: /Centre de notifications/i });
    const countBadgeBefore = screen.getByTestId('notification-unread-count');
    expect(countBadgeBefore.textContent).toBe('3');

    // 1. Clic sur la cloche pour ouvrir le panneau (sans marquer toutes les notifications comme lues)
    fireEvent.click(notifBtn);

    // Le panneau est ouvert et le badge affiche toujours 3
    expect(screen.getByText(/Notifications & Alertes/i)).toBeInTheDocument();
    expect(screen.getByTestId('notification-unread-count').textContent).toBe('3');

    // 2. Clic sur une notification spécifique
    const firstNotif = screen.getByText(/Vigilance Inondation · Cuvette Ndakhane/i);
    fireEvent.click(firstNotif);

    // 3. Après consultation, le nombre a diminué de 1 (passe de 3 à 2)
    const countBadgeAfter = screen.getByTestId('notification-unread-count');
    expect(countBadgeAfter.textContent).toBe('2');
  });

  it('fait disparaître totalement le nombre quand l’utilisateur clique sur Tout lire ou consulte tout', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationCenter />
        </NotificationProvider>
      </MemoryRouter>
    );

    const notifBtn = screen.getByRole('button', { name: /Centre de notifications/i });
    expect(screen.getByTestId('notification-unread-count')).toBeInTheDocument();

    // 1. Ouvrir le panneau
    fireEvent.click(notifBtn);

    // 2. Clic sur le bouton "Tout lire"
    const markAllBtn = screen.getByRole('button', { name: /Tout lire/i });
    fireEvent.click(markAllBtn);

    // 3. Le badge avec le nombre ne s'affiche plus du tout
    expect(screen.queryByTestId('notification-unread-count')).not.toBeInTheDocument();
  });

  it('reçoit une notification pour un nouveau post communautaire et incrémente le compteur', () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <NotificationTestRig />
        </NotificationProvider>
      </MemoryRouter>
    );

    // Initialement 3 notifications
    expect(screen.getByTestId('notification-unread-count').textContent).toBe('3');

    // Clic pour simuler l'arrivée d'un nouveau post communautaire
    const addPostBtn = screen.getByRole('button', { name: /Ajouter Post Communautaire/i });
    fireEvent.click(addPostBtn);

    // Le compteur s'est incrémenté de +1 (passe à 4)
    expect(screen.getByTestId('notification-unread-count').textContent).toBe('4');

    // Ouvrir le panneau pour voir la notification de communauté
    const notifBtn = screen.getByRole('button', { name: /Centre de notifications/i });
    fireEvent.click(notifBtn);

    expect(screen.getByText(/Nouveau post communautaire · Awa Ndiaye/i)).toBeInTheDocument();
    expect(screen.getByText(/Passage piéton dégagé à Thiaroye Plage/i)).toBeInTheDocument();

    // Consultation de cette notification communautaire
    const communauteNotif = screen.getByText(/Nouveau post communautaire · Awa Ndiaye/i);
    fireEvent.click(communauteNotif);

    // Le compteur décrémente aussitôt de 1 (revient à 3)
    expect(screen.getByTestId('notification-unread-count').textContent).toBe('3');
  });
});
