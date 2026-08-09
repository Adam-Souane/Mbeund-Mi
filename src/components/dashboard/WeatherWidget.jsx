import React from 'react';
import { CloudRain, Wind, Droplets, Calendar } from 'lucide-react';
import { FORECAST_7DAYS } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';

export default function WeatherWidget() {
  const { darkMode } = useTheme();
  const today = FORECAST_7DAYS[0];

  return (
    <div className={`border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-b from-brand-navy to-slate-900 border-slate-800 text-white' 
        : 'bg-white border-slate-200 text-slate-800 shadow-md'
    }`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center space-x-2">
          <CloudRain className="w-5 h-5 text-brand-sky" />
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Météo & Pluies — Thiaroye
          </h3>
        </div>
        <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EN DIRECT</span>
      </div>

      {/* Main Temperature & Rainfall Display */}
      <div className="grid grid-cols-2 gap-4 my-4 items-center">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl border text-brand-sky ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-sky-50 border-sky-100'
          }`}>
            <CloudRain className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {today.temp}
            </div>
            <div className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pluies intenses
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-2xl border space-y-2 text-xs ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`flex items-center space-x-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span>Précipitations :</span>
            </span>
            <span className={`font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{today.rainMm}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`flex items-center space-x-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Wind className="w-3.5 h-3.5 text-cyan-500" />
              <span>Vent rafales :</span>
            </span>
            <span className={`font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>24 km/h</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Mini Row */}
      <div className="pt-2">
        <div className={`text-xs font-semibold mb-2 flex items-center space-x-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>Prévisions 7 Jours</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
          {FORECAST_7DAYS.map((day, idx) => (
            <div 
              key={idx}
              className={`p-2 rounded-xl border text-[11px] flex flex-col items-center justify-between transition ${
                idx === 0 
                  ? 'bg-brand-red/20 border-brand-red text-brand-red font-bold' 
                  : darkMode
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="truncate w-full font-medium">{day.day.slice(0, 3)}</span>
              <CloudRain className="w-4 h-4 my-1 text-brand-sky" />
              <span className={`font-mono text-[10px] ${darkMode ? 'text-white' : 'text-slate-800'}`}>{day.temp}</span>
              <span className="text-[9px] text-brand-red font-semibold">{day.rainProb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
