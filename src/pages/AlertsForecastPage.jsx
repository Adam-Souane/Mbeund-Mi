import React from 'react';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import RainfallChart from '../components/dashboard/RainfallChart';
import { FORECAST_7DAYS, RISK_ZONES } from '../utils/mockData';
import { CloudRain, AlertTriangle, ShieldCheck, Thermometer, Droplets, Wind, ShieldAlert } from 'lucide-react';

export default function AlertsForecastPage() {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <CloudRain className="w-6 h-6 text-brand-sky" />
            <span>Prévisions Météo & Vigilance Inondation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modélisation des épisodes pluvieux et prévisions d'accumulation d'eau à Thiaroye-sur-Mer.
          </p>
        </div>

        <div className="bg-red-500/20 text-brand-red border border-red-500/30 px-4 py-2 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>Bulletin Spécial Pluies Torrentielles</span>
        </div>
      </div>

      {/* Grid: Weather & Rainfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherWidget />
        <RainfallChart />
      </div>

      {/* 7-Day Detailed Forecast Table */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <CloudRain className="w-5 h-5 text-brand-sky" />
          <span>Tableau Détaillé des Prévisions à 7 Jours</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Jour</th>
                <th className="p-3.5">Température</th>
                <th className="p-3.5">Probabilité Pluie</th>
                <th className="p-3.5">Volume Prévu</th>
                <th className="p-3.5">Niveau de Risque</th>
                <th className="p-3.5">Recommandation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {FORECAST_7DAYS.map((day, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  <td className="p-3.5 font-bold text-white">{day.day}</td>
                  <td className="p-3.5 font-mono">{day.temp}</td>
                  <td className="p-3.5 text-brand-sky font-bold font-mono">{day.rainProb}</td>
                  <td className="p-3.5 font-mono">{day.rainMm}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      day.risk === 'TRÈS ÉLEVÉ' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      day.risk === 'ÉLEVÉ' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      day.risk === 'MODÉRÉ' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {day.risk}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {day.risk === 'TRÈS ÉLEVÉ' ? 'Activer motopompes & curer les caniveaux' : 'Surveillance continue'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Preventive Procedures */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-brand-red" />
          <span>Consignes Préventives & Évacuation d'Urgence</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-brand-navy rounded-2xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-brand-red text-white font-bold flex items-center justify-center text-xs">1</span>
            <h4 className="font-bold text-white">Avant l'inondation</h4>
            <p className="text-slate-400 leading-relaxed">
              Mettez vos documents importants en hauteur. Coupez l'alimentation électrique si l'eau approche des prises.
            </p>
          </div>

          <div className="p-4 bg-brand-navy rounded-2xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-brand-red text-white font-bold flex items-center justify-center text-xs">2</span>
            <h4 className="font-bold text-white">Pendant la crue</h4>
            <p className="text-slate-400 leading-relaxed">
              Ne tentez pas de franchir à pied ou en véhicule les voies submergées (Route Nationale / Tally Diallo).
            </p>
          </div>

          <div className="p-4 bg-brand-navy rounded-2xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-brand-red text-white font-bold flex items-center justify-center text-xs">3</span>
            <h4 className="font-bold text-white">Demande de motopompe</h4>
            <p className="text-slate-400 leading-relaxed">
              Signalez votre quartier sur la plateforme ou contactez le comité local pour un pompage rapide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
