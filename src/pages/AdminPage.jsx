import React from 'react';
import { Settings, Cpu, AlertCircle, Activity, Database, Wrench, Users } from 'lucide-react';
import { WATER_SENSORS, CURRENT_RISK } from '../utils/mockData';
import { useTheme } from '../context/ThemeContext';

export default function AdminPage() {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-6 pb-12 min-w-0 w-full overflow-hidden">
      
      {/* Header */}
      <div className={`border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0 transition-colors ${
        darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center space-x-2 truncate">
            <Settings className="w-6 h-6 text-brand-sky shrink-0" />
            <span className="truncate">Administration & Maintenance du Système</span>
          </h1>
          <p className={`text-xs mt-1 leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Supervision technique du matériel IoT, statut des capteurs d'eau, motopompes et logs du serveur API.
          </p>
        </div>

        <div className={`flex items-center space-x-2 text-xs px-4 py-2 rounded-2xl border shrink-0 max-w-full truncate ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <Database className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>API Backend : </span>
          <span className="text-emerald-500 font-bold font-mono truncate">OPÉRATIONNEL (200 OK)</span>
        </div>
      </div>

      {/* Hardware Health Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs min-w-0">
        
        {/* IoT Sensor Rate */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between min-w-0 overflow-hidden ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="min-w-0 flex-1 mr-2">
            <span className={`block text-[10px] sm:text-[11px] font-semibold uppercase truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Capteurs IoT Actifs
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-500 truncate block">
              {CURRENT_RISK.sensorsOkPercentage}%
            </span>
          </div>
          <Cpu className="w-6 h-6 text-emerald-500 shrink-0" />
        </div>

        {/* Deployed Pumps */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between min-w-0 overflow-hidden ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="min-w-0 flex-1 mr-2">
            <span className={`block text-[10px] sm:text-[11px] font-semibold uppercase truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Motopompes Déployées
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold truncate block ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              28 Stations
            </span>
          </div>
          <Activity className="w-6 h-6 text-brand-sky shrink-0" />
        </div>

        {/* Failures */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between min-w-0 overflow-hidden ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="min-w-0 flex-1 mr-2">
            <span className={`block text-[10px] sm:text-[11px] font-semibold uppercase truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Anomalies / Pannes
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-brand-red truncate block">
              02 Pannes
            </span>
          </div>
          <AlertCircle className="w-6 h-6 text-brand-red animate-pulse shrink-0" />
        </div>

        {/* Admins Connected */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between min-w-0 overflow-hidden ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="min-w-0 flex-1 mr-2">
            <span className={`block text-[10px] sm:text-[11px] font-semibold uppercase truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Admins Connectés
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold truncate block ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              04 Connectés
            </span>
          </div>
          <Users className="w-6 h-6 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Water Sensors System Table */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2 min-w-0 ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
            <Cpu className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className="truncate">État Télémetrique des Capteurs d'Eau IoT</span>
          </h3>

          <button className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition shrink-0 ${
            darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
          }`}>
            Pinger les capteurs
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className={`font-semibold uppercase border-b ${
              darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="p-3">ID Capteur</th>
                <th className="p-3">Nom & Localisation</th>
                <th className="p-3">Niveau Mesuré</th>
                <th className="p-3">Seuil Critique</th>
                <th className="p-3">Batterie</th>
                <th className="p-3">Dernier Signal</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {WATER_SENSORS.map((sens) => (
                <tr key={sens.id} className={darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono font-bold text-brand-sky">{sens.id}</td>
                  <td className="p-3 font-bold truncate max-w-[200px]">{sens.name}</td>
                  <td className="p-3 font-mono font-bold text-brand-red">{sens.waterLevel}</td>
                  <td className="p-3 font-mono">{sens.threshold}</td>
                  <td className="p-3 font-mono text-emerald-500 font-bold">{sens.battery}</td>
                  <td className="p-3">{sens.lastSignal}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      sens.status === 'CRITIQUE' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      sens.status === 'ATTENTION' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                    }`}>
                      {sens.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Logs */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-3 font-mono text-xs overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <h3 className="font-bold flex items-center space-x-2 truncate font-sans">
          <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">Journal Système & Logs API en Direct</span>
        </h3>

        <div className={`p-4 rounded-2xl border space-y-1.5 max-h-40 overflow-y-auto overflow-x-hidden min-w-0 ${
          darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-900 text-slate-300 border-slate-700'
        }`}>
          <p className="text-emerald-400 break-all">[18:50:12] INFO: Reçu signalement valide (ID: REP-2026-081) — Lat: 14.7482, Lng: -17.3755</p>
          <p className="text-cyan-400 break-all">[18:45:05] SENSOR: Telemetry broadcast C-01 (Marché Thiaroye) -&gt; 48cm [SEUIL DÉPASSÉ]</p>
          <p className="break-all">[18:30:00] SYSTEM: Synchronisation des couches GeoJSON Thiaroye-sur-Mer effectuée.</p>
          <p className="break-all">[18:15:30] PUMP: Station P-01 (Thiaroye Gare) débit ajusté à 95%.</p>
        </div>
      </div>
    </div>
  );
}
