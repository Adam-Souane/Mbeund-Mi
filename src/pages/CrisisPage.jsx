import React, { useState } from 'react';
import { ShieldAlert, Radio, Send, PhoneCall, CheckCircle2, Truck, BellRing } from 'lucide-react';
import { PUMP_STATIONS, EMERGENCY_CONTACTS } from '../utils/mockData';
import { useTheme } from '../context/ThemeContext';

export default function CrisisPage() {
  const { darkMode } = useTheme();
  const [smsText, setSmsText] = useState("ALERTE INONDATION : Pluies intenses à Thiaroye Gare. Évitez les zones basses. Pompes actives.");
  const [smsSent, setSmsSent] = useState(false);

  const handleBroadcastSms = (e) => {
    e.preventDefault();
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 min-w-0 w-full overflow-hidden">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-gradient-to-r from-red-950 via-brand-navy to-slate-900 border-red-500/40 text-white' : 'bg-gradient-to-r from-red-900 via-brand-navy to-brand-navy border-red-400 text-white shadow-xl'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-widest mb-1 truncate">
            <Radio className="w-4 h-4 animate-pulse text-brand-red shrink-0" />
            <span className="truncate">Cellule Communale de Gestion de Crise (PCS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center space-x-2 truncate">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-brand-red shrink-0" />
            <span className="truncate">Poste de Commandement d'Urgence</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
            Coordination des secours, diffusion d'alertes massives SMS et affectation des motopompes mobiles.
          </p>
        </div>

        <div className="bg-red-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg flex items-center space-x-2 animate-pulse shrink-0 max-w-full truncate">
          <BellRing className="w-4 h-4 shrink-0" />
          <span className="truncate">STATUT : CELLULE D'URGENCE ACTIVE</span>
        </div>
      </div>

      {/* Grid: Broadcast SMS Alert + Pump Dispatch Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        
        {/* SMS Broadcast Widget */}
        <div className={`border rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden min-w-0 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}>
          <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
            <Send className="w-5 h-5 text-brand-red shrink-0" />
            <span className="truncate">Diffusion Alerte SMS Massifs aux Riverains</span>
          </h3>

          <p className={`text-xs leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Envoyez une alerte prioritaire par réseau cellulaire à tous les habitants géolocalisés à Thiaroye-sur-Mer.
          </p>

          <form onSubmit={handleBroadcastSms} className="space-y-3 text-xs min-w-0">
            <div className="min-w-0">
              <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Cible de la diffusion</label>
              <select className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-red truncate ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}>
                <option>Tous les habitants de Thiaroye-sur-Mer (~85,000 personnes)</option>
                <option>Secteur Thiaroye Gare uniquement</option>
                <option>Secteur Tally Diallo uniquement</option>
                <option>Secteur Guinaw Rails uniquement</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Message d'alerte (SMS)</label>
              <textarea 
                rows="4"
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                className={`w-full border rounded-xl p-3 focus:outline-none focus:border-brand-red font-mono text-xs break-words ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition text-xs truncate"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="truncate">Diffuser l'Alerte SMS Immédiatement</span>
            </button>

            {smsSent && (
              <div className="p-3 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl text-center font-bold text-xs flex items-center justify-center space-x-2 animate-fade-in break-words">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="break-words">Alerte SMS transmise aux 85,000 destinataires !</span>
              </div>
            )}
          </form>
        </div>

        {/* Motopompes Mobile Dispatching Console */}
        <div className={`border rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden min-w-0 transition-colors ${
          darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}>
          <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
            <Truck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="truncate">Déploiement des Motopompes d'Urgence</span>
          </h3>

          <p className={`text-xs leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            État d'affectation des unités mobiles de pompage haute pression sur le terrain.
          </p>

          <div className="space-y-3 text-xs min-w-0">
            {PUMP_STATIONS.map((pump) => (
              <div key={pump.id} className={`p-3.5 rounded-2xl border flex items-center justify-between min-w-0 gap-2 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{pump.name}</div>
                  <div className={`text-[11px] mt-0.5 truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Capacité : <span className="font-mono font-semibold">{pump.capacity}</span> | Régime : <span className="text-emerald-500 font-mono font-bold">{pump.flowRate}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ${
                  pump.status === 'EN SERVICE' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                }`}>
                  {pump.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Emergency Hotlines Direct Action */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
          <PhoneCall className="w-5 h-5 text-brand-sky shrink-0" />
          <span className="truncate">Lignes Directes d'Intervention Rapide</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs min-w-0">
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border space-y-2 min-w-0 overflow-hidden ${
              darkMode ? 'bg-brand-navy border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="font-bold truncate">{contact.title}</h4>
              <div className="text-brand-red font-mono font-extrabold text-base truncate">{contact.phone}</div>
              <p className={`text-[11px] leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{contact.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
