import { render, screen, fireEvent } from '@testing-library/react';
import { forwardRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import InteractiveMap from '../shared/components/map/InteractiveMap';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),

  TileLayer: () => (
    <div data-testid="tile-layer" />
  ),

  Polygon: ({ children }) => (
    <div data-testid="polygon">{children}</div>
  ),

  Polyline: ({ children }) => (
    <div data-testid="polyline">{children}</div>
  ),

  CircleMarker: ({ children }) => (
    <div data-testid="circle-marker">{children}</div>
  ),

  Marker: forwardRef(({ children }, ref) => (
    <div ref={ref} data-testid="marker">{children}</div>
  )),

  Popup: ({ children }) => (
    <div data-testid="popup">{children}</div>
  ),

  ZoomControl: () => (
    <div data-testid="zoom-control" />
  ),

  useMap: () => ({
    fitBounds: vi.fn(),
    flyTo: vi.fn(),
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }) => (
    <a href={to} className={className} data-testid="router-link">
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  Layers: () => <span data-testid="layers-icon" />,
  X: () => <span data-testid="close-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
  ShieldCheck: () => <span data-testid="shield-icon" />,
  MessageCircle: () => <span data-testid="message-icon" />,
  MapPin: () => <span data-testid="mappin-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Map: () => <span data-testid="map-icon" />,
  Satellite: () => <span data-testid="satellite-icon" />,
  Navigation: () => <span data-testid="navigation-icon" />,
  ShieldAlert: () => <span data-testid="shield-alert-icon" />,
  Droplets: () => <span data-testid="droplets-icon" />,
  Route: () => <span data-testid="route-icon" />,
  Radio: () => <span data-testid="radio-icon" />,
  Building2: () => <span data-testid="building-icon" />,
}));

describe('InteractiveMap', () => {
  it('affiche la carte et la couche OpenStreetMap', () => {
    render(<InteractiveMap />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('tile-layer').length).toBeGreaterThan(0);
  });

  it('affiche le sélecteur Plan et Satellite HD à l’intérieur de la carte', () => {
    render(<InteractiveMap />);

    expect(
      screen.getByRole('button', {
        name: 'Mode Plan standard',
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Mode Satellite HD',
      })
    ).toBeInTheDocument();
  });

  it('permet de basculer entre le mode Plan et le mode Satellite HD', () => {
    render(<InteractiveMap defaultBaseMap="satellite" />);

    const planButton = screen.getByRole('button', {
      name: 'Mode Plan standard',
    });
    const satelliteButton = screen.getByRole('button', {
      name: 'Mode Satellite HD',
    });

    expect(satelliteButton).toBeInTheDocument();
    fireEvent.click(planButton);

    expect(planButton).toBeInTheDocument();
  });

  it('affiche une zone à risque', () => {
    const data = {
      zones: {
        features: [
          {
            id: 1,
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-17.38, 14.75],
                  [-17.37, 14.75],
                  [-17.37, 14.76],
                  [-17.38, 14.76],
                  [-17.38, 14.75],
                ],
              ],
            },
            properties: {
              niveau_risque: 'eleve',
              quartier: 'Thiaroye',
              score_risque_moyen: 0.75,
              description: 'Risque élevé d’inondation',
            },
          },
        ],
      },
    };

    render(<InteractiveMap data={data} />);

    expect(screen.getByTestId('polygon')).toBeInTheDocument();
    expect(screen.getByText('Thiaroye')).toBeInTheDocument();
    expect(screen.getByText('Risque élevé d’inondation')).toBeInTheDocument();
  });

  it('affiche un signalement citoyen', () => {
    const data = {
      signalements: [
        {
          id: 1,
          geometry: {
            type: 'Point',
            coordinates: [-17.38, 14.75],
          },
          properties: {
            categorie: 'inondation',
            description: 'Rue complètement inondée',
            valide: true,
          },
        },
      ],
    };

    render(<InteractiveMap data={data} />);

    expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
    expect(screen.getByText('inondation')).toBeInTheDocument();
    expect(screen.getByText('Rue complètement inondée')).toBeInTheDocument();
  });

  it('affiche un itinéraire lorsqu’il est fourni', () => {
    const route = {
      coordinates: [
        [-17.38, 14.75],
        [-17.37, 14.76],
        [-17.36, 14.77],
      ],
    };

    render(<InteractiveMap route={route} />);

    expect(screen.getAllByTestId('polyline')).toHaveLength(2);
    expect(screen.getAllByTestId('circle-marker')).toHaveLength(2);

    expect(screen.getByText('Départ')).toBeInTheDocument();
    expect(
      screen.getByText('Point sûr le plus proche')
    ).toBeInTheDocument();
  });

  it('affiche plusieurs couches lorsqu’elles sont disponibles', () => {
    const data = {
      zones: {
        features: [
          {
            id: 1,
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-17.38, 14.75],
                  [-17.37, 14.75],
                  [-17.37, 14.76],
                  [-17.38, 14.76],
                  [-17.38, 14.75],
                ],
              ],
            },
            properties: {
              niveau_risque: 'moyen',
              quartier: 'Zone A',
              score_risque_moyen: 0.45,
            },
          },
        ],
      },

      signalements: [
        {
          id: 2,
          geometry: {
            type: 'Point',
            coordinates: [-17.38, 14.75],
          },
          properties: {
            categorie: 'danger',
            description: 'Obstacle',
            valide: false,
          },
        },
      ],
    };

    render(<InteractiveMap data={data} />);

    expect(screen.getByTestId('polygon')).toBeInTheDocument();
    expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
  });

  it('permet de masquer une couche via la prop visibleLayers', () => {
    const data = {
      zones: {
        features: [
          {
            id: 1,
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-17.38, 14.75],
                  [-17.37, 14.75],
                  [-17.37, 14.76],
                  [-17.38, 14.76],
                  [-17.38, 14.75],
                ],
              ],
            },
            properties: {
              niveau_risque: 'faible',
              quartier: 'Zone test',
              score_risque_moyen: 0.2,
            },
          },
        ],
      },
    };

    const { rerender } = render(<InteractiveMap data={data} visibleLayers={{ zones: true }} />);
    expect(screen.getByTestId('polygon')).toBeInTheDocument();

    rerender(<InteractiveMap data={data} visibleLayers={{ zones: false }} />);
    expect(screen.queryByTestId('polygon')).not.toBeInTheDocument();
  });
});