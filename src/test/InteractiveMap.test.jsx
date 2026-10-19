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

  CircleMarker: forwardRef(({ children, eventHandlers }, ref) => (
    <div ref={ref} data-testid="circle-marker" onClick={eventHandlers?.click}>{children}</div>
  )),

  Marker: forwardRef(({ children, zIndexOffset, eventHandlers }, ref) => (
    <div ref={ref} data-testid="marker" data-zindex={zIndexOffset} onClick={eventHandlers?.click}>{children}</div>
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
    invalidateSize: vi.fn(),
    once: vi.fn(),
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
  Users: () => <span data-testid="users-icon" />,
  PhoneCall: () => <span data-testid="phone-call-icon" />,
  Compass: () => <span data-testid="compass-icon" />,
  LocateFixed: () => <span data-testid="locate-fixed-icon" />,
  Maximize2: () => <span data-testid="maximize-icon" />,
  Minimize2: () => <span data-testid="minimize-icon" />,
  Star: () => <span data-testid="star-icon" />,
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
  RotateCcw: () => <span data-testid="rotate-ccw-icon" />,
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

  it('affiche le popup moderne et harmonisé pour les refuges sécurisés', () => {
    const data = {
      refuges: {
        features: [
          {
            id: 'refuge-1',
            geometry: {
              type: 'Point',
              coordinates: [-17.385, 14.747],
            },
            properties: {
              nom: 'Lycée Moderne de Thiaroye',
              type_refuge: 'ecole',
              quartier: 'Thiaroye Gare',
              adresse: 'Route de Thiaroye Gare',
              capacite: 350,
              contact: '+221 77 123 45 67',
              description: 'Bâtiment R+2 surélevé, cour abritée, point de rassemblement prioritaire.',
            },
          },
        ],
      },
    };

    render(
      <InteractiveMap
        data={data}
        visibleLayers={{ refuges: true }}
        onCalculateRouteFromPoint={vi.fn()}
      />
    );

    expect(screen.getByText('Lycée Moderne de Thiaroye')).toBeInTheDocument();
    expect(screen.getByText('Refuge opérationnel')).toBeInTheDocument();
    expect(screen.getByText('350 places')).toBeInTheDocument();
    expect(screen.getByText('+221 77 123 45 67')).toBeInTheDocument();
    expect(screen.getByText(/Itinéraire vers ce refuge sécurisé/i)).toBeInTheDocument();
  });

  it('affiche le bouton Plein écran à côté du sélecteur Plan / Satellite et déclenche onToggleFullscreen', () => {
    const handleToggleFullscreen = vi.fn();
    render(<InteractiveMap onToggleFullscreen={handleToggleFullscreen} isFullscreen={false} />);

    const fullscreenBtn = screen.getByRole('button', { name: 'Plein écran' });
    expect(fullscreenBtn).toBeInTheDocument();
    fireEvent.click(fullscreenBtn);
    expect(handleToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('met en valeur le signalement du citoyen connecté avec le badge Vous et une priorité zIndexOffset élevée', () => {
    const data = {
      signalements: [
        {
          id: 999,
          geometry: {
            type: 'Point',
            coordinates: [-17.385, 14.747],
          },
          properties: {
            categorie: 'inondation',
            description: 'Mon observation personnelle',
            valide: false,
            citoyen_nom: 'Moussa Diop',
            isCurrentUser: true,
          },
        },
      ],
    };

    render(<InteractiveMap data={data} />);

    expect(screen.getByText(/Votre signalement/i)).toBeInTheDocument();
    expect(screen.getByText(/Moussa Diop \(Vous\)/i)).toBeInTheDocument();
    const marker = screen.getByTestId('marker');
    expect(marker.getAttribute('data-zindex')).toBe('1000');
  });

  it('affiche le marqueur live du citoyen connecté (Vous êtes ici) avec priorité zIndex 2000', () => {
    const userLocation = {
      lat: 14.7485,
      lon: -17.3850,
      name: 'Amadou Sow',
      avatar: '/images/avatar-amadou.jpg',
      quartier: 'Thiaroye-sur-Mer',
    };

    render(<InteractiveMap userLocation={userLocation} />);

    expect(screen.getByText(/Amadou Sow/i)).toBeInTheDocument();
    expect(screen.getByText(/Vous êtes ici/i)).toBeInTheDocument();
    const markers = screen.getAllByTestId('marker');
    const liveMarker = markers.find((m) => m.getAttribute('data-zindex') === '2000');
    expect(liveMarker).toBeDefined();
  });

  it('affiche les libellés courts explicites des capsules dont "Refuges" et "Zones" sans la capsule "Rues"', () => {
    const testData = {
      refuges: { features: [{ id: 1, geometry: { coordinates: [-17.38, 14.74] }, properties: { nom: 'Refuge 1' } }] },
      segments: { features: [{ id: 1, geometry: { coordinates: [[-17.38, 14.74], [-17.39, 14.75]] }, properties: { nom: 'Rue 1' } }] },
      zones: { features: [{ id: 1, geometry: { coordinates: [[[-17.38, 14.74], [-17.39, 14.75], [-17.38, 14.75], [-17.38, 14.74]]] }, properties: { nom: 'Zone 1' } }] },
      signalements: [{ id: 1, position: [-17.38, 14.74] }],
    };
    render(<InteractiveMap data={testData} />);

    expect(screen.getByText('Refuges')).toBeInTheDocument();
    expect(screen.queryByText('Rues')).not.toBeInTheDocument();
    expect(screen.getByText('Zones')).toBeInTheDocument();
    expect(screen.getByText('Signalements')).toBeInTheDocument();
  });

  it('affiche le marqueur d’étape actif sur le tracé sans popup blanche doublon', () => {
    const route = {
      coordinates: [
        [-17.38, 14.75],
        [-17.37, 14.76],
      ],
    };
    const instructions = [
      { ordre: 1, direction: 'depart', instruction: 'Départ depuis votre position', ruelle: 'Rue de la Corniche', distance_m: 50 },
      { ordre: 2, direction: 'droite', instruction: 'Tournez à droite sur la Rue du Débarcadère', ruelle: 'Rue du Débarcadère', distance_m: 120 },
    ];

    render(
      <InteractiveMap
        route={route}
        itineraireInstructions={instructions}
        isNavigating={true}
        currentStepIndex={1}
      />
    );

    // Le marqueur d'étape est rendu sur la carte avec zIndex 2200
    const markers = screen.getAllByTestId('marker');
    const stepMarker = markers.find((m) => m.getAttribute('data-zindex') === '2200');
    expect(stepMarker).toBeDefined();

    // Et aucune popup blanche intempestive "À suivre" n'est affichée (réservé au bandeau bas)
    expect(screen.queryByText('À suivre')).not.toBeInTheDocument();
  });

  it('met au premier plan (z-index élevé) un avatar superposé lorsqu’il est cliqué', () => {
    const data = {
      signalements: [
        {
          id: 101,
          geometry: { type: 'Point', coordinates: [-17.385, 14.747] },
          properties: { id: 101, categorie: 'inondation', description: 'Premier avatar', citoyen_nom: 'Fatou Sow' },
        },
        {
          id: 102,
          geometry: { type: 'Point', coordinates: [-17.385, 14.747] },
          properties: { id: 102, categorie: 'inondation', description: 'Deuxième avatar empilé', citoyen_nom: 'Ousmane Ba' },
        },
      ],
    };

    render(<InteractiveMap data={data} />);

    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);

    // Initialement, les marqueurs ont un z-index normal (0)
    expect(markers[0].getAttribute('data-zindex')).toBe('0');
    expect(markers[1].getAttribute('data-zindex')).toBe('0');

    // Clic sur le second marqueur pour le passer au premier plan
    fireEvent.click(markers[1]);

    // Le marqueur cliqué passe au premier plan avec zIndex 20000
    expect(markers[1].getAttribute('data-zindex')).toBe('20000');

    // Clic sur le premier marqueur : il passe au premier plan à son tour et l'autre repasse derrière
    fireEvent.click(markers[0]);
    expect(markers[0].getAttribute('data-zindex')).toBe('20000');
    expect(markers[1].getAttribute('data-zindex')).toBe('0');
  });

  it('met au premier plan la carte totem de niveau de risque de zone (ex: Modéré, Critique) lorsqu’on clique dessus', () => {
    const data = {
      zones: [
        {
          id: 1,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-17.388, 14.745],
                [-17.382, 14.745],
                [-17.382, 14.749],
                [-17.388, 14.749],
                [-17.388, 14.745],
              ],
            ],
          },
          properties: {
            id: 1,
            quartier: 'Thiaroye Gare',
            niveau_risque: 'critique',
            score_risque_moyen: 0.85,
          },
        },
      ],
    };

    render(<InteractiveMap data={data} />);

    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThanOrEqual(1);
    const totemMarker = markers[0];

    // Initialement le totem a un zIndex de base 200
    expect(totemMarker.getAttribute('data-zindex')).toBe('200');

    // Clic sur la carte totem de zone
    fireEvent.click(totemMarker);

    // La carte totem passe au premier plan absolu avec zIndex 25000
    expect(totemMarker.getAttribute('data-zindex')).toBe('25000');
  });

  it('affiche l avatar citoyen mis à l abri au refuge avec le statut sécurisé et sans popup blanche doublon d étape', () => {
    const route = {
      coordinates: [
        [-17.385, 14.748],
        [-17.384, 14.749],
        [-17.382, 14.751],
      ],
    };
    const instructions = [
      { instruction: 'Départ sécurisé', direction: 'depart', distance_m: 100 },
      { instruction: 'Continuer tout droit', direction: 'tout_droit', distance_m: 150 },
      { instruction: 'Arrivée au refuge', direction: 'arrivee', distance_m: 0 },
    ];
    const userLocation = {
      lat: 14.751,
      lon: -17.382,
      name: 'Amadou Sow',
      avatar: '/images/avatar-amadou.jpg',
      quartier: 'Mis à l’abri · Lycée de Thiaroye',
      isSafe: true,
      refugeNom: 'Lycée de Thiaroye',
    };
    const onResetUserPosition = vi.fn();

    render(
      <InteractiveMap
        data={{}}
        route={route}
        itineraireInstructions={instructions}
        isNavigating={true}
        currentStepIndex={1}
        userLocation={userLocation}
        onResetUserPosition={onResetUserPosition}
      />
    );

    // 1. Vérification : aucune popup blanche Leaflet d'étape avec texte doublon
    expect(screen.queryByText(/Continuer tout droit/)).not.toBeInTheDocument();

    // 2. Vérification : le statut sécurisé "Mis à l'abri" apparaît dans le popup de l'avatar
    expect(screen.getByText("Mis à l'abri")).toBeInTheDocument();
    expect(screen.getByText(/Arrivé en lieu sûr !/)).toBeInTheDocument();

    // 3. Vérification : le bouton de réinitialisation fonctionne
    const resetBtn = screen.getByText('Repartir de la position initiale');
    fireEvent.click(resetBtn);
    expect(onResetUserPosition).toHaveBeenCalledTimes(1);
  });
});