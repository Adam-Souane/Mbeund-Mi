import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, ArrowUpRight } from 'lucide-react';
import { CURRENT_RISK } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';

export default function GaugeRisk({ onExploreMap }) {
  const { darkMode } = useTheme();
  const percentage = CURRENT_RISK.percentage;
  const strokeDashoffset = 440 - (440 * percentage) / 100;

  return (
    <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-b from-brand-navy to-slate-900 border-slate-800 text-white' 
        : 'bg-white border-slate-200 text-slate-800 shadow-md'
    }`}>
      
      {/* Background Subtle Radial Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Indice Global de Risque
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Commune de Thiaroye-sur-Mer</p>
        </div>
        <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-brand-red border border-red-500/30 rounded-full text-xs font-bold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vigilance Rouge</span>
        </span>
      </div>

      {/* Main Circular Gauge Display */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-52 h-52 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="104"
            cy="104"
            r="70"
            stroke={darkMode ? "#1E3A60" : "#E2E8F0"}
            strokeWidth="14"
            fill="transparent"
          />
          {/* Foreground animated progress arc */}
          <circle
            cx="104"
            cy="104"
            r="70"
            stroke="#E61C24"
            strokeWidth="14"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_rgba(230,28,36,0.8)]"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-5xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {percentage}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-red mt-1">
            {CURRENT_RISK.level}
          </span>
          <span className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Risque d'Inondation
          </span>
        </div>
      </div>

      {/* Bottom Summary & Button */}
      <div className={`space-y-3 pt-2 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className={`flex items-center space-x-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Capteurs & Pompes :</span>
          </span>
          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>28 Active(s) (92%)</span>
        </div>

        <button 
          onClick={onExploreMap}
          className="w-full flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold text-xs py-3 rounded-2xl shadow-lg shadow-red-900/30 transition hover:scale-[1.02] active:scale-95"
        >
          <span>Examiner la Carte des Risques</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
