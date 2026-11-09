import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthLayout from '../auth-pages/AuthLayout';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthLayout - Onboarding Mobile & Accès Anonyme', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche les slides de l’onboarding citoyen avec le bouton Passer', () => {
    render(
      <MemoryRouter>
        <AuthLayout variante="connexion">
          <div data-testid="form-content">Formulaire de connexion</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Passer')).toBeInTheDocument();
    expect(screen.getByText('Alertes Pluie & Inondation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
  });

  it('affiche les deux boutons "Sans compte" et "Se connecter" sur la dernière slide citoyen', () => {
    render(
      <MemoryRouter>
        <AuthLayout variante="connexion">
          <div data-testid="form-content">Formulaire de connexion</div>
        </AuthLayout>
      </MemoryRouter>
    );

    // Slide 1 -> Slide 2
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Cartographie de Thiaroye-sur-Mer')).toBeInTheDocument();

    // Slide 2 -> Slide 3
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Signalement & Veille Active')).toBeInTheDocument();

    // Vérifie les deux boutons sur slide 3
    const sansCompteBtn = screen.getByRole('button', { name: /Sans compte/i });
    const seConnecterBtn = screen.getByRole('button', { name: /Se connecter/i });
    expect(sansCompteBtn).toBeInTheDocument();
    expect(seConnecterBtn).toBeInTheDocument();
  });

  it('redirige immédiatement vers /citoyen/accueil lors du clic sur Passer', () => {
    render(
      <MemoryRouter>
        <AuthLayout variante="connexion">
          <div data-testid="form-content">Formulaire</div>
        </AuthLayout>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Passer'));
    expect(mockNavigate).toHaveBeenCalledWith('/citoyen/accueil');
  });

  it('redirige immédiatement vers /citoyen/accueil lors du clic sur "Sans compte" sur la slide 3', () => {
    render(
      <MemoryRouter>
        <AuthLayout variante="connexion">
          <div data-testid="form-content">Formulaire</div>
        </AuthLayout>
      </MemoryRouter>
    );

    // Atteindre slide 3
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));

    fireEvent.click(screen.getByRole('button', { name: /Sans compte/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/citoyen/accueil');
  });

  it('pour l’espace autorité, ne propose pas le mode anonyme et ouvre directement le formulaire', () => {
    render(
      <MemoryRouter>
        <AuthLayout variante="autorite">
          <div data-testid="form-content">Formulaire Autorité</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('form-content')).toBeInTheDocument();
    expect(screen.queryByText(/Connexion anonyme à Mbeund Mi…/i)).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

