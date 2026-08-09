import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, ArrowUpRight } from 'lucide-react';
import { CURRENT_RISK } from '../../utils/mockData';

export default function GaugeRisk({ onExploreMap }) {
  const percentage = CURRENT_RISK.percentage;
  const strokeDashoffset = 440 - (440 * percentage) / 100;

  return (
    <div className="bg-gradient-to-b from-brand-navy to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Subtle Radial Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Indice Global de Risque
          </h3>
          <p className="text-xs text-slate-500">Commune de Thiaroye-sur-Mer</p>
        </div>
        <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold animate-pulse">
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
            stroke="#1E3A60"
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
          <span className="text-5xl font-extrabold text-white tracking-tight">
            {percentage}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-red mt-1">
            {CURRENT_RISK.level}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Risque d'Inondation
          </span>
        </div>
      </div>

      {/* Bottom Summary & Button */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center space-x-1.5 text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Capteurs & Pompes :</span>
          </span>
          <span className="font-bold text-white">28 Active(s) (92%)</span>
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
