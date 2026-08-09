import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { THIAROYE_COORDS, RISK_ZONES, WATER_SENSORS, PUMP_STATIONS, CITIZEN_REPORTS } from '../../utils/mockData';
import { Layers, MapPin, Activity, Waves, Filter, Info, ShieldAlert } from 'lucide-react';

// Custom HTML Div Marker Generator for Leaflet
const createCustomIcon = (color, label, iconType) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map Recenter Helper Component
function RecenterMap({ lat, lng, zoom }) {
  const map = useMap();
  map.setView([lat, lng], zoom);
  return null;
}

export default function InteractiveMap({ selectedZoneId, onZoneSelect }) {
  const [tileType, setTileType] = useState('osm'); // 'osm' | 'satellite'
  const [showPolygons, setShowPolygons] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showPumps, setShowPumps] = useState(true);
  const [showReports, setShowReports] = useState(true);

  // Map Tile URLs
  const tiles = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  return (
    <div className="relative w-full h-[650px] md:h-[750px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      
      {/* Top Map Control Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        
        {/* Layer Filters Drawer Panel */}
        <div className="bg-brand-navy/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 shadow-xl pointer-events-auto flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-slate-200">
            <Filter className="w-4 h-4 text-brand-red" />
            <span>Filtres SIG :</span>
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input 
              type="checkbox" 
              checked={showPolygons} 
              onChange={e => setShowPolygons(e.target.checked)}
              className="accent-brand-red rounded"
            />
            <span>Zones à risque</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input 
              type="checkbox" 
              checked={showSensors} 
              onChange={e => setShowSensors(e.target.checked)}
              className="accent-brand-cyan rounded"
            />
            <span>Capteurs Eau</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input 
              type="checkbox" 
              checked={showPumps} 
              onChange={e => setShowPumps(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Motopompes</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input 
              type="checkbox" 
              checked={showReports} 
              onChange={e => setShowReports(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span>Signalements Citoyens</span>
          </label>
        </div>

        {/* Tile Map Type Switcher */}
        <div className="bg-brand-navy/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl pointer-events-auto flex items-center space-x-1 text-xs">
          <button
            onClick={() => setTileType('osm')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              tileType === 'osm' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plan Urbain
          </button>
          <button
            onClick={() => setTileType('satellite')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              tileType === 'satellite' ? 'bg-brand-red text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vue Satellite
          </button>
        </div>
      </div>

      {/* Main React Leaflet Map Component */}
      <MapContainer
        center={[THIAROYE_COORDS.lat, THIAROYE_COORDS.lng]}
        zoom={THIAROYE_COORDS.zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tiles[tileType]}
        />

        {/* Polygons of Risk Zones */}
        {showPolygons && RISK_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.polygon}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: 0.35,
              weight: selectedZoneId === zone.id ? 4 : 2,
              dashArray: selectedZoneId === zone.id ? '6, 6' : null
            }}
            eventHandlers={{
              click: () => onZoneSelect && onZoneSelect(zone.id)
            }}
          >
            <Popup>
              <div className="p-1 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: zone.color, color: '#fff' }}>
                    {zone.riskLevel}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">{zone.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Niveau d'eau :</span>
                    <span className="font-bold text-brand-red">{zone.waterDepth}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Population :</span>
                    <span className="font-bold text-white">{zone.populationAtRisk}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Water Sensor Markers */}
        {showSensors && WATER_SENSORS.map((sensor) => (
          <Marker
            key={sensor.id}
            position={sensor.coords}
            icon={createCustomIcon(sensor.status === 'CRITIQUE' ? '#E61C24' : '#0284C7', '🌊')}
          >
            <Popup>
              <div className="p-1 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                  <span className="font-bold text-white text-xs">{sensor.name}</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                    {sensor.status}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Hauteur mesurée :</span>
                    <span className="font-mono font-bold text-brand-red">{sensor.waterLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seuil d'alerte :</span>
                    <span className="font-mono">{sensor.threshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batterie capteur :</span>
                    <span className="font-mono text-emerald-400">{sensor.battery}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pump Station Markers */}
        {showPumps && PUMP_STATIONS.map((pump) => (
          <Marker
            key={pump.id}
            position={pump.coords}
            icon={createCustomIcon('#10B981', '⚡')}
          >
            <Popup>
              <div className="p-1 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-400 border-b border-slate-700 pb-1">
                  {pump.name}
                </div>
                <div className="text-slate-300 flex justify-between">
                  <span>Capacité :</span>
                  <span className="font-bold text-white">{pump.capacity}</span>
                </div>
                <div className="text-slate-300 flex justify-between">
                  <span>Régime actuel :</span>
                  <span className="font-bold text-emerald-400">{pump.flowRate}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Citizen Reports Markers */}
        {showReports && CITIZEN_REPORTS.map((report) => (
          <Marker
            key={report.id}
            position={report.coords}
            icon={createCustomIcon('#F59E0B', '📷')}
          >
            <Popup>
              <div className="p-1 space-y-2 max-w-[220px]">
                <img src={report.image} alt="Report" className="w-full h-24 object-cover rounded-lg" />
                <div className="font-bold text-white text-xs">{report.location}</div>
                <p className="text-[11px] text-slate-300 line-clamp-2">{report.description}</p>
                <div className="text-[10px] text-amber-400 font-bold">{report.waterDepth}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-brand-navy/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-2 text-slate-300">
        <div className="font-bold text-white border-b border-slate-700 pb-1 flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-brand-red" />
          <span>Légende Carte</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
            <span>Zone Risque Critique (&gt;40 cm)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white"></span>
            <span>Zone Risque Élevé (25–40 cm)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
            <span>Zone Risque Modéré (&lt;25 cm)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
            <span>Station de Pompage Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
