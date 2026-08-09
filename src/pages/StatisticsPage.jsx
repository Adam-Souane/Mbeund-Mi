import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { RAINFALL_HISTORY, RISK_ZONES } from '../utils/mockData';
import { BarChart3, TrendingUp, Activity, PieChart, Layers } from 'lucide-react';

export default function StatisticsPage() {
  const pumpData = [
    { station: "Thiaroye Gare", debit: 1200, heures: 18 },
    { station: "Tally Diallo", debit: 800, heures: 14 },
    { station: "Guinaw Rails", debit: 1500, heures: 22 },
    { station: "Plage Nord", debit: 600, heures: 8 }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-brand-red" />
          <span>Statistiques & Bilan Hydrologique</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Analyse comparative des volumes de pompage, des précipitations et du taux de résorption des eaux à Thiaroye-sur-Mer.
        </p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pump Flow Rates Chart */}
        <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Volumes d'Eau Pompés par Station (m³/h)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pumpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="station" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F294A', borderColor: '#1E3A60', borderRadius: '12px', color: '#FFF' }} />
                <Bar dataKey="debit" fill="#10B981" radius={[8, 8, 0, 0]} name="Débit (m³/h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Level Trend Line */}
        <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-brand-red" />
            <span>Résorption du Niveau d'Eau (cm vs Temps)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RAINFALL_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F294A', borderColor: '#1E3A60', borderRadius: '12px', color: '#FFF' }} />
                <Line type="monotone" dataKey="niveauEau" stroke="#E61C24" strokeWidth={3} dot={{ r: 5 }} name="Niveau (cm)" />
                <Line type="monotone" dataKey="pompage" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Activité Pompes (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vulnerability Table */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-brand-sky" />
          <span>Classement des Secteurs les Plus Vulnérables</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Rang</th>
                <th className="p-3.5">Nom du Secteur</th>
                <th className="p-3.5">Indice Vulnérabilité</th>
                <th className="p-3.5">Profondeur Eau</th>
                <th className="p-3.5">Population à Risque</th>
                <th className="p-3.5">État Pompage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {RISK_ZONES.map((zone, idx) => (
                <tr key={zone.id} className="hover:bg-slate-900/50 transition">
                  <td className="p-3.5 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-3.5 font-bold text-white">{zone.name}</td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${zone.percentage}%`, backgroundColor: zone.color }}></div>
                      </div>
                      <span className="font-bold font-mono">{zone.percentage}%</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-brand-red font-bold">{zone.waterDepth}</td>
                  <td className="p-3.5 text-slate-300">{zone.populationAtRisk}</td>
                  <td className="p-3.5">
                    <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                      POMPAGE 100%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
