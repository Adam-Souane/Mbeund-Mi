import { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, X } from 'lucide-react';
import { riskInfo } from '../RiskBadge';
import { polygonToLatLngs, lineToLatLngs, pointToLatLng } from './geoUtils';

// Centre de Thiaroye-sur-Mer — même point que celui utilisé côté backend
// pour le geofencing des signalements (SignalementCitoyenSerializer).
const THIAROYE_CENTER = [14.75, -17.38];

const LAYER_LABELS = {
  zones: 'Zones à risque',
  inondations: 'Zones inondées (historique)',
  segments: 'Rues & drainage',
  capteurs: 'Capteurs',
  signalements: 'Signalements citoyens',
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

/**
 * Carte SIG partagée citoyen/autorité. Chaque couche n'apparaît (et n'est
 * proposée dans le sélecteur) que si la donnée correspondante est fournie —
 * ça permet à la page citoyenne de n'afficher que zones/inondations/signalements
 * pendant que l'autorité obtient la vue complète avec capteurs et segments.
 *
 * @param {object} data — { zones, inondations, segments, capteurs } en FeatureCollection GeoJSON, signalements en tableau de Feature.
 */
export default function InteractiveMap({ data = {}, height = 560 }) {
  const { zones, inondations, segments, capteurs, signalements } = data;

  const availableLayers = Object.keys(LAYER_LABELS).filter((key) => {
    if (key === 'signalements') return !!signalements?.length;
    return !!data[key]?.features?.length;
  });

  const [visible, setVisible] = useState(() =>
    availableLayers.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );
  // Replié par défaut et placé à droite (le zoom natif de Leaflet occupe le
  // coin haut-gauche) pour ne jamais se superposer aux popups de couche.
  const [panelOpen, setPanelOpen] = useState(false);

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="relative rounded-xl overflow-hidden border border-navy-50 dark:border-navy-800" style={{ height }}>
      {availableLayers.length > 0 && (
        // Ancré en bas à droite (et non en haut) — les popups Leaflet
        // s'ouvrent au-dessus du point cliqué, donc ce coin est celui qui a
        // le moins de chances de se superposer à un popup ouvert.
        <div className="absolute bottom-3 right-3 z-[1000] flex flex-col-reverse items-end gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="w-9 h-9 rounded-lg bg-white/95 dark:bg-navy/95 backdrop-blur border border-navy-50 dark:border-navy-800 shadow-lg flex items-center justify-center text-navy dark:text-navy-50"
            aria-label="Afficher les couches de la carte"
          >
            {panelOpen ? <X size={16} /> : <Layers size={16} />}
          </button>
          {panelOpen && (
            <div className="bg-white/95 dark:bg-navy/95 backdrop-blur rounded-lg border border-navy-50 dark:border-navy-800 shadow-lg px-3 py-2.5 flex flex-col gap-1.5 max-w-[210px]">
              <div className="text-[11px] font-bold uppercase text-navy-400 mb-0.5">Couches</div>
              {availableLayers.map((key) => (
                <label key={key} className="flex items-center gap-2 text-xs text-navy dark:text-navy-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!visible[key]}
                    onChange={() => toggle(key)}
                    className="accent-red"
                  />
                  {LAYER_LABELS[key]}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <MapContainer center={THIAROYE_CENTER} zoom={15} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visible.zones &&
          zones.features.map((f) => {
            const { hex, label } = riskInfo(f.properties.niveau_risque);
            return (
              <Polygon
                key={`zone-${f.id}`}
                positions={polygonToLatLngs(f.geometry)}
                pathOptions={{ color: hex, fillColor: hex, fillOpacity: 0.3, weight: 2 }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[160px]">
                    <div className="font-bold text-sm">{f.properties.quartier}</div>
                    <div>
                      Risque : <span className="font-semibold">{label}</span>
                    </div>
                    <div>Score moyen : {f.properties.score_risque_moyen}</div>
                    {f.properties.description && <p className="text-navy-600">{f.properties.description}</p>}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {visible.inondations &&
          inondations.features.map((f) => (
            <Polygon
              key={`inondation-${f.id}`}
              positions={polygonToLatLngs(f.geometry)}
              pathOptions={{ color: '#4A6480', fillColor: '#4A6480', fillOpacity: 0.25, weight: 1, dashArray: '4,4' }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]">
                  <div className="font-bold text-sm">Épisode d'inondation</div>
                  <div>Début : {formatDate(f.properties.date_debut)}</div>
                  <div>Fin : {f.properties.date_fin ? formatDate(f.properties.date_fin) : 'En cours'}</div>
                  {f.properties.surface_ha != null && <div>Surface : {f.properties.surface_ha} ha</div>}
                </div>
              </Popup>
            </Polygon>
          ))}

        {visible.segments &&
          segments.features.map((f) => (
            <Polyline
              key={`segment-${f.id}`}
              positions={lineToLatLngs(f.geometry)}
              pathOptions={{ color: segmentColor(f.properties.score_risque_actuel), weight: 4 }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]">
                  <div className="font-bold text-sm">{f.properties.nom || 'Rue sans nom'}</div>
                  <div>Drainage : {f.properties.etat_drainage}</div>
                  <div>Score de risque : {f.properties.score_risque_actuel}</div>
                </div>
              </Popup>
            </Polyline>
          ))}

        {visible.capteurs &&
          capteurs.features.map((f) => {
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
                <Popup>
                  <div className="text-xs space-y-1 min-w-[160px]">
                    <div className="font-bold text-sm">{f.properties.nom}</div>
                    <div>Type : {f.properties.type}</div>
                    <div>Statut : {f.properties.statut}</div>
                    {f.properties.dernier_releve && <div>Dernier relevé : {formatDate(f.properties.dernier_releve)}</div>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {visible.signalements &&
          signalements.map((f) => {
            const point = pointToLatLng(f.geometry);
            if (!point) return null;
            return (
              <CircleMarker
                key={`signalement-${f.id}`}
                center={point}
                radius={8}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: f.properties.valide ? '#C0182A' : '#8AA0B8',
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[180px] max-w-[220px]">
                    <div className="font-bold text-sm capitalize">{f.properties.categorie}</div>
                    <p className="text-navy-600 dark:text-navy-200">{f.properties.description}</p>
                    <div className="text-[10px] text-navy-400">
                      {f.properties.valide ? 'Validé' : 'En attente de validation'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
