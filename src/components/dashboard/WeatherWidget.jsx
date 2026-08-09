import React from 'react';
import { CloudRain, Wind, Droplets, Thermometer, Sun, Calendar } from 'lucide-react';
import { FORECAST_7DAYS } from '../../utils/mockData';

export default function WeatherWidget() {
  const today = FORECAST_7DAYS[0];

  return (
    <div className="bg-gradient-to-b from-brand-navy to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <CloudRain className="w-5 h-5 text-brand-sky" />
          <h3 className="text-sm font-semibold text-white">Météo & Pluies — Thiaroye</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">EN DIRECT</span>
      </div>

      {/* Main Temperature & Rainfall Display */}
      <div className="grid grid-cols-2 gap-4 my-4 items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-brand-sky">
            <CloudRain className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{today.temp}</div>
            <div className="text-xs text-slate-400 font-medium">Pluies intenses</div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center space-x-1 text-slate-400">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Précipitations :</span>
            </span>
            <span className="font-bold text-white font-mono">{today.rainMm}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center space-x-1 text-slate-400">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vent rafales :</span>
            </span>
            <span className="font-bold text-white font-mono">24 km/h</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Mini Row */}
      <div className="pt-2">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Prévisions 7 Jours</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
          {FORECAST_7DAYS.map((day, idx) => (
            <div 
              key={idx}
              className={`p-2 rounded-xl border text-[11px] flex flex-col items-center justify-between ${
                idx === 0 
                  ? 'bg-brand-red/20 border-brand-red text-white font-bold' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="truncate w-full font-medium">{day.day.slice(0, 3)}</span>
              <CloudRain className="w-4 h-4 my-1 text-brand-sky" />
              <span className="font-mono text-white text-[10px]">{day.temp}</span>
              <span className="text-[9px] text-brand-red font-semibold">{day.rainProb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
