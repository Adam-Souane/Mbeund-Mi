import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RAINFALL_HISTORY } from '../../utils/mockData';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function RainfallChart() {
  return (
    <div className="bg-gradient-to-b from-brand-navy to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
      
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-brand-red" />
            <span>Évolution des Pluies & Niveau d'Eau</span>
          </h3>
          <p className="text-xs text-slate-400">Relevés toutes les 2 heures — Thiaroye Gare</p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-red"></span>
            <span className="text-slate-300">Niveau Eau (cm)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-sky"></span>
            <span className="text-slate-300">Précipitations (mm)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={RAINFALL_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNiveau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E61C24" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#E61C24" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPluie" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
            <YAxis stroke="#64748B" fontSize={11} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F294A', borderColor: '#1E3A60', borderRadius: '12px', color: '#FFF' }} 
            />
            <Area type="monotone" dataKey="niveauEau" stroke="#E61C24" fillOpacity={1} fill="url(#colorNiveau)" name="Niveau Eau (cm)" />
            <Area type="monotone" dataKey="pluie" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorPluie)" name="Pluie (mm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Cumul Pluviométrique</span>
          <span className="text-white font-extrabold text-sm font-mono">183 mm</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Pic de Crue</span>
          <span className="text-brand-red font-extrabold text-sm font-mono">65 cm à 14h</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Débit de Pompage</span>
          <span className="text-emerald-400 font-extrabold text-sm font-mono">4,100 m³/h</span>
        </div>
      </div>
    </div>
  );
}
