import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MareeVentMarinWidget from '../citizen/components/MareeVentMarinWidget';

describe('MareeVentMarinWidget', () => {
  it('affiche correctement les données de marée et de vent marin pour Thiaroye', () => {
    render(<MareeVentMarinWidget />);

    expect(screen.getByTestId('maree-vent-marin-widget')).toBeInTheDocument();
    expect(screen.getByText(/Façade Maritime · Thiaroye Plage/i)).toBeInTheDocument();
    expect(screen.getByText(/Marée Descendante/i)).toBeInTheDocument();
    expect(screen.getByText(/Coef\. 78/i)).toBeInTheDocument();
    expect(screen.getByText(/Ouest-Nord-Ouest/i)).toBeInTheDocument();
    expect(screen.getByText(/22 km\/h/i)).toBeInTheDocument();
  });

  it('permet de déplier le volet pédagogique sur l impact des marées', () => {
    render(<MareeVentMarinWidget />);

    const toggleBtn = screen.getByTitle(/Comprendre l'impact des marées/i);
    expect(screen.queryByText(/Pourquoi la marée est-elle capitale pour Thiaroye/i)).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Pourquoi la marée est-elle capitale pour Thiaroye/i)).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.queryByText(/Pourquoi la marée est-elle capitale pour Thiaroye/i)).not.toBeInTheDocument();
  });
});
