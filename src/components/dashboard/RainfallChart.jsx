import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RAINFALL_HISTORY } from '../../utils/mockData';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function RainfallChart() {
  const { darkMode } = useTheme();

  return (
    <div className={`border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-b from-brand-navy to-slate-900 border-slate-800 text-white' 
        : 'bg-white border-slate-200 text-slate-800 shadow-md'
    }`}>
      
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-semibold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-4 h-4 text-brand-red" />
            <span>Évolution des Pluies & Niveau d'Eau</span>
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Relevés toutes les 2 heures — Thiaroye Gare</p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-red"></span>
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Niveau Eau (cm)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-sky"></span>
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Précipitations (mm)</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1E293B" : "#E2E8F0"} />
            <XAxis dataKey="time" stroke={darkMode ? "#64748B" : "#94A3B8"} fontSize={11} />
            <YAxis stroke={darkMode ? "#64748B" : "#94A3B8"} fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#0F294A' : '#FFFFFF', 
                borderColor: darkMode ? '#1E3A60' : '#E2E8F0', 
                borderRadius: '12px', 
                color: darkMode ? '#FFF' : '#0F172A',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }} 
            />
            <Area type="monotone" dataKey="niveauEau" stroke="#E61C24" fillOpacity={1} fill="url(#colorNiveau)" name="Niveau Eau (cm)" />
            <Area type="monotone" dataKey="pluie" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorPluie)" name="Pluie (mm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Stats */}
      <div className={`grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center text-xs ${
        darkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <span className={`block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cumul Pluviométrique</span>
          <span className={`font-extrabold text-sm font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>183 mm</span>
        </div>
        <div>
          <span className={`block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pic de Crue</span>
          <span className="text-brand-red font-extrabold text-sm font-mono">65 cm à 14h</span>
        </div>
        <div>
          <span className={`block text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Débit de Pompage</span>
          <span className="text-emerald-500 font-extrabold text-sm font-mono">4,100 m³/h</span>
        </div>
      </div>
    </div>
  );
}
