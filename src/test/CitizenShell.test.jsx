import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CitizenShell from '../citizen/shared/CitizenShell';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, prenom: 'Mamadou', nom: 'Diop' },
    username: 'Mamadou',
    logout: vi.fn(),
  }),
}));

vi.mock('../shared/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Simulation écran mobile
}));

vi.mock('../shared/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    clearNotifications: vi.fn(),
  }),
}));

vi.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({
    darkMode: false,
    toggleTheme: vi.fn(),
  }),
}));

describe('CitizenShell - Header mobile', () => {
  it('rend le logo discret et dimensionné avec un lien vers l accueil citoyen', () => {
    render(
      <MemoryRouter>
        <CitizenShell>
          <div>Contenu page</div>
        </CitizenShell>
      </MemoryRouter>
    );

    const logoLink = screen.getByLabelText(/Accueil Mbeund Mi/i);
    expect(logoLink).toBeInTheDocument();
    expect(logoLink.getAttribute('href')).toBe('/citoyen/accueil');

    const logoImg = screen.getByAltText(/MBEUND MI/i);
    expect(logoImg).toBeInTheDocument();
  });

  it('affiche les boutons d action mobile (SOS, notification, thème, profil) bien séparés', () => {
    render(
      <MemoryRouter>
        <CitizenShell>
          <div>Contenu page</div>
        </CitizenShell>
      </MemoryRouter>
    );

    const sosBtn = screen.getByLabelText(/Numéros d'urgence 24\/7/i);
    expect(sosBtn).toBeInTheDocument();

    const notifBtn = screen.getByTitle(/Centre de notifications/i);
    expect(notifBtn).toBeInTheDocument();

    const themeBtn = screen.getByLabelText(/Passer en mode sombre/i);
    expect(themeBtn).toBeInTheDocument();

    const profileBtn = screen.getByLabelText(/Mon profil citoyen/i);
    expect(profileBtn).toBeInTheDocument();
  });

  it('ouvre la modale d urgence lors du clic sur le bouton SOS', () => {
    render(
      <MemoryRouter>
        <CitizenShell>
          <div>Contenu page</div>
        </CitizenShell>
      </MemoryRouter>
    );

    const sosBtn = screen.getByLabelText(/Numéros d'urgence 24\/7/i);
    fireEvent.click(sosBtn);

    expect(screen.getByText(/SAMU/i)).toBeInTheDocument();
    expect(screen.getByText(/Sapeurs-Pompiers/i)).toBeInTheDocument();
  });
});
