import React from 'react';
import { Settings, Cpu, ShieldCheck, AlertCircle, Activity, Database, Wrench, Users } from 'lucide-react';
import { WATER_SENSORS, PUMP_STATIONS, CURRENT_RISK } from '../utils/mockData';

export default function AdminPage() {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Settings className="w-6 h-6 text-brand-sky" />
            <span>Administration & Maintenance du Système</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervision technique du matériel IoT, statut des capteurs d'eau, motopompes et logs du serveur API.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-900 px-4 py-2 rounded-2xl border border-slate-700">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">API Backend : </span>
          <span className="text-emerald-400 font-bold font-mono">OPÉRATIONNEL (200 OK)</span>
        </div>
      </div>

      {/* Hardware Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Taux Capteurs Fonctionnels</span>
            <span className="text-2xl font-extrabold text-emerald-400">{CURRENT_RISK.sensorsOkPercentage}%</span>
          </div>
          <Cpu className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Motopompes Déployées</span>
            <span className="text-2xl font-extrabold text-white">28 Stations</span>
          </div>
          <Activity className="w-6 h-6 text-brand-sky" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Anomalies / Pannes</span>
            <span className="text-2xl font-extrabold text-brand-red">02 Pannes</span>
          </div>
          <AlertCircle className="w-6 h-6 text-brand-red animate-pulse" />
        </div>

        <div className="bg-brand-navy p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Administrateurs Connectés</span>
            <span className="text-2xl font-extrabold text-white">04 Utilisateurs</span>
          </div>
          <Users className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Water Sensors System Table */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>État Télémetrique des Capteurs de Niveau d'Eau IoT</span>
          </h3>

          <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 font-bold transition">
            Pinger les capteurs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">ID Capteur</th>
                <th className="p-3.5">Nom & Localisation</th>
                <th className="p-3.5">Niveau Mesuré</th>
                <th className="p-3.5">Seuil Critique</th>
                <th className="p-3.5">Batterie</th>
                <th className="p-3.5">Dernière Émission</th>
                <th className="p-3.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {WATER_SENSORS.map((sens) => (
                <tr key={sens.id} className="hover:bg-slate-900/50 transition">
                  <td className="p-3.5 font-mono font-bold text-brand-sky">{sens.id}</td>
                  <td className="p-3.5 font-bold text-white">{sens.name}</td>
                  <td className="p-3.5 font-mono font-bold text-brand-red">{sens.waterLevel}</td>
                  <td className="p-3.5 font-mono text-slate-400">{sens.threshold}</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">{sens.battery}</td>
                  <td className="p-3.5 text-slate-400">{sens.lastSignal}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      sens.status === 'CRITIQUE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      sens.status === 'ATTENTION' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 font-mono text-xs">
        <h3 className="font-bold text-white flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Journal Système & Logs API en Direct</span>
        </h3>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 space-y-1.5 max-h-40 overflow-y-auto">
          <p className="text-emerald-400">[17:34:12] INFO: Reçu signalement valide (ID: REP-2026-081) — Lat: 14.7482, Lng: -17.3755</p>
          <p className="text-cyan-400">[17:30:05] SENSOR: Telemetry broadcast C-01 (Marché Thiaroye) -&gt; 48cm [SEUIL DÉPASSÉ]</p>
          <p className="text-slate-400">[17:25:00] SYSTEM: Synchronisation des couches GeoJSON Thiaroye-sur-Mer effectuée.</p>
          <p className="text-slate-400">[17:15:30] PUMP: Station P-01 (Thiaroye Gare) débit ajusté à 95%.</p>
        </div>
      </div>
    </div>
  );
}
