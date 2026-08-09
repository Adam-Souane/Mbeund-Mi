import React from 'react';
import GaugeRisk from '../components/dashboard/GaugeRisk';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import RainfallChart from '../components/dashboard/RainfallChart';
import InteractiveMap from '../components/map/InteractiveMap';
import CitizenReportCard from '../components/reports/CitizenReportCard';
import { CURRENT_RISK, CITIZEN_REPORTS } from '../utils/mockData';
import { AlertOctagon, Activity, Radio, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage({ setActiveTab, onOpenEmergencyModal }) {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome Banner */}
      <div className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-r from-brand-navy via-slate-900 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-brand-navy to-brand-navy border-slate-800 text-white shadow-lg'
      }`}>
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-red uppercase tracking-widest mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Poste de Commandement — Thiaroye-sur-Mer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Tableau de Bord Général — MBEUND MI
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Système d'alerte précoce, de modélisation cartographique des risques et de suivi des réseaux d'évacuation d'eau à Thiaroye-sur-Mer.
          </p>
        </div>

        <button 
          onClick={onOpenEmergencyModal}
          className="shrink-0 bg-gradient-to-r from-brand-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold px-5 py-3 rounded-2xl shadow-xl shadow-red-900/40 transition hover:scale-105 active:scale-95 text-xs flex items-center space-x-2"
        >
          <AlertOctagon className="w-4 h-4 animate-bounce" />
          <span>Déclarer une Inondation</span>
        </button>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-3xl p-4 shadow-xl flex items-center space-x-4 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="p-3 bg-red-500/20 text-brand-red rounded-2xl border border-red-500/30">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alertes Actives</span>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{CURRENT_RISK.activeAlertsCount} Zones</div>
            <span className="text-[10px] text-brand-red font-bold">Thiaroye Gare & Guinaw</span>
          </div>
        </div>

        <div className={`border rounded-3xl p-4 shadow-xl flex items-center space-x-4 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-2xl border border-emerald-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pompes en Service</span>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{CURRENT_RISK.pumpsRunning} / 30</div>
            <span className="text-[10px] text-emerald-500 font-bold">Débit max: 4,100 m³/h</span>
          </div>
        </div>

        <div className={`border rounded-3xl p-4 shadow-xl flex items-center space-x-4 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="p-3 bg-cyan-500/20 text-cyan-500 rounded-2xl border border-cyan-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Réseau Capteurs IoT</span>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{CURRENT_RISK.sensorsOkPercentage}% Opérationnels</div>
            <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Signalement / 5 min</span>
          </div>
        </div>

        <div className={`border rounded-3xl p-4 shadow-xl flex items-center space-x-4 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-[11px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Signalements Citoyens</span>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>48 ce mois</div>
            <span className="text-[10px] text-amber-500 font-bold">4 nouveaux aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Gauge Risk, Weather, Rainfall Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GaugeRisk onExploreMap={() => setActiveTab('map')} />
        <WeatherWidget />
        <RainfallChart />
      </div>

      {/* Interactive Map Preview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-bold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <span>Aperçu SIG — Zones à Risque & Capteurs</span>
            </h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Carte dynamique de la commune de Thiaroye-sur-Mer</p>
          </div>
          <button 
            onClick={() => setActiveTab('map')}
            className="flex items-center space-x-1 text-xs text-brand-red font-bold hover:underline"
          >
            <span>Plein Écran SIG</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <InteractiveMap />
      </div>

      {/* Recent Citizen Observations Feed */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Derniers Signalements Terrain</h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Observations validées transmises par les riverains</p>
          </div>
          <button 
            onClick={() => setActiveTab('reports')}
            className="flex items-center space-x-1 text-xs text-brand-sky font-bold hover:underline"
          >
            <span>Tous les signalements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITIZEN_REPORTS.slice(0, 3).map((report) => (
            <CitizenReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>

    </div>
  );
}
