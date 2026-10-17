import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MesSignalementsPageBody from '../citizen/pages/MesSignalementsPageBody';

const navigateMock = vi.fn();

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../shared/hooks/useMySignalements', () => ({
  useMySignalements: () => ({
    data: {
      results: [
        {
          id: 101,
          categorie: 'inondation',
          quartier: 'Thiaroye Gare',
          rue: 'Rue Marché 10',
          description: 'Eau stagnante gênant le passage',
          photo: '/images/ruelle-thiaroye.jpg',
          valide: false,
          date_creation: '2026-10-15T10:00:00Z',
        },
        {
          id: 102,
          categorie: 'egouts',
          quartier: 'Ndakhane',
          rue: 'Cuvette ruelle 2',
          description: 'Caniveau obstrué par le sable',
          photo: '/images/caniveau-thiaroye.jpg',
          valide: true,
          date_creation: '2026-10-14T08:00:00Z',
        },
        {
          id: 103,
          categorie: 'inondation',
          quartier: 'Thiaroye Plage',
          rue: 'Débarcadère',
          description: 'Pompage terminé avec succès',
          photo: '/images/pompage-thiaroye.jpg',
          valide: true,
          resolu: true,
          date_creation: '2026-10-13T12:00:00Z',
        },
      ],
    },
    isLoading: false,
  }),
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MesSignalementsPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et la liste des signalements sous forme de cartes', () => {
    renderWithProviders(<MesSignalementsPageBody />);

    expect(screen.getByText(/Historique de mes signalements/i)).toBeInTheDocument();
    expect(screen.getByText('Thiaroye Gare')).toBeInTheDocument();
    expect(screen.getByText('Ndakhane')).toBeInTheDocument();
    expect(screen.getByText('Thiaroye Plage')).toBeInTheDocument();
    expect(screen.getByText('Eau stagnante gênant le passage')).toBeInTheDocument();
  });

  it('permet de filtrer les signalements par mot-clé ou quartier', () => {
    renderWithProviders(<MesSignalementsPageBody />);

    const searchInput = screen.getByPlaceholderText(/Rechercher par quartier/i);
    fireEvent.change(searchInput, { target: { value: 'Ndakhane' } });

    expect(screen.getByText('Ndakhane')).toBeInTheDocument();
    expect(screen.queryByText('Thiaroye Gare')).not.toBeInTheDocument();
  });

  it('permet de filtrer par statut (En attente, En cours, Résolus)', () => {
    renderWithProviders(<MesSignalementsPageBody />);

    const btnEnAttente = screen.getByRole('button', { name: /En attente/i });
    fireEvent.click(btnEnAttente);

    expect(screen.getByText('Eau stagnante gênant le passage')).toBeInTheDocument();
    expect(screen.queryByText('Caniveau obstrué par le sable')).not.toBeInTheDocument();

    const btnResolus = screen.getByRole('button', { name: /Résolus/i });
    fireEvent.click(btnResolus);

    expect(screen.getByText('Pompage terminé avec succès')).toBeInTheDocument();
    expect(screen.queryByText('Eau stagnante gênant le passage')).not.toBeInTheDocument();
  });

  it('permet de naviguer vers la page de signalement et vers la carte', () => {
    renderWithProviders(<MesSignalementsPageBody />);

    const btnNouveau = screen.getByRole('button', { name: /Nouveau signalement/i });
    fireEvent.click(btnNouveau);
    expect(navigateMock).toHaveBeenCalledWith('/citoyen/signaler');

    const btnRetour = screen.getByRole('button', { name: /Retour au signalement/i });
    fireEvent.click(btnRetour);
    expect(navigateMock).toHaveBeenCalledWith('/citoyen/signaler');

    const btnCarteList = screen.getAllByRole('button', { name: /Carte/i });
    expect(btnCarteList.length).toBeGreaterThan(0);
    fireEvent.click(btnCarteList[0]);
    expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('/citoyen/carte?signalementId='));
  });
});
