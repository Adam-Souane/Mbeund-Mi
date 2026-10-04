import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme/ThemeContext';
import { NotificationProvider } from '../shared/contexts/NotificationContext';
import { ToastProvider } from '../shared/toast/ToastContext';
import ManageAuthoritiesPage from '../autorite/pages/ManageAuthoritiesPage';

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
};

vi.mock('../api/client', () => ({
  default: {
    get: (...args) => mockClient.get(...args),
    post: (...args) => mockClient.post(...args),
  },
}));

let mockRole = 'admin';
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    role: mockRole,
    username: 'admin_test',
    isAuthenticated: true,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <ToastProvider>
              <ManageAuthoritiesPage />
            </ToastProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ManageAuthoritiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'admin';
    mockClient.get.mockImplementation((url) => {
      if (url.includes('/users/list-authorities/')) {
        return Promise.resolve({ data: { authorities: [], count: 0 } });
      }
      if (url.includes('/users/check-username/')) {
        return Promise.resolve({ data: { options: ['fatoudiop'] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('affiche un refus d’accès si le rôle n’est pas admin', () => {
    mockRole = 'autorite';
    renderPage();
    expect(screen.getByText('Accès réservé')).toBeInTheDocument();
    expect(screen.getByText('Cette page est réservée aux administrateurs.')).toBeInTheDocument();
  });

  it('affiche le formulaire complet de gestion pour l’administrateur', async () => {
    renderPage();
    expect(await screen.findByText('Gérer les autorités')).toBeInTheDocument();
    expect(screen.getByText('Créer une nouvelle autorité')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Jean')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Dupont')).toBeInTheDocument();
  });
});
