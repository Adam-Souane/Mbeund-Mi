import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  X,
  MapPin,
  Eye,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Map as MapIcon,
  Satellite,
  Navigation,
  ShieldAlert,
  Droplets,
  Route,
  Radio,
  Building2,
  Users,
  PhoneCall,
  Compass,
  LocateFixed,
  Maximize2,
  Minimize2,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { riskInfo } from '../RiskBadge';
import { polygonToLatLngs, lineToLatLngs, pointToLatLng, getPolygonCenter } from './geoUtils';
import { getPublicAvatar } from '../../utils/avatarResolver';
import { sanitizePublicAuthor, sanitizePublicText } from '../../utils/sanitizer';

// Coordonnées optimales englobant l'intégralité du territoire de Thiaroye-sur-Mer
// (du littoral et de la plage au sud, à la cuvette ouest, jusqu'à la gare et Guinaw Rail)
const THIAROYE_CENTER = [14.747, -17.385];

// Limites géographiques strictes de Thiaroye-sur-Mer et de ses abords immédiats (Pikine / Yeumbeul)
// Empêche toute dérive de la caméra vers le large de l'océan Atlantique ou hors zone
const THIAROYE_BOUNDS = [
  [14.718, -17.435], // Sud-Ouest maritime (baie de Hann / estran immédiat)
  [14.785, -17.345], // Nord-Est terrestre (Guinaw Rail / Yeumbeul / Tally Diallo)
];

export const LAYER_LABELS = {
  zones: 'Zones à risque',
  segments: 'Rues & drainage',
  capteurs: 'Capteurs',
  signalements: 'Signalements citoyens',
  refuges: 'Points de refuge',
};

export const LAYER_ICONS = {
  zones: ShieldAlert,
  segments: Route,
  capteurs: Radio,
  signalements: MapPin,
  refuges: Building2,
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function segmentColor(score) {
  const value = Number(score ?? 0);
  if (value >= 0.6) return '#C0182A';
  if (value >= 0.3) return '#E0792E';
  return '#4A6480';
}

function checkIsSharedOnCommunity(signalement) {
  const props = signalement?.properties || signalement || {};
  const sigId = signalement?.id ?? props.id;
  try {
    const privates = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');
    if (
      privates[sigId] ||
      (props.rawBackendId && privates[props.rawBackendId]) ||
      (props.description && privates[props.description.trim()])
    ) {
      return false;
    }
    const deleted = JSON.parse(localStorage.getItem('mbeund_mi_community_deleted_post_ids') || '{}');
    if (deleted[sigId] || (props.rawBackendId && deleted[props.rawBackendId]) || deleted[`backend-sig-${sigId}`]) {
      return false;
    }
  } catch {}
  return true;
}

function createCitizenAvatarIcon({
  avatarUrl,
  statusColor,
  isSelected,
  authorName,
  category,
  zoomLevel = 15,
  quartierLabel = '',
  isCurrentUser = false,
}) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) {
    return undefined;
  }
  const initials = authorName
    ? authorName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'C';

  // Icônes vectorielles réelles (SVG) en remplacement intégral des émojis
  let categorySvg = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="citizen-badge-svg">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  `; // Goutte d'eau (Inondation / Eau par défaut)

  const cat = (category || '').toLowerCase();
  if (cat.includes('caniveau') || cat.includes('egout')) {
    categorySvg = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="citizen-badge-svg">
        <rect x="2" y="6" width="20" height="8" rx="1"/>
        <path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/>
      </svg>
    `;
  } else if (cat.includes('pompage')) {
    categorySvg = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="citizen-badge-svg">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    `;
  } else if (cat.includes('danger') || cat.includes('reflux')) {
    categorySvg = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="citizen-badge-svg">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
  } else if (cat.includes('entraide') || cat.includes('sac')) {
    categorySvg = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffffff" stroke="none" class="citizen-badge-svg">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    `;
  } else if (cat.includes('resolu') || cat.includes('curage')) {
    categorySvg = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="citizen-badge-svg">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
  }

  const avatarContent = avatarUrl
    ? `<img src="${avatarUrl}" alt="${authorName || 'Citoyen'}" class="citizen-avatar-img" onerror="this.onerror=null; this.src='/images/avatar-amadou.jpg';" />`
    : `<div class="citizen-avatar-initials">${initials}</div>`;

  const isUltraZoom = zoomLevel >= 18;
  const isHighZoom = zoomLevel >= 16;
  const isNormZoom = zoomLevel === 15;

  let zoomClass = 'is-zoom-norm';
  let iconSize = [48, 54];
  let iconAnchor = [24, 52];
  let popupAnchor = [0, -50];

  if (isUltraZoom) {
    zoomClass = 'is-zoom-ultra';
    iconSize = [78, 88];
    iconAnchor = [39, 86];
    popupAnchor = [0, -84];
  } else if (isHighZoom) {
    zoomClass = 'is-zoom-high';
    iconSize = [62, 72];
    iconAnchor = [31, 70];
    popupAnchor = [0, -68];
  } else if (!isNormZoom) {
    zoomClass = 'is-zoom-low';
    iconSize = [38, 44];
    iconAnchor = [19, 42];
    popupAnchor = [0, -40];
  }

  const labelHtml = (isHighZoom && quartierLabel)
    ? `<div class="citizen-avatar-label">${quartierLabel}</div>`
    : '';

  const youBadgeHtml = isCurrentUser
    ? `<div class="citizen-you-badge">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>Vous</span>
      </div>`
    : '';

  return L.divIcon({
    className: `citizen-avatar-pin-wrapper ${isSelected ? 'is-selected' : ''} ${isCurrentUser ? 'is-current-user' : ''} ${zoomClass}`,
    html: `
      <div class="citizen-avatar-pin ${isSelected ? 'is-selected' : ''} ${isCurrentUser ? 'is-current-user' : ''} ${zoomClass}" style="--status-color: ${statusColor};">
        ${youBadgeHtml}
        ${labelHtml}
        <div class="citizen-avatar-pulse" style="background: ${isCurrentUser ? '#F59E0B' : statusColor};"></div>
        <div class="citizen-avatar-bubble" style="box-shadow: 0 0 0 ${isSelected ? '4px' : '3px'} ${statusColor}, 0 4px 10px rgba(0, 0, 0, 0.35);">
          ${avatarContent}
          <div class="citizen-avatar-badge" style="background-color: ${statusColor};">
            ${categorySvg}
          </div>
        </div>
        <div class="citizen-avatar-tip" style="border-top-color: ${isCurrentUser ? '#D97706' : statusColor};"></div>
      </div>
    `,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
}

/**
 * Marqueur Visuel Vivant de la Position Citoyenne Directe ("Vous êtes ici")
 */
function createUserLiveLocationIcon({ avatarUrl, authorName, zoomLevel = 15 }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) {
    return undefined;
  }
  const initials = authorName
    ? authorName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MOI';

  const avatarContent = avatarUrl
    ? `<img src="${avatarUrl}" alt="${authorName || 'Vous'}" class="citizen-avatar-img" onerror="this.onerror=null; this.src='/images/avatar-amadou.jpg';" />`
    : `<div class="citizen-avatar-initials">${initials}</div>`;

  return L.divIcon({
    className: 'citizen-avatar-pin-wrapper is-user-live-wrapper',
    html: `
      <div class="citizen-user-live-pin">
        <div class="citizen-live-badge">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Vous êtes ici</span>
        </div>
        <div class="citizen-user-live-pulse"></div>
        <div class="citizen-user-live-bubble">
          ${avatarContent}
        </div>
        <div class="citizen-user-live-tip"></div>
      </div>
    `,
    iconSize: [52, 58],
    iconAnchor: [26, 56],
    popupAnchor: [0, -54],
  });
}

/**
 * Marqueur Visuel Vivant d'un Point de Refuge (Waze / Google Maps Urgence)
 */
function createRefugePinIcon({ type, nom, capacite, zoomLevel }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) {
    return undefined;
  }
  const isHighZoom = zoomLevel >= 15;
  const isUltraZoom = zoomLevel >= 17;

  // Code couleur thématique et icône vectorielle SVG
  let typeColor = '#059669'; // Vert émeraude par défaut
  let svgIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  if (type === 'ecole') {
    typeColor = '#059669'; // Vert émeraude école
    svgIcon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    `;
  } else if (type === 'mosquee') {
    typeColor = '#7C3AED'; // Indigo / Violet
    svgIcon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    `;
  } else if (type === 'centre_sante') {
    typeColor = '#E11D48'; // Rose / Rouge secours
    svgIcon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `;
  } else if (type === 'mairie') {
    typeColor = '#D97706'; // Ambre
    svgIcon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="21" x2="21" y2="21"/>
        <line x1="9" y1="8" x2="9" y2="17"/>
        <line x1="15" y1="8" x2="15" y2="17"/>
        <path d="M4 21V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13"/>
        <polygon points="12 2 20 6 4 6 12 2"/>
      </svg>
    `;
  } else if (type === 'bâtiment_public') {
    typeColor = '#0284C7'; // Cyan bleu
    svgIcon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    `;
  }

  const labelHtml = (isHighZoom && nom)
    ? `<div class="refuge-pin-label font-sans">${nom}${capacite ? ` <span class="refuge-pin-cap">· ${capacite} pl.</span>` : ''}</div>`
    : '';

  return L.divIcon({
    className: 'refuge-pin-wrapper-div',
    html: `
      <div class="refuge-pin-box" style="--refuge-color: ${typeColor};">
        ${labelHtml}
        <div class="refuge-pin-bubble" style="border-color: ${typeColor};">
          <div class="refuge-pin-icon" style="color: ${typeColor};">
            ${svgIcon}
          </div>
          <div class="refuge-pin-shield-badge" style="background-color: ${typeColor};">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </div>
        <div class="refuge-pin-tip" style="border-top-color: ${typeColor};"></div>
      </div>
    `,
    iconSize: isUltraZoom ? [48, 56] : [40, 48],
    iconAnchor: isUltraZoom ? [24, 54] : [20, 46],
    popupAnchor: [0, -46],
  });
}

/**
 * Totem SIG d'en-tête de Zone à Risque
 */
function createZoneTotemIcon({ quartier, niveauRisque, scorePct }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) {
    return undefined;
  }
  const { hex, label } = riskInfo(niveauRisque);

  return L.divIcon({
    className: 'zone-totem-wrapper-div',
    html: `
      <div class="zone-totem-card" style="--zone-color: ${hex}; border-color: ${hex};">
        <div class="zone-totem-pulse" style="background-color: ${hex};"></div>
        <div class="zone-totem-body font-sans">
          <span class="zone-totem-title">${quartier}</span>
          <span class="zone-totem-badge" style="background-color: ${hex}25; color: ${hex};">
            ${label} · ${scorePct}%
          </span>
        </div>
      </div>
    `,
    iconSize: [160, 42],
    iconAnchor: [80, 21],
    popupAnchor: [0, -20],
  });
}

function MapViewportListener({ onViewportChange }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const notify = () => {
      let b = null;
      if (typeof map.getBounds === 'function') {
        const raw = map.getBounds();
        b = typeof raw?.pad === 'function' ? raw.pad(0.2) : raw;
      }
      const z = typeof map.getZoom === 'function' ? map.getZoom() : 15;
      onViewportChange({ zoom: z, bounds: b });
    };

    notify();
    if (typeof map.on === 'function') {
      map.on('moveend', notify);
      map.on('zoomend', notify);
      return () => {
        if (typeof map.off === 'function') {
          map.off('moveend', notify);
          map.off('zoomend', notify);
        }
      };
    }
  }, [map, onViewportChange]);
  return null;
}

function FocusSignalement({ signalements, selectedId, selectedQuartier, markerRefs }) {
  const map = useMap();
  const lastFocusedIdRef = useRef(null);

  useEffect(() => {
    if (!signalements?.length || (!selectedId && !selectedQuartier)) return;

    let target = null;
    if (selectedId) {
      target = signalements.find((s) => {
        const sid = String(s.id ?? s.properties?.id ?? '');
        const rawSid = s.properties?.rawBackendId ? String(s.properties.rawBackendId) : '';
        const matchId = String(selectedId).replace('backend-sig-', '').replace('shared-sig-', '');
        return sid === String(selectedId) || sid === matchId || rawSid === matchId;
      });
    }

    if (!target && selectedQuartier) {
      target = signalements.find((s) => {
        const q = s.properties?.citoyen_quartier || s.properties?.quartier || s.author?.quartier || '';
        return q.toLowerCase().includes(selectedQuartier.toLowerCase());
      });
    }

    if (target) {
      const point = pointToLatLng(target.geometry || target.localisation);
      if (point) {
        const key = target.id ?? target.properties?.id;
        if (lastFocusedIdRef.current !== `${key}-${selectedId}`) {
          lastFocusedIdRef.current = `${key}-${selectedId}`;
          map.flyTo(point, 16.5, { duration: 0.6 });
          map.once('moveend', () => {
            const marker = markerRefs.current?.[key];
            if (marker && typeof marker.openPopup === 'function') {
              marker.openPopup();
            }
          });
        }
      }
    }
  }, [signalements, selectedId, selectedQuartier, map, markerRefs]);

  return null;
}

// Recalibre immédiatement les dimensions internes de Leaflet dès que le conteneur change
function MapAutoResizer() {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      if (typeof map?.invalidateSize === 'function') {
        map.invalidateSize({ animate: false });
      }
    };
    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 350);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

// Recentre/zoome automatiquement sur l'itinéraire dès qu'il apparaît
function FitRoute({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (!coordinates?.length) return;
    map.fitBounds(
      coordinates.map(([lon, lat]) => [lat, lon]),
      { padding: [48, 48] }
    );
  }, [coordinates, map]);
  return null;
}

// Bouton flottant de recentrage territorial immédiat sur Thiaroye
function RecenterButton({ center = THIAROYE_CENTER, defaultZoom = 14.5 }) {
  const map = useMap();
  const containerRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (containerRef.current && typeof L !== 'undefined' && L.DomEvent) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handleRecenter = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (map && typeof map.flyTo === 'function') {
      setIsSpinning(true);
      map.flyTo(center, defaultZoom, { duration: 0.7 });
      setTimeout(() => setIsSpinning(false), 800);
    }
  };

  return (
    <div
      ref={containerRef}
      className="leaflet-bottom leaflet-right pointer-events-auto select-none"
      style={{ marginBottom: '28px', marginRight: '14px', zIndex: 1000 }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={handleRecenter}
    >
      <button
        type="button"
        onClick={handleRecenter}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border border-navy-100 dark:border-navy-800 text-navy-900 dark:text-white hover:text-[#CC131A] dark:hover:text-red-400 font-extrabold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
        title="Recentrer la vue panoramique sur Thiaroye-sur-Mer"
        aria-label="Recentrer la carte"
      >
        <Compass
          size={16}
          className={`text-[#CC131A] transition-transform duration-700 ${
            isSpinning ? 'animate-[spin_0.7s_ease-out]' : 'hover:rotate-45'
          }`}
        />
        <span className="hidden sm:inline font-black">Recentrer Thiaroye</span>
      </button>
    </div>
  );
}

function createClusterIcon(count, statusColor) {
  return L.divIcon({
    className: 'custom-leaflet-cluster-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${statusColor}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9999px; background: ${statusColor}; color: white; font-weight: 900; font-size: 13px; box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.35); border: 2.5px solid white; user-select: none;">
          ${count}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function ClusterMarker({ position, count, highestSeverity }) {
  const map = useMap();
  const clusterIcon = useMemo(
    () => createClusterIcon(count, highestSeverity),
    [count, highestSeverity]
  );

  return (
    <Marker
      position={position}
      icon={clusterIcon}
      zIndexOffset={800}
      eventHandlers={{
        click: () => {
          if (map && typeof map.flyTo === 'function') {
            const currentZoom = map.getZoom ? map.getZoom() : 13;
            map.flyTo(position, Math.min(currentZoom + 2.5, 16.5), { duration: 0.6 });
          }
        },
      }}
    />
  );
}

/**
 * Carte SIG partagée citoyen/autorité avec Avatars Vivants style "Snap Map" / Waze.
 */
export default function InteractiveMap({
  data = {},
  height = 560,
  route,
  selectedSignalementId = null,
  selectedQuartier = null,
  defaultBaseMap = 'satellite',
  onCalculateRouteFromPoint = null,
  visibleLayers = null,
  onToggleLayer = null,
  onToggleFullscreen = null,
  isFullscreen = false,
  userLocation = null,
}) {
  const { zones, inondations, segments, capteurs, signalements, refuges } = data;
  const markerRefs = useRef({});

  const availableLayers = Object.keys(LAYER_LABELS).filter((key) => {
    if (key === 'signalements') return !!signalements?.length;
    return !!data[key]?.features?.length;
  });

  const [internalVisible, setInternalVisible] = useState(() =>
    availableLayers.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const visible = visibleLayers || internalVisible;
  // Replié par défaut et placé à droite (le zoom natif de Leaflet occupe le
  // coin haut-gauche) pour ne jamais se superposer aux popups de couche.
  const [baseMap, setBaseMap] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_preferred_basemap');
      if (saved === 'plan' || saved === 'satellite') return saved;
    } catch {}
    return defaultBaseMap;
  });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [viewportBounds, setViewportBounds] = useState(null);

  const handleViewportChange = useCallback(({ zoom, bounds }) => {
    setZoomLevel(zoom);
    setViewportBounds(bounds);
  }, []);

  const isHighZoom = zoomLevel >= 16;

  const changeBaseMap = (mode) => {
    setBaseMap(mode);
    try {
      localStorage.setItem('mbeund_mi_preferred_basemap', mode);
    } catch {}
  };

  const toggle = (key) => {
    if (onToggleLayer) {
      onToggleLayer(key);
    } else {
      setInternalVisible((v) => ({ ...v, [key]: !v[key] }));
    }
  };

  // OPTIMISATION SCALABILITÉ : Clustering spatial par grille lorsque zoom < 14 et densité > 15 signalements
  const shouldClusterSignalements = zoomLevel < 14 && (signalements?.length || 0) > 15;

  const { clusteredSignalements, individualSignalements } = useMemo(() => {
    if (!shouldClusterSignalements || !signalements?.length) {
      return { clusteredSignalements: [], individualSignalements: signalements || [] };
    }

    const step = zoomLevel <= 11 ? 0.025 : zoomLevel === 12 ? 0.015 : 0.008;
    const grid = new Map();
    const direct = [];

    for (const f of signalements) {
      const point = pointToLatLng(f.geometry || f.localisation);
      if (!point) continue;
      const props = f.properties || f;
      const fid = f.id ?? props.id;
      const isSelected = !!selectedSignalementId && (
        String(fid) === String(selectedSignalementId) ||
        String(fid) === String(selectedSignalementId).replace('backend-sig-', '').replace('shared-sig-', '') ||
        String(props.rawBackendId) === String(selectedSignalementId)
      );
      const isCurrentUser = Boolean(props.isCurrentUser || props.isMine);

      if (isSelected || isCurrentUser) {
        direct.push(f);
        continue;
      }

      if (viewportBounds && typeof viewportBounds.contains === 'function' && !viewportBounds.contains(point)) {
        continue;
      }

      const gridKey = `${Math.floor(point[0] / step)}_${Math.floor(point[1] / step)}`;
      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey).push({ item: f, point });
    }

    const clusters = [];
    grid.forEach((group, key) => {
      if (group.length === 1) {
        direct.push(group[0].item);
      } else {
        const avgLat = group.reduce((acc, g) => acc + g.point[0], 0) / group.length;
        const avgLng = group.reduce((acc, g) => acc + g.point[1], 0) / group.length;

        let hasActive = false;
        let hasEnCours = false;
        for (const g of group) {
          const p = g.item.properties || g.item;
          const isRes = !!p.valide || p.statut === 'resolu';
          const isEnc = p.statut === 'en_cours';
          if (!isRes && !isEnc) hasActive = true;
          if (isEnc) hasEnCours = true;
        }

        const highestColor = hasActive ? '#DC2626' : (hasEnCours ? '#F59E0B' : '#10B981');

        clusters.push({
          id: `cluster-${key}`,
          position: [avgLat, avgLng],
          count: group.length,
          highestColor,
        });
      }
    });

    return { clusteredSignalements: clusters, individualSignalements: direct };
  }, [signalements, shouldClusterSignalements, zoomLevel, viewportBounds, selectedSignalementId]);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-navy-50 dark:border-navy-800 isolate z-10 w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Capsules flottantes de contrôle rapide directement intégrées sur la carte (Format Waze / Google Maps) */}
      <div className="absolute top-3 left-14 sm:left-16 z-[1000] flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-250px)] sm:max-w-[calc(100%-280px)] py-1 px-1 scrollbar-none pointer-events-auto">
        {['signalements', 'refuges', 'segments', 'zones'].map((key) => {
          if (!availableLayers.includes(key) && key !== 'signalements') return null;
          const isLayerActive = visible[key] !== false;
          const Icon = LAYER_ICONS[key] || MapPin;
          const count = key === 'signalements'
            ? (signalements?.length || 0)
            : key === 'refuges'
            ? (refuges?.features?.length || refuges?.length || 0)
            : null;

          return (
            <button
              key={`float-pill-${key}`}
              type="button"
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isLayerActive
                  ? 'bg-navy-950/90 dark:bg-white/95 text-white dark:text-navy-950 border-white/20 dark:border-navy-800'
                  : 'bg-white/70 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 border-white/40 dark:border-navy-800 line-through opacity-70'
              }`}
              title={`Afficher ou masquer : ${LAYER_LABELS[key]}`}
            >
              <Icon size={12} className={isLayerActive ? 'text-[#CC131A]' : 'opacity-40'} />
              <span>{LAYER_LABELS[key]?.split(' ')[0]}</span>
              {count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isLayerActive
                    ? 'bg-red-500/20 text-red-300 dark:text-red-700'
                    : 'bg-slate-200 dark:bg-navy-800 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sélecteur de fond de carte à l'intérieur de la carte : Plan vs Sol Réel (Satellite HD) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-white/95 dark:bg-navy/95 backdrop-blur p-1 rounded-xl border border-navy-50 dark:border-navy-800 shadow-md">
        <button
          type="button"
          onClick={() => changeBaseMap('plan')}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg transition ${
            baseMap === 'plan'
              ? 'bg-[#1B2A40] text-white shadow-xs'
              : 'text-navy-600 dark:text-navy-200 hover:text-navy-900 dark:hover:text-white'
          }`}
          aria-label="Mode Plan standard"
        >
          <MapIcon size={13} className="flex-shrink-0" />
          <span>Plan</span>
        </button>
        <button
          type="button"
          onClick={() => changeBaseMap('satellite')}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg transition ${
            baseMap === 'satellite'
              ? 'bg-[#CC131A] text-white shadow-xs font-black'
              : 'text-navy-600 dark:text-navy-200 hover:text-navy-900 dark:hover:text-white'
          }`}
          aria-label="Mode Satellite HD"
        >
          <Satellite size={13} className="flex-shrink-0" />
          <span>Satellite</span>
        </button>

        {onToggleFullscreen && (
          <>
            <div className="w-[1px] h-3.5 bg-navy-100 dark:bg-navy-800 mx-0.5" />
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg transition text-[#CC131A] hover:bg-[#CC131A]/10 active:scale-95 cursor-pointer"
              aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              title={isFullscreen ? 'Quitter le plein écran (Échap)' : 'Agrandir la carte en plein écran'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={13} className="flex-shrink-0" />
                  <span className="hidden sm:inline">Réduire</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} className="flex-shrink-0" />
                  <span className="hidden sm:inline">Plein écran</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Incitation contextuelle au fort zoom pour révéler le sol réel si en mode plan */}
      {isHighZoom && baseMap === 'plan' && (
        <div className="absolute top-14 right-3 z-[1000] bg-white/95 dark:bg-navy/95 backdrop-blur-md border border-red-300 dark:border-red-900 shadow-xl rounded-xl p-2.5 max-w-[210px] text-left transition-all">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-navy-950 dark:text-white">
            <Satellite size={13} className="text-[#CC131A] flex-shrink-0" />
            <span>Sol réel haute précision</span>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">
            Activez le mode Satellite HD pour visualiser les ruelles et toitures réelles.
          </p>
          <button
            type="button"
            onClick={() => changeBaseMap('satellite')}
            className="mt-1.5 w-full py-1 px-2 text-[10px] font-black text-white bg-[#CC131A] hover:bg-[#b01016] rounded-md transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Satellite size={12} />
            <span>Passer en Satellite HD</span>
          </button>
        </div>
      )}

      <MapContainer
        center={THIAROYE_CENTER}
        zoom={14.5}
        minZoom={12}
        maxZoom={20}
        maxBounds={THIAROYE_BOUNDS}
        maxBoundsViscosity={0.85}
        scrollWheelZoom
        dragging
        touchZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomControl position="topleft" />
        <MapAutoResizer />
        <MapViewportListener onViewportChange={handleViewportChange} />
        <RecenterButton center={THIAROYE_CENTER} defaultZoom={14.5} />

        {/* Triple couche Satellite Ultra-Précision :
            1. Photo aérienne satellite HD réelle (Esri World Imagery)
            2. Tracé précis des routes, ruelles et axes (Esri World Transportation)
            3. Noms de toutes les rues, ruelles et concessions (CartoDB Voyager Labels) */}
        {baseMap === 'satellite' ? (
          <>
            <TileLayer
              key="satellite-base-layer"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
              maxNativeZoom={19}
            />
            <TileLayer
              key="satellite-roads-layer"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
              maxNativeZoom={19}
              opacity={0.75}
            />
            <TileLayer
              key="satellite-labels-layer"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
              maxNativeZoom={19}
              opacity={0.85}
            />
          </>
        ) : (
          <TileLayer
            key="plan-layer"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
            maxNativeZoom={19}
          />
        )}

        <FocusSignalement
          signalements={signalements}
          selectedId={selectedSignalementId}
          selectedQuartier={selectedQuartier}
          markerRefs={markerRefs}
        />

        {visible.zones !== false &&
          (zones?.features || zones?.results?.features || (Array.isArray(zones) ? zones : []))?.map((f) => {
            const props = f.properties || f;
            const niveau = props.niveau_risque || 'faible';
            const { hex, label } = riskInfo(niveau);
            const scorePct = Math.round(Number(props.score_risque_moyen ?? 0) * 100);
            const center = getPolygonCenter(f.geometry);
            const totemIcon = createZoneTotemIcon({
              quartier: props.quartier,
              niveauRisque: niveau,
              scorePct,
            });

            return (
              <span key={`zone-bundle-${f.id ?? props.id}`}>
                <Polygon
                  positions={polygonToLatLngs(f.geometry)}
                  pathOptions={{
                    color: hex,
                    fillColor: hex,
                    fillOpacity: isHighZoom ? 0.02 : 0.08,
                    weight: isHighZoom ? 1.2 : 1.5,
                  }}
                />
                {center && totemIcon && (
                  <Marker
                    position={center}
                    icon={totemIcon}
                  >
                    <Popup
                      className="citizen-map-popup"
                      minWidth={260}
                      maxWidth={320}
                      autoPan={true}
                      autoPanPaddingTopLeft={[20, 95]}
                      autoPanPaddingBottomRight={[20, 20]}
                      closeButton={true}
                    >
                      <div className="text-xs space-y-2.5 p-3 min-w-[220px] font-sans">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800 pr-7">
                          <span className="font-extrabold text-sm text-navy-950 dark:text-white">{props.quartier}</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{ backgroundColor: `${hex}20`, color: hex }}
                          >
                            {label}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Indice de risque moyen :</span>
                            <span className="font-extrabold text-xs" style={{ color: hex }}>
                              {scorePct} %
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(5, scorePct))}%`,
                                backgroundColor: hex,
                              }}
                            />
                          </div>
                        </div>
                        {props.description && (
                          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-navy-900/50 p-2 rounded-lg border border-slate-100 dark:border-navy-800">
                            {props.description}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </span>
            );
          })}



        {visible.segments !== false &&
          (segments?.features || segments?.results?.features || (Array.isArray(segments) ? segments : []))?.map((f) => {
            const segScore = Number(f.properties?.score_risque_actuel ?? f.score_risque_actuel ?? 0);
            const segPct = Math.round(segScore * 100);
            const color = segmentColor(segScore);
            return (
              <Polyline
                key={`segment-${f.id}`}
                positions={lineToLatLngs(f.geometry)}
                pathOptions={{
                  color,
                  weight: isHighZoom ? 6.5 : 4.5,
                  opacity: 0.95,
                }}
              >
                <Popup
                  className="citizen-map-popup"
                  minWidth={260}
                  maxWidth={320}
                  autoPan={true}
                  closeButton={true}
                >
                  <div className="text-xs space-y-2.5 p-3 min-w-[210px] font-sans">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-navy-800">
                      <div className="w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
                        <Route size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-sm text-navy-950 dark:text-white block truncate">{f.properties.nom || 'Rue'}</span>
                        <p className="text-[10px] text-slate-500">Drainage : {f.properties.etat_drainage || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Vulnérabilité ruissellement :</span>
                        <span className="font-extrabold" style={{ color }}>{segPct} %</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, segPct))}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {visible.capteurs !== false &&
          capteurs?.features?.map((f) => {
            const point = pointToLatLng(f.geometry);
            if (!point) return null;
            return (
              <CircleMarker
                key={`capteur-${f.id}`}
                center={point}
                radius={7}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: f.properties.actif ? '#3C9A5F' : '#8AA0B8',
                  fillOpacity: 1,
                }}
              >
                <Popup
                  className="citizen-map-popup"
                  minWidth={260}
                  maxWidth={320}
                  autoPan={true}
                  closeButton={true}
                >
                  <div className="text-xs space-y-2 p-3 min-w-[200px] font-sans">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-navy-800 pr-7">
                      <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0 ${f.properties.actif ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                        <Radio size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-sm text-navy-950 dark:text-white block truncate">{f.properties.nom}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{f.properties.type || 'Capteur IoT'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Statut réseau :</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.properties.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                        {f.properties.actif ? 'En ligne · Connecté' : 'Hors ligne'}
                      </span>
                    </div>
                    {f.properties.dernier_releve && (
                      <div className="text-[10px] text-slate-400">
                        Dernier relevé : {formatDate(f.properties.dernier_releve)}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {visible.refuges !== false &&
          (refuges?.features || refuges?.results?.features || (Array.isArray(refuges) ? refuges : []))?.map((f) => {
            const point = pointToLatLng(f.geometry || f.localisation);
            if (!point) return null;
            if (viewportBounds && typeof viewportBounds.contains === 'function' && !viewportBounds.contains(point)) {
              return null;
            }
            const props = f.properties || f;
            const fid = f.id ?? props.id;
            const refugeIcon = createRefugePinIcon({
              type: props.type_refuge,
              nom: props.nom,
              capacite: props.capacite,
              zoomLevel,
            });

            const typeLabel = {
              ecole: 'École surélevée',
              mosquee: 'Mosquée communautaire',
              centre_sante: 'Centre de santé',
              mairie: 'Mairie (Coordination)',
              bâtiment_public: 'Bâtiment public d’accueil',
              autre: 'Point de repli sécurisé',
            };

            return (
              <Marker
                key={`refuge-pin-${fid}-${zoomLevel >= 15 ? 'hi' : 'low'}`}
                position={point}
                icon={refugeIcon}
              >
                <Popup
                  className="citizen-map-popup"
                  minWidth={290}
                  maxWidth={340}
                  autoPan={true}
                  autoPanPaddingTopLeft={[20, 95]}
                  autoPanPaddingBottomRight={[20, 20]}
                  keepInView={true}
                  closeButton={true}
                >
                  <div className="text-xs space-y-2.5 p-3 min-w-[240px] max-w-[290px] font-sans">
                    {/* En-tête : Icône Refuge/Bâtiment + Nom + Quartier */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-navy-800 pr-7">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-600/30">
                        <Building2 size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-sm text-navy-950 dark:text-white leading-tight block truncate">
                          {props.nom}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={11} className="text-[#CC131A] flex-shrink-0" />
                          <span className="truncate">{props.quartier}</span>
                        </p>
                      </div>
                    </div>

                    {/* Badges : Type + Statut sécurisé */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
                        {typeLabel[props.type_refuge] || 'Lieu sûr'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        Refuge opérationnel
                      </span>
                    </div>

                    {/* Grille d'infos : Capacité & Contact */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-navy-800">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Capacité</span>
                        <span className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1 mt-0.5">
                          <Users size={12} className="text-emerald-600" />
                          <span className="truncate">{props.capacite ? `${props.capacite} places` : 'Places libres'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Contact 24/7</span>
                        {props.contact ? (
                          <a
                            href={`tel:${props.contact.replace(/\s+/g, '')}`}
                            className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <PhoneCall size={12} className="flex-shrink-0" />
                            <span className="truncate">{props.contact}</span>
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 mt-0.5 block">18 (Secours)</span>
                        )}
                      </div>
                    </div>

                    {/* Adresse / Accès */}
                    {props.adresse && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{props.adresse}</span>
                      </p>
                    )}

                    {/* Description / Caractéristiques */}
                    {(props.description || props.notes) && (
                      <p className="text-xs text-navy-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-navy-950/40 p-2 rounded-lg border border-slate-100 dark:border-navy-800">
                        {props.description || props.notes}
                      </p>
                    )}

                    {/* Bouton d'action : Calculer l'itinéraire vers ce refuge */}
                    {onCalculateRouteFromPoint && point && (
                      <button
                        type="button"
                        onClick={() => onCalculateRouteFromPoint({ lat: point[0], lon: point[1] })}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer mt-1"
                      >
                        <Navigation size={14} className="flex-shrink-0" />
                        <span>Itinéraire vers ce refuge sécurisé</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Clusters de signalements quand le zoom est dézoomé */}
        {visible.signalements !== false &&
          clusteredSignalements.map((c) => (
            <ClusterMarker
              key={c.id}
              position={c.position}
              count={c.count}
              highestSeverity={c.highestColor}
            />
          ))}

        {visible.signalements !== false &&
          individualSignalements?.map((f) => {
            const point = pointToLatLng(f.geometry || f.localisation);
            if (!point) return null;
            const props = f.properties || f;
            const fid = f.id ?? props.id;
            const isResolu = !!props.valide || props.statut === 'resolu';
            const isEnCours = props.statut === 'en_cours';

            // Statut coloré dynamique
            let statusColor = '#DC2626'; // Rouge vif (Eau critique / Actif)
            let statusBadge = {
              label: 'Alerte active · Eau critique',
              bg: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900',
            };
            if (isResolu) {
              statusColor = '#10B981'; // Vert émeraude
              statusBadge = {
                label: 'Sécurisé & Traité',
                bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
              };
            } else if (isEnCours) {
              statusColor = '#F59E0B'; // Orange ambre
              statusBadge = {
                label: 'Intervention en cours',
                bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
              };
            }

            const rawAuthor = props.citoyen_prenom
              ? `${props.citoyen_prenom} ${props.citoyen_nom || ''}`.trim()
              : (props.author?.name || props.citoyen_nom || props.auteur || 'Sentinelle Citoyenne');
            const author = sanitizePublicAuthor(rawAuthor, 'Sentinelle Citoyenne');
            const cleanDescription = sanitizePublicText(props.description || 'Montée des eaux constatée dans la zone.');
            const quartier = props.citoyen_quartier || props.author?.quartier || props.quartier || 'Thiaroye-sur-Mer';
            const rue = props.rue || props.adresse || null;
            const photo = props.photo || (props.photos && props.photos[0]) || props.image || null;

            const isSelected = !!selectedSignalementId && (
              String(fid) === String(selectedSignalementId) ||
              String(fid) === String(selectedSignalementId).replace('backend-sig-', '').replace('shared-sig-', '') ||
              String(props.rawBackendId) === String(selectedSignalementId)
            );

            const isCurrentUser = Boolean(props.isCurrentUser || props.isMine);

            // OPTIMISATION SCALABILITÉ : Viewport Bounding Box Culling
            // Ne rendre dans le DOM que les signalements visibles à l'écran (+ marge de confort de 20%)
            // Le signalement sélectionné et celui du citoyen connecté sont TOUJOURS conservés.
            if (viewportBounds && !isSelected && !isCurrentUser) {
              if (typeof viewportBounds.contains === 'function' && !viewportBounds.contains(point)) {
                return null;
              }
            }

            const isShared = checkIsSharedOnCommunity(f);

            const avatarUrl = (isCurrentUser && props.currentUserAvatar)
              ? props.currentUserAvatar
              : props.author?.avatar || getPublicAvatar({
                  name: author,
                  id: fid,
                  preferredAvatar: props.avatar,
                  context: props.description,
                });

            const customIcon = createCitizenAvatarIcon({
              avatarUrl,
              statusColor,
              isSelected,
              authorName: author,
              category: props.categorie,
              zoomLevel,
              quartierLabel: rue || quartier,
              isCurrentUser,
            });

            const zoomBucket = zoomLevel >= 18 ? 'ultra' : zoomLevel >= 16 ? 'high' : zoomLevel === 15 ? 'norm' : 'low';

            return (
              <span key={`sig-bundle-${fid}`}>
                {/* 1. Point d'impact radar au sol : très précis et discret pour laisser la ruelle 100% visible */}
                <CircleMarker
                  center={point}
                  radius={isSelected ? (isHighZoom ? 14 : 10) : (isHighZoom ? 5 : 4)}
                  pathOptions={{
                    color: isCurrentUser ? '#F59E0B' : statusColor,
                    weight: isSelected ? 2 : 1.2,
                    fillColor: isCurrentUser ? '#F59E0B' : statusColor,
                    fillOpacity: isSelected ? 0.35 : 0.2,
                  }}
                />

                {/* 2. Marqueur Avatar Vivant réactif au zoom (clé incluant zoomBucket pour forcer le redimensionnement) */}
                <Marker
                  key={`sig-marker-${fid}-${zoomBucket}`}
                  position={point}
                  icon={customIcon}
                  zIndexOffset={isCurrentUser ? 1000 : (isSelected ? 500 : 0)}
                  ref={(ref) => {
                    if (ref) markerRefs.current[fid] = ref;
                  }}
                >
                  <Popup
                    className="citizen-map-popup"
                    minWidth={300}
                    maxWidth={350}
                    autoPan={true}
                    autoPanPaddingTopLeft={[20, 95]}
                    autoPanPaddingBottomRight={[20, 20]}
                    keepInView={true}
                    closeButton={true}
                  >
                    <div className="text-xs space-y-2.5 p-3 min-w-[240px] max-w-[290px] font-sans">
                      {/* En-tête : Avatar + Identité + Quartier */}
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-navy-800 pr-7">
                        <img
                          src={avatarUrl}
                          alt={author}
                          className="w-10 h-10 rounded-full object-cover ring-2 flex-shrink-0"
                          style={{ ringColor: isCurrentUser ? '#F59E0B' : statusColor }}
                          onError={(e) => {
                            e.currentTarget.src = '/images/avatar-amadou.jpg';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-sm text-navy-950 dark:text-white truncate">
                              {isCurrentUser ? `${author} (Vous)` : author}
                            </span>
                            {isCurrentUser && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex-shrink-0 shadow-2xs">
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                                Votre signalement
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="text-[#CC131A] flex-shrink-0" />
                            <span className="truncate">{quartier}{rue ? ` · ${rue}` : ''}</span>
                          </p>
                        </div>
                      </div>

                      {/* Statut & Catégorie */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
                          {props.categorie || 'Inondation'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Photo agrandie du terrain au ratio compact pour une hauteur maîtrisée */}
                      {photo && (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-navy-700">
                          <img
                            src={photo}
                            alt="Observation terrain"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                            <Eye size={10} />
                            <span>Photo terrain</span>
                          </div>
                        </div>
                      )}

                      {/* Description exacte rédigée par l'habitant (assainie de tout numéro personnel) */}
                      <p className="text-xs text-navy-900 dark:text-slate-100 leading-relaxed break-words">
                        {cleanDescription}
                      </p>

                      {/* Bouton pour basculer directement en mode Satellite HD pour voir le sol réel */}
                      {baseMap !== 'satellite' && (
                        <button
                          type="button"
                          onClick={() => changeBaseMap('satellite')}
                          className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition border border-slate-200 dark:border-navy-700 cursor-pointer"
                        >
                          <Satellite size={13} className="text-[#CC131A] flex-shrink-0" />
                          <span>Voir la concession en Satellite HD</span>
                        </button>
                      )}

                      {/* Bouton pour déclencher l'itinéraire d'évacuation sécurisé depuis ce point précis */}
                      {onCalculateRouteFromPoint && point && (
                        <button
                          type="button"
                          onClick={() => onCalculateRouteFromPoint({ lat: point[0], lon: point[1] })}
                          className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Navigation size={14} className="flex-shrink-0" />
                          <span>Itinéraire de secours depuis ce point</span>
                        </button>
                      )}

                      {/* Réciprocité : Espace Communauté vs Mention confidentielle sécurisée */}
                      <div className="pt-2 border-t border-slate-100 dark:border-navy-800">
                        {isShared ? (
                          <Link
                            to={`/citoyen/communaute?postId=${encodeURIComponent(props.rawBackendId || fid)}`}
                            className="citizen-map-btn w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-black shadow-md transition-all active:scale-98"
                            style={{
                              backgroundColor: '#CC131A',
                              color: '#ffffff',
                              textDecoration: 'none',
                            }}
                          >
                            <MessageCircle size={15} className="text-white flex-shrink-0" />
                            <span className="text-white font-black text-xs tracking-tight">Voir la discussion dans la Communauté</span>
                            <ExternalLink size={13} className="text-white opacity-90 flex-shrink-0" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-navy-900/60 p-2 rounded-lg border border-slate-200 dark:border-navy-800 font-medium">
                            <ShieldCheck size={14} className="text-teal-600 flex-shrink-0" />
                            <span>Signalement officiel sécurisé transmis aux autorités</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </span>
            );
          })}

        {/* ── MARQUEUR LIVE "VOUS ÊTES ICI" (POSITION CITOYENNE DIRECTE) ── */}
        {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lon === 'number' && (
          <span key="user-live-location-bundle">
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={18}
              pathOptions={{
                color: '#2563EB',
                weight: 2,
                fillColor: '#3B82F6',
                fillOpacity: 0.25,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={createUserLiveLocationIcon({
                avatarUrl: userLocation.avatar,
                authorName: userLocation.name,
                zoomLevel,
              })}
              zIndexOffset={2000}
            >
              <Popup
                className="citizen-map-popup"
                minWidth={280}
                maxWidth={320}
                autoPan={true}
                autoPanPaddingTopLeft={[20, 95]}
                autoPanPaddingBottomRight={[20, 20]}
                keepInView={true}
                closeButton={true}
              >
                <div className="text-xs space-y-2.5 p-3 min-w-[240px] max-w-[280px] font-sans">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-navy-800 pr-7">
                    <img
                      src={userLocation.avatar || '/images/avatar-amadou.jpg'}
                      alt={userLocation.name || 'Vous'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/images/avatar-amadou.jpg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-sm text-navy-950 dark:text-white truncate">
                          {userLocation.name || 'Votre compte'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 flex-shrink-0 shadow-2xs">
                          <Star size={10} className="fill-blue-500 text-blue-500" />
                          Vous êtes ici
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={11} className="text-blue-600 flex-shrink-0" />
                        <span>Position sentinelle · {userLocation.quartier || 'Thiaroye-sur-Mer'}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Vous êtes positionné en direct au cœur de Thiaroye-sur-Mer. Vous pouvez observer les points de vigilance autour de vous ou signaler un problème.
                  </p>
                  <div className="pt-1 flex flex-col gap-1.5">
                    <Link
                      to="/citizen/signaler"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#CC131A] hover:bg-[#b01016] text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                    >
                      <MapPin size={12} />
                      Signaler un risque autour de moi
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          </span>
        )}

        {route?.coordinates?.length > 0 && (
          <>
            <Polyline
              positions={route.coordinates.map(([lon, lat]) => [lat, lon])}
              pathOptions={{ color: '#0D9488', weight: 7, opacity: 0.3 }}
            />
            <Polyline
              positions={route.coordinates.map(([lon, lat]) => [lat, lon])}
              pathOptions={{ color: '#0D9488', weight: 4, dashArray: '2,10', lineCap: 'round' }}
            />
            <CircleMarker
              center={[route.coordinates[0][1], route.coordinates[0][0]]}
              radius={7}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#1B2A40', fillOpacity: 1 }}
            >
              <Popup>Départ</Popup>
            </CircleMarker>
            <CircleMarker
              center={[route.coordinates.at(-1)[1], route.coordinates.at(-1)[0]]}
              radius={8}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#0D9488', fillOpacity: 1 }}
            >
              <Popup>Point sûr le plus proche</Popup>
            </CircleMarker>
            <FitRoute coordinates={route.coordinates} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
