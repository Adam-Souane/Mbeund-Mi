import React, { useState } from 'react';
import InteractiveMap from '../components/map/InteractiveMap';
import { RISK_ZONES, WATER_SENSORS, PUMP_STATIONS } from '../utils/mockData';
import { Search, MapPin, Layers, Info, AlertTriangle, ShieldCheck, Waves } from 'lucide-react';

export default function InteractiveMapPage() {
  const [selectedZoneId, setSelectedZoneId] = useState('zone-1');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedZone = RISK_ZONES.find(z => z.id === selectedZoneId) || RISK_ZONES[0];

  const filteredZones = RISK_ZONES.filter(z => 
    z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-brand-red" />
            <span>Carte Interactive des Risques (SIG)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Superposition des couches de vulnérabilité, des stations de pompage et des niveaux d'eau en temps réel.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text"
            placeholder="Rechercher un quartier (ex: Tally Diallo)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* Main Layout: Left Sidebar Zone Details + Right Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Zone Selector & Details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-brand-navy border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
              Secteurs & Zones à Risque
            </h3>

            <div className="space-y-2">
              {filteredZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between ${
                    selectedZoneId === zone.id 
                      ? 'bg-slate-800 border-brand-red text-white shadow-md' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="font-bold">{zone.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Prof. max : {zone.waterDepth}</div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: zone.color, color: '#fff' }}>
                    {zone.riskLevel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Zone Deep Dive Card */}
          <div className="bg-gradient-to-b from-slate-900 to-brand-navy border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Fiche Technique Zone</span>
              <span className="text-xs font-mono font-bold text-brand-red">{selectedZone.percentage}% RISQUE</span>
            </div>

            <h3 className="text-base font-extrabold text-white">{selectedZone.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedZone.description}</p>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Niveau d'Eau</span>
                <span className="font-bold text-brand-red font-mono">{selectedZone.waterDepth}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Population Exposée</span>
                <span className="font-bold text-white font-mono">{selectedZone.populationAtRisk}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-3">
          <InteractiveMap selectedZoneId={selectedZoneId} onZoneSelect={setSelectedZoneId} />
        </div>
      </div>
    </div>
  );
}
