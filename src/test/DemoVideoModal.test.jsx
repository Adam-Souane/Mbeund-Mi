import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DemoVideoModal from '../citizen/components/DemoVideoModal';

describe('DemoVideoModal', () => {
  it('ne rend rien quand isOpen est false', () => {
    const { container } = render(
      <MemoryRouter>
        <DemoVideoModal isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche le titre et les chapitres quand isOpen est true', () => {
    render(
      <MemoryRouter>
        <DemoVideoModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Démonstration Vidéo · Mbeund-Mi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Étape 01/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Étape 02/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Étape 03/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Étape 04/i).length).toBeGreaterThan(0);
  });

  it('permet de basculer de chapitre au clic', () => {
    render(
      <MemoryRouter>
        <DemoVideoModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // Clic sur l'étape 2 (Comment faire un signalement)
    const etape2Btn = screen.getAllByText(/Étape 02/i)[0].closest('button');
    fireEvent.click(etape2Btn);

    expect(screen.getAllByText(/Comment faire un Signalement/i).length).toBeGreaterThan(0);
  });

  it('appelle onClose quand on clique sur le bouton fermer', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <DemoVideoModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const closeBtn = screen.getByLabelText(/Fermer la vidéo/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
