import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportPage from '../autorite/pages/ExportPage';
import client from '../api/client';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => (
    <div data-testid="autorite-shell">{children}</div>
  ),
}));

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('lucide-react', () => {
  const Icon = (props) => <span {...props} />;

  return {
    Download: Icon,
    FileText: Icon,
    FileJson: Icon,
    Loader2: Icon,
    AlertTriangle: Icon,
    MessageSquare: Icon,
    Map: Icon,
    Zap: Icon,
    Home: Icon,
    Cloud: Icon,
  };
});

describe('ExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche la page des exports', () => {
    render(<ExportPage />);

    expect(
      screen.getByRole('heading', { name: /Exports & Rapports/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Téléchargez les données et rapports/i)
    ).toBeInTheDocument();
  });

  it('affiche les six types d exports', () => {
    render(<ExportPage />);

    expect(screen.getByText('Alertes')).toBeInTheDocument();
    expect(screen.getByText('Signalements Citoyens')).toBeInTheDocument();
    expect(screen.getByText('Zones à Risque')).toBeInTheDocument();
    expect(screen.getByText('Prédictions IA')).toBeInTheDocument();
    expect(screen.getByText('Points de Refuge')).toBeInTheDocument();
    expect(screen.getByText(/Épisodes d.?Inondation/i)).toBeInTheDocument();
  });

  it('affiche les bons boutons CSV et PDF', () => {
    render(<ExportPage />);

    const csvButtons = screen.getAllByRole('button', { name: /CSV/i });
    const pdfButtons = screen.getAllByRole('button', { name: /PDF/i });

    expect(csvButtons).toHaveLength(6);
    expect(pdfButtons).toHaveLength(2);
  });

  it('appelle l API pour exporter les alertes en CSV', async () => {
    const blob = new Blob(['id,alerte'], {
      type: 'text/csv',
    });

    client.get.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="alertes.csv"',
      },
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportPage />);

    const alertesCard = screen
      .getByText('Alertes')
      .closest('div.bg-white');

    const csvButton = alertesCard.querySelector('button');

    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(client.get).toHaveBeenCalledWith(
        '/export/csv/alertes/',
        {
          responseType: 'blob',
        }
      );
    });

    expect(clickSpy).toHaveBeenCalled();
  });

  it('utilise le nom de fichier fourni par le serveur', async () => {
    const blob = new Blob(['data'], {
      type: 'text/csv',
    });

    client.get.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition':
          'attachment; filename="mon_export.csv"',
      },
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportPage />);

    const alertesCard = screen
      .getByText('Alertes')
      .closest('div.bg-white');

    const csvButton = alertesCard.querySelector('button');

    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('utilise un nom de fichier par défaut', async () => {
    const blob = new Blob(['data'], {
      type: 'text/csv',
    });

    client.get.mockResolvedValueOnce({
      data: blob,
      headers: {},
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ExportPage />);

    const zonesCard = screen
      .getByText('Zones à Risque')
      .closest('div.bg-white');

    const csvButton = zonesCard.querySelector('button');

    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  it('affiche une erreur si l export échoue', async () => {
    client.get.mockRejectedValueOnce(
      new Error('Erreur serveur')
    );

    render(<ExportPage />);

    const alertesCard = screen
      .getByText('Alertes')
      .closest('div.bg-white');

    const csvButton = alertesCard.querySelector('button');

    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(
        screen.getByText('Erreur: Erreur serveur')
      ).toBeInTheDocument();
    });
  });

  it('désactive le bouton pendant le téléchargement', async () => {
    let resolveRequest;

    client.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<ExportPage />);

    const alertesCard = screen
      .getByText('Alertes')
      .closest('div.bg-white');

    const csvButton = alertesCard.querySelector('button');

    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(csvButton).toBeDisabled();
    });

    resolveRequest({
      data: new Blob(['data']),
      headers: {},
    });

    await waitFor(() => {
      expect(csvButton).not.toBeDisabled();
    });
  });
});