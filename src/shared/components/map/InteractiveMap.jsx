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
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { riskInfo } from '../RiskBadge';
import { polygonToLatLngs, lineToLatLngs, pointToLatLng, getPolygonCenter } from './geoUtils';
import { getPublicAvatar } from '../../utils/avatarResolver';
import { sanitizePublicAuthor, sanitizePublicText } from '../../utils/sanitizer';

// Coordonnées optimales englobant l'intégralité du territoire de Thiaroye-sur-Mer
// (du littoral et de la plage au sud, à la cuvette ouest, jusqu'à la gare et Guinaw Rail)
const THIAROYE_CENTER = [14.747, -17.385];

// Limites géographiques de sécurité élargies (Presqu'île du Cap-Vert, Dakar et abords de Thiaroye)
// Évite tout blocage du moteur Leaflet lorsque le viewport mobile/tablette dépasse le territoire restreint
const THIAROYE_BOUNDS = [
  [14.580, -17.580], // Sud-Ouest maritime étendu
  [14.880, -17.220], // Nord-Est terrestre étendu
];

export const LAYER_LABELS = {
  zones: 'Zones à risque',
  capteurs: 'Capteurs',
  signalements: 'Signalements citoyens',
  refuges: 'Points de refuge',
};

export const LAYER_SHORT_LABELS = {
  zones: 'Zones',
  capteurs: 'Capteurs',
  signalements: 'Signalements',
  refuges: 'Refuges',
};

export const LAYER_ICONS = {
  zones: ShieldAlert,
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
  isFront = false,
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
    className: `citizen-avatar-pin-wrapper ${isSelected ? 'is-selected' : ''} ${isFront ? 'is-front-marker' : ''} ${isCurrentUser ? 'is-current-user' : ''} ${zoomClass}`,
    html: `
      <div class="citizen-avatar-pin ${isSelected ? 'is-selected' : ''} ${isFront ? 'is-front-marker' : ''} ${isCurrentUser ? 'is-current-user' : ''} ${zoomClass}" style="--status-color: ${statusColor};">
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
 * Marqueur Visuel Vivant de la Position Citoyenne Directe ("Vous êtes ici", "Étape X", "Mis à l'abri")
 */
function createUserLiveLocationIcon({
  avatarUrl,
  authorName,
  zoomLevel = 15,
  isSafe = false,
  isNavigating = false,
  stepNumber = null,
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
    : 'MOI';

  const avatarContent = avatarUrl
    ? `<img src="${avatarUrl}" alt="${authorName || 'Vous'}" class="citizen-avatar-img" onerror="this.onerror=null; this.src='/images/avatar-amadou.jpg';" />`
    : `<div class="citizen-avatar-initials">${initials}</div>`;

  let badgeHtml = `
    <div class="citizen-live-badge">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span>Vous êtes ici</span>
    </div>
  `;
  let extraClass = '';

  if (isSafe) {
    extraClass = 'is-user-safe';
    badgeHtml = `
      <div class="citizen-live-badge citizen-safe-badge">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Mis à l'abri</span>
      </div>
    `;
  } else if (isNavigating) {
    extraClass = 'is-user-navigating';
    badgeHtml = `
      <div class="citizen-live-badge citizen-nav-badge">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        <span>Étape ${stepNumber || 1}</span>
      </div>
    `;
  }

  return L.divIcon({
    className: `citizen-avatar-pin-wrapper is-user-live-wrapper ${extraClass}`,
    html: `
      <div class="citizen-user-live-pin ${extraClass}">
        ${badgeHtml}
        <div class="citizen-user-live-pulse ${extraClass}"></div>
        <div class="citizen-user-live-bubble ${extraClass}">
          ${avatarContent}
        </div>
        <div class="citizen-user-live-tip ${extraClass}"></div>
      </div>
    `,
    iconSize: [54, 60],
    iconAnchor: [27, 58],
    popupAnchor: [0, -56],
  });
}

/**
 * Marqueur Visuel Vivant d'un Point de Refuge (Waze / Google Maps Urgence)
 */
function createRefugePinIcon({ type, nom, capacite, zoomLevel, isFront = false }) {
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

  const labelHtml = isHighZoom
    ? `<div class="refuge-mini-badge font-sans">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Refuge</span>
      </div>`
    : '';

  const cleanTitle = nom ? `${nom}${capacite ? ` (${capacite} places)` : ''}` : 'Point de refuge sécurisé';

  return L.divIcon({
    className: `refuge-pin-wrapper-div ${isFront ? 'is-front-marker' : ''}`,
    html: `
      <div class="refuge-pin-box ${isFront ? 'is-front-marker' : ''}" style="--refuge-color: ${typeColor};" title="${cleanTitle}">
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
function createZoneTotemIcon({ quartier, niveauRisque, scorePct, isFront = false }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) {
    return undefined;
  }
  const { hex, label } = riskInfo(niveauRisque);

  return L.divIcon({
    className: `zone-totem-wrapper-div ${isFront ? 'is-front-marker' : ''}`,
    html: `
      <div class="zone-totem-card ${isFront ? 'is-front-marker' : ''}" style="--zone-color: ${hex}; border-color: ${hex};">
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

function createRouteEndpointIcon({ type = 'depart' }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) return undefined;
  const isDepart = type === 'depart';
  const color = isDepart ? '#0284C7' : '#059669';
  const text = isDepart ? 'DÉPART' : 'REFUGE';
  const iconSvg = isDepart
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="#ffffff"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  return L.divIcon({
    className: 'route-endpoint-pin-div',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <span style="position: absolute; top: 0; width: 36px; height: 36px; border-radius: 9999px; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9999px; background: ${color}; color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.4); border: 2.5px solid white;">
          ${iconSvg}
        </div>
        <div style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #071322; color: white; font-size: 9px; font-weight: 900; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.3); text-transform: uppercase;">
          ${text}
        </div>
      </div>
    `,
    iconSize: [60, 56],
    iconAnchor: [30, 20],
    popupAnchor: [0, -22],
  });
}

function createNavigationStepIcon({ stepNumber }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) return undefined;
  return L.divIcon({
    className: 'nav-step-active-pin-div',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <span style="position: absolute; top: 0; width: 44px; height: 44px; border-radius: 9999px; background-color: #10B981; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 9999px; background: #059669; color: white; font-weight: 900; font-size: 14px; box-shadow: 0 6px 16px rgba(5, 150, 105, 0.6); border: 3px solid white;">
          ${stepNumber}
        </div>
        <div style="margin-top: 2px; padding: 2px 8px; border-radius: 9999px; background: #064E3B; color: #6EE7B7; font-size: 10px; font-weight: 900; letter-spacing: 0.05em; border: 1px solid #10B981; box-shadow: 0 2px 8px rgba(0,0,0,0.4); text-transform: uppercase; white-space: nowrap;">
          À suivre
        </div>
      </div>
    `,
    iconSize: [64, 62],
    iconAnchor: [32, 22],
    popupAnchor: [0, -26],
  });
}

function createAvoidedFloodedRoadIcon({ nom }) {
  if (typeof window === 'undefined' || typeof L === 'undefined' || !L?.divIcon) return undefined;
  return L.divIcon({
    className: 'avoided-road-pin-div',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <span style="position: absolute; top: 0; width: 32px; height: 32px; border-radius: 9999px; background-color: #EF4444; opacity: 0.45; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 9999px; background: #DC2626; color: white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5); border: 2px solid white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div style="margin-top: 2px; padding: 1px 6px; border-radius: 6px; background: #7F1D1D; color: #FCA5A5; font-size: 9px; font-weight: 800; border: 1px solid #EF4444; box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap;">
          Axe inondé évité
        </div>
      </div>
    `,
    iconSize: [86, 50],
    iconAnchor: [43, 16],
    popupAnchor: [0, -18],
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
        b = typeof raw?.pad === 'function' ? raw.pad(0.5) : raw;
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
    if (!map) return;
    const handleResize = () => {
      if (typeof map.invalidateSize === 'function') {
        map.invalidateSize({ animate: false });
      }
    };
    handleResize();
    const t0 = setTimeout(handleResize, 50);
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 350);
    const t3 = setTimeout(handleResize, 750);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

// Capture de référence vers l'instance Leaflet globale du conteneur
function MapInstanceCapture({ onMap }) {
  const map = useMap();
  useEffect(() => {
    if (map && onMap) {
      onMap(map);
    }
  }, [map, onMap]);
  return null;
}

// Auto-recentre la vue dès qu'un popup s'ouvre pour garantir qu'il soit toujours 100% visible
function MapPopupAutoPanner() {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof map.on !== 'function') return;

    const handlePopupOpen = (e) => {
      const popup = e?.popup;
      if (!popup || typeof popup.getLatLng !== 'function') return;
      const latlng = popup.getLatLng();
      if (!latlng) return;

      // Décaler vers le haut pour compenser la hauteur du popup (~120-140px)
      // et éviter d'être masqué par les boutons de filtres supérieurs ou les overlays
      if (typeof map.project === 'function' && typeof map.unproject === 'function') {
        const px = map.project(latlng);
        px.y -= 120;
        const targetLatLng = map.unproject(px);
        if (typeof map.panTo === 'function') {
          map.panTo(targetLatLng, { animate: true, duration: 0.45 });
        }
      }
    };

    map.on('popupopen', handlePopupOpen);
    return () => {
      if (typeof map.off === 'function') {
        map.off('popupopen', handlePopupOpen);
      }
    };
  }, [map]);
  return null;
}

// Recentre/zoome automatiquement sur l'itinéraire dès qu'il apparaît avec marges adaptées
function FitRoute({ coordinates, arrivalMarkerRef }) {
  const map = useMap();
  useEffect(() => {
    if (!coordinates?.length || !map || typeof map.fitBounds !== 'function') return;
    try {
      const bounds = coordinates.map(([lon, lat]) => [lat, lon]);
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 220],
        maxZoom: 16.5,
        animate: true,
        duration: 0.6,
      });

      const timer = setTimeout(() => {
        if (arrivalMarkerRef?.current && typeof arrivalMarkerRef.current.openPopup === 'function') {
          arrivalMarkerRef.current.openPopup();
        }
      }, 700);

      return () => clearTimeout(timer);
    } catch {}
  }, [coordinates, map, arrivalMarkerRef]);
  return null;
}

// Accompagne visuellement le guidage pas-à-pas le long des ruelles
function NavigationStepFollower({ isNavigating, currentStepIndex, instructions, coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!isNavigating || !coordinates?.length || !map) return;

    const totalSteps = instructions?.length || 1;
    const ratio = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 0;
    const coordIdx = Math.min(
      coordinates.length - 1,
      Math.max(0, Math.round(ratio * (coordinates.length - 1)))
    );
    const coord = coordinates[coordIdx];
    if (!coord) return;

    const targetPoint = [coord[1], coord[0]];
    if (typeof map.project === 'function' && typeof map.unproject === 'function') {
      const px = map.project(targetPoint);
      // Décalage vers le bas (+115px) : positionne le citoyen et l'étape dans la moitié haute dégagée de la carte,
      // restant 100% visibles sans être masqués par le bandeau de guidage du bas
      px.y += 115;
      const targetLatLng = map.unproject(px);
      if (typeof map.flyTo === 'function') {
        map.flyTo(targetLatLng, 17.5, { duration: 0.55 });
      }
    } else if (typeof map.flyTo === 'function') {
      map.flyTo(targetPoint, 17.5, { duration: 0.55 });
    }
  }, [isNavigating, currentStepIndex, instructions, coordinates, map]);

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
  itineraireInstructions = null,
  isNavigating = false,
  currentStepIndex = 0,
  selectedSignalementId = null,
  selectedQuartier = null,
  defaultBaseMap = 'satellite',
  onCalculateRouteFromPoint = null,
  visibleLayers = null,
  onToggleLayer = null,
  onToggleFullscreen = null,
  isFullscreen = false,
  userLocation = null,
  onResetUserPosition = null,
  focusAvoidedRoadTrigger = null,
}) {
  const { zones, inondations, segments, capteurs, signalements, refuges } = data;
  const markerRefs = useRef({});
  const navStepMarkerRef = useRef(null);
  const arrivalMarkerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [frontSignalementId, setFrontSignalementId] = useState(null);
  const [frontElementId, setFrontElementId] = useState(null);

  const handleMapReady = useCallback((m) => {
    mapInstanceRef.current = m;
  }, []);

  const panMapTo = useCallback((point, offsetPxY = 120, targetZoom = null) => {
    const map = mapInstanceRef.current;
    if (!map || !point) return;
    try {
      if (targetZoom && typeof map.flyTo === 'function') {
        map.flyTo(point, targetZoom, { animate: true, duration: 0.45 });
        setTimeout(() => {
          try {
            if (typeof map.project === 'function' && typeof map.unproject === 'function') {
              const px = map.project(point);
              px.y -= offsetPxY;
              const target = map.unproject(px);
              if (typeof map.panTo === 'function') {
                map.panTo(target, { animate: true, duration: 0.3 });
              }
            }
          } catch {}
        }, 450);
        return;
      }
      if (typeof map.project === 'function' && typeof map.unproject === 'function') {
        const px = map.project(point);
        px.y -= offsetPxY;
        const target = map.unproject(px);
        if (typeof map.panTo === 'function') {
          map.panTo(target, { animate: true, duration: 0.45 });
        }
      } else if (typeof map.panTo === 'function') {
        map.panTo(point, { animate: true, duration: 0.45 });
      }
    } catch {
      // fallback gracieux
    }
  }, []);

  const instructions = itineraireInstructions || [];
  const currentStep = instructions[currentStepIndex] || instructions[0] || null;
  const currentStepCoord = useMemo(() => {
    if (!route?.coordinates?.length) return null;
    const totalSteps = instructions.length || 1;
    const ratio = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 0;
    const coordIdx = Math.min(
      route.coordinates.length - 1,
      Math.max(0, Math.round(ratio * (route.coordinates.length - 1)))
    );
    const c = route.coordinates[coordIdx];
    return c ? [c[1], c[0]] : null;
  }, [route?.coordinates, instructions.length, currentStepIndex]);

  const segmentsList = segments?.features || segments?.results?.features || (Array.isArray(segments) ? segments : []);
  const segmentsRiskHigh = useMemo(() => {
    if (!route?.coordinates?.length) return [];
    return segmentsList.filter((s) => {
      const score = Number(s.properties?.score_risque_actuel ?? s.score_risque_actuel ?? 0);
      return score >= 0.45;
    });
  }, [segmentsList, route?.coordinates?.length]);

  const availableLayers = Object.keys(LAYER_LABELS).filter((key) => {
    if (key === 'signalements') return !!signalements?.length;
    const layer = data[key];
    if (Array.isArray(layer)) return layer.length > 0;
    return !!(layer?.features?.length || layer?.results?.features?.length || layer?.length);
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
      className="relative rounded-xl overflow-hidden border border-navy-50 dark:border-navy-800 isolate z-10 w-full h-full min-h-[360px]"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Barre de contrôle supérieure unifiée : Couches à gauche (défilable) et Switcher Plan/Satellite à droite. Zéro chevauchement garanti sur tout écran */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex items-center justify-between gap-2 pointer-events-none select-none">
        {/* Capsules de couches filtrables (Signalements, Refuges, Segments, Zones) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pointer-events-auto min-w-0 flex-1">
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black backdrop-blur-md border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isLayerActive
                    ? 'bg-navy-950/90 dark:bg-white/95 text-white dark:text-navy-950 border-white/20 dark:border-navy-800'
                    : 'bg-white/80 dark:bg-navy-950/80 text-slate-500 dark:text-slate-400 border-white/40 dark:border-navy-800 line-through opacity-70'
                }`}
                title={`Afficher ou masquer : ${LAYER_LABELS[key]}`}
              >
                <Icon size={13} className={isLayerActive ? 'text-[#CC131A]' : 'opacity-40'} />
                <span>{LAYER_SHORT_LABELS[key] || LAYER_LABELS[key]}</span>
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
        <div className="flex items-center gap-1 bg-white/95 dark:bg-navy/95 backdrop-blur-md p-1 rounded-xl border border-navy-50 dark:border-navy-800 shadow-md shrink-0 pointer-events-auto">
          <button
            type="button"
            onClick={() => changeBaseMap('plan')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
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
      </div>

      <MapContainer
        center={THIAROYE_CENTER}
        zoom={14}
        minZoom={11}
        maxZoom={20}
        zoomSnap={0.5}
        maxBounds={THIAROYE_BOUNDS}
        maxBoundsViscosity={0.5}
        scrollWheelZoom
        dragging
        touchZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%', minHeight: '380px', backgroundColor: '#0e1c2e' }}
      >
        <ZoomControl position="bottomleft" />
        <MapAutoResizer />
        <MapInstanceCapture onMap={handleMapReady} />
        <MapPopupAutoPanner />
        <MapViewportListener onViewportChange={handleViewportChange} />
        <RecenterButton center={THIAROYE_CENTER} defaultZoom={14} />

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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
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
            const zoneId = f.id ?? props.id ?? props.quartier;
            const zoneKey = `zone-${zoneId}`;
            const isFrontZone = frontElementId === zoneKey;
            const totemIcon = createZoneTotemIcon({
              quartier: props.quartier,
              niveauRisque: niveau,
              scorePct,
              isFront: isFrontZone,
            });

            return (
              <span key={`zone-bundle-${zoneId}`}>
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
                    zIndexOffset={isFrontZone ? 25000 : 200}
                    eventHandlers={{
                      click: (e) => {
                        setFrontElementId(zoneKey);
                        if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                          e.target.setZIndexOffset(25000);
                        }
                        panMapTo(center, 90);
                      },
                      mouseover: (e) => {
                        if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                          e.target.setZIndexOffset(25000);
                        }
                      },
                      mouseout: (e) => {
                        if (frontElementId !== zoneKey && e?.target && typeof e.target.setZIndexOffset === 'function') {
                          e.target.setZIndexOffset(200);
                        }
                      },
                    }}
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





        {visible.capteurs !== false &&
          (capteurs?.features || (Array.isArray(capteurs) ? capteurs : []))?.map((f) => {
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
            const refugeKey = `refuge-${fid}`;
            const isFrontRefuge = frontElementId === refugeKey;
            const refugeIcon = createRefugePinIcon({
              type: props.type_refuge,
              nom: props.nom,
              capacite: props.capacite,
              zoomLevel,
              isFront: isFrontRefuge,
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
                key={`refuge-pin-${fid}`}
                position={point}
                icon={refugeIcon}
                zIndexOffset={isFrontRefuge ? 22000 : 400}
                eventHandlers={{
                  click: (e) => {
                    setFrontElementId(refugeKey);
                    if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                      e.target.setZIndexOffset(22000);
                    }
                    panMapTo(point, 120);
                  },
                  mouseover: (e) => {
                    if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                      e.target.setZIndexOffset(22000);
                    }
                  },
                  mouseout: (e) => {
                    if (frontElementId !== refugeKey && e?.target && typeof e.target.setZIndexOffset === 'function') {
                      e.target.setZIndexOffset(400);
                    }
                  },
                }}
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

        {/* Clusters de signalements quand le zoom est dézoomé (masqués en guidage pour aérer la voirie) */}
        {visible.signalements !== false && !isNavigating &&
          clusteredSignalements.map((c) => (
            <ClusterMarker
              key={c.id}
              position={c.position}
              count={c.count}
              highestSeverity={c.highestColor}
            />
          ))}

        {visible.signalements !== false && !isNavigating &&
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

            const sigKey = `sig-${fid}`;
            const isFront = frontElementId === sigKey || String(frontSignalementId) === String(fid);

            const customIcon = createCitizenAvatarIcon({
              avatarUrl,
              statusColor,
              isSelected,
              isFront,
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
                  radius={isSelected || isFront ? (isHighZoom ? 14 : 10) : (isHighZoom ? 5 : 4)}
                  pathOptions={{
                    color: isCurrentUser ? '#F59E0B' : statusColor,
                    weight: isSelected || isFront ? 2 : 1.2,
                    fillColor: isCurrentUser ? '#F59E0B' : statusColor,
                    fillOpacity: isSelected || isFront ? 0.35 : 0.2,
                  }}
                  eventHandlers={{
                    click: () => {
                      setFrontElementId(sigKey);
                      setFrontSignalementId(fid);
                      const m = markerRefs.current?.[fid];
                      if (m && typeof m.setZIndexOffset === 'function') m.setZIndexOffset(20000);
                      if (m && typeof m.openPopup === 'function') m.openPopup();
                    },
                  }}
                />

                {/* 2. Marqueur Avatar Vivant réactif au zoom avec clé stable (évite la destruction du popup lors des zooms) */}
                <Marker
                  key={`sig-marker-${fid}`}
                  position={point}
                  icon={customIcon}
                  zIndexOffset={isFront ? 20000 : (isCurrentUser ? 1000 : (isSelected ? 500 : 0))}
                  ref={(ref) => {
                    if (ref) markerRefs.current[fid] = ref;
                  }}
                  eventHandlers={{
                    click: (e) => {
                      setFrontElementId(sigKey);
                      setFrontSignalementId(fid);
                      if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                        e.target.setZIndexOffset(20000);
                      }
                      panMapTo(point, 120);
                    },
                    mouseover: (e) => {
                      if (e?.target && typeof e.target.setZIndexOffset === 'function') {
                        e.target.setZIndexOffset(20000);
                      }
                    },
                    mouseout: (e) => {
                      if (frontElementId !== sigKey && String(frontSignalementId) !== String(fid) && e?.target && typeof e.target.setZIndexOffset === 'function') {
                        e.target.setZIndexOffset(isCurrentUser ? 1000 : (isSelected ? 500 : 0));
                      }
                    },
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

        {/* ── MARQUEUR LIVE "VOUS ÊTES ICI" (POSITION CITOYENNE DIRECTE DYNAMIQUE) ── */}
        {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lon === 'number' && (
          <span key="user-live-location-bundle">
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={userLocation.isSafe ? 24 : 18}
              pathOptions={{
                color: userLocation.isSafe ? '#059669' : (userLocation.isNavigating ? '#0284C7' : '#2563EB'),
                weight: 2,
                fillColor: userLocation.isSafe ? '#10B981' : (userLocation.isNavigating ? '#38BDF8' : '#3B82F6'),
                fillOpacity: userLocation.isSafe ? 0.35 : 0.25,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={createUserLiveLocationIcon({
                avatarUrl: userLocation.avatar,
                authorName: userLocation.name,
                zoomLevel,
                isSafe: userLocation.isSafe,
                isNavigating: userLocation.isNavigating,
                stepNumber: (userLocation.currentStepIndex ?? currentStepIndex) + 1,
              })}
              zIndexOffset={userLocation.isSafe ? 20000 : 2000}
              eventHandlers={{
                click: () => {
                  panMapTo([userLocation.lat, userLocation.lon], 120);
                },
              }}
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
                      className={`w-10 h-10 rounded-full object-cover ring-2 flex-shrink-0 ${
                        userLocation.isSafe ? 'ring-emerald-500' : 'ring-blue-500'
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/avatar-amadou.jpg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-sm text-navy-950 dark:text-white truncate">
                          {userLocation.name || 'Votre compte'}
                        </span>
                        {userLocation.isSafe ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex-shrink-0 shadow-2xs">
                            <ShieldCheck size={10} className="text-emerald-600 dark:text-emerald-400" />
                            Mis à l'abri
                          </span>
                        ) : userLocation.isNavigating ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 flex-shrink-0 shadow-2xs">
                            <Navigation size={10} className="text-sky-600 dark:text-sky-400" />
                            En route
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 flex-shrink-0 shadow-2xs">
                            <Star size={10} className="fill-blue-500 text-blue-500" />
                            Vous êtes ici
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={11} className={userLocation.isSafe ? 'text-emerald-600' : 'text-blue-600'} />
                        <span>{userLocation.quartier || 'Thiaroye-sur-Mer'}</span>
                      </p>
                    </div>
                  </div>

                  {userLocation.isSafe ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">
                        <strong>Arrivé en lieu sûr !</strong> Votre avatar est positionné au refuge de destination, hors de tout risque d'inondation.
                      </div>
                      {onResetUserPosition && (
                        <button
                          type="button"
                          onClick={onResetUserPosition}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Repartir de la position initiale</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {userLocation.isNavigating
                          ? "Vous suivez l'itinéraire de secours pas-à-pas vers le refuge. Chaque étape est guidée en bas de l'écran."
                          : "Vous êtes positionné en direct au cœur de Thiaroye-sur-Mer. Vous pouvez observer les points de vigilance autour de vous ou signaler un problème."}
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
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          </span>
        )}

        {route?.coordinates?.length > 0 && (
          <>
            {/* 1. SECTIONS INONDÉES ÉVITÉES (Déviations affichées en rouge pointillé avec badge d'alerte) */}
            {segmentsRiskHigh?.map((seg, idx) => {
              const coords = seg.geometry?.coordinates || seg.coordinates;
              if (!coords || !coords.length) return null;
              const latlngs = coords.map(([lon, lat]) => [lat, lon]);
              const midCoord = latlngs[Math.floor(latlngs.length / 2)] || latlngs[0];
              const nom = seg.properties?.nom || seg.nom || `Axe à risque #${idx + 1}`;
              return (
                <span key={`avoided-road-${seg.id || idx}`}>
                  <Polyline
                    positions={latlngs}
                    pathOptions={{ color: '#DC2626', weight: 4.5, dashArray: '6, 8', opacity: 0.85, lineCap: 'round' }}
                  />
                  <Marker
                    position={midCoord}
                    icon={createAvoidedFloodedRoadIcon({ nom })}
                    zIndexOffset={1600}
                    eventHandlers={{
                      click: () => {
                        panMapTo(midCoord, 120, 16.5);
                      },
                    }}
                  >
                    <Popup
                      className="citizen-map-popup"
                      autoPan={true}
                      autoPanPaddingTopLeft={[20, 90]}
                      autoPanPaddingBottomRight={[20, 200]}
                    >
                      <div className="text-xs p-2.5 font-sans space-y-1 max-w-[240px]">
                        <div className="flex items-center gap-1.5 font-black text-red-600 dark:text-red-400">
                          <AlertTriangle size={14} />
                          <span>Voie inondée évitée</span>
                        </div>
                        <p className="font-bold text-navy-950 dark:text-white text-[11px] leading-snug">
                          {nom}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Axe submergé contourné par l’algorithme pour garantir votre sécurité.
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </span>
              );
            })}

            {/* 2. TRACÉ PRINCIPAL STYLE GOOGLE MAPS (Double couche : Halo blanc de contraste + Bleu vif #2563EB) */}
            <Polyline
              positions={route.coordinates.map(([lon, lat]) => [lat, lon])}
              pathOptions={{ color: '#FFFFFF', weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
            />
            <Polyline
              positions={route.coordinates.map(([lon, lat]) => [lat, lon])}
              pathOptions={{ color: '#2563EB', weight: 5.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
            />

            {/* 3. MARQUEUR DU POINT DE DÉPART */}
            <CircleMarker
              center={[route.coordinates[0][1], route.coordinates[0][0]]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#2563EB', fillOpacity: 1 }}
              eventHandlers={{
                click: () => {
                  panMapTo([route.coordinates[0][1], route.coordinates[0][0]], 110);
                },
              }}
            >
              <Popup
                className="citizen-map-popup"
                autoPan={true}
                autoPanPaddingTopLeft={[20, 80]}
                autoPanPaddingBottomRight={[20, 200]}
              >
                <div className="text-xs p-2.5 font-sans space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-[#2563EB] dark:text-blue-400">
                    <MapPin size={14} />
                    <span>Départ</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Début du trajet d’évacuation sécurisé.
                  </p>
                </div>
              </Popup>
            </CircleMarker>

            {/* 4. MARQUEUR DU POINT D'ARRIVÉE (REFUGE EN ZONE SÛRE) AVEC FOCUS AUTOMATIQUE */}
            <CircleMarker
              center={[
                route.coordinates[route.coordinates.length - 1][1],
                route.coordinates[route.coordinates.length - 1][0],
              ]}
              radius={10}
              pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#059669', fillOpacity: 1 }}
              ref={arrivalMarkerRef}
              eventHandlers={{
                click: () => {
                  const end = route.coordinates[route.coordinates.length - 1];
                  panMapTo([end[1], end[0]], 110);
                },
              }}
            >
              <Popup
                className="citizen-map-popup"
                autoPan={true}
                autoPanPaddingTopLeft={[20, 80]}
                autoPanPaddingBottomRight={[20, 200]}
              >
                <div className="text-xs p-2.5 font-sans space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={14} />
                    <span>Point sûr le plus proche</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Zone d’accueil sécurisée hors d’eau (Refuge).
                  </p>
                </div>
              </Popup>
            </CircleMarker>

            {/* 5. INDICATION D'ÉTAPE SUR LE TRACÉ LORS DE LA NAVIGATION (SANS POPUP BLANCHE DOUBLON) */}
            {isNavigating && currentStepCoord && (
              <Marker
                position={currentStepCoord}
                icon={createNavigationStepIcon({ stepNumber: currentStepIndex + 1 })}
                zIndexOffset={2200}
              />
            )}

            {/* Suivi automatique et centrage fluide de la caméra sur chaque étape */}
            <NavigationStepFollower
              isNavigating={isNavigating}
              currentStepIndex={currentStepIndex}
              instructions={instructions}
              coordinates={route.coordinates}
            />

            <FitRoute coordinates={route.coordinates} arrivalMarkerRef={arrivalMarkerRef} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
