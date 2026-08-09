import React, { useState } from 'react';
import { ShieldAlert, Radio, Send, PhoneCall, AlertTriangle, CheckCircle2, Truck, BellRing } from 'lucide-react';
import { PUMP_STATIONS, EMERGENCY_CONTACTS } from '../utils/mockData';

export default function CrisisPage() {
  const [smsText, setSmsText] = useState("ALERTE INONDATION : Pluies intenses à Thiaroye Gare. Évitez les zones basses. Pompes actives.");
  const [smsSent, setSmsSent] = useState(false);

  const handleBroadcastSms = (e) => {
    e.preventDefault();
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-brand-navy to-slate-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
            <Radio className="w-4 h-4 animate-pulse text-brand-red" />
            <span>Cellule Communale de Gestion de Crise (PCS)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-brand-red" />
            <span>Poste de Commandement d'Urgence</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Coordination des secours, diffusion d'alertes massives SMS et affectation des motopompes mobiles.
          </p>
        </div>

        <div className="bg-red-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-red-900/50 flex items-center space-x-2 animate-pulse">
          <BellRing className="w-4 h-4" />
          <span>STATUT : CELLULE D'URGENCE ACTIVE</span>
        </div>
      </div>

      {/* Grid: Broadcast SMS Alert + Pump Dispatch Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SMS Broadcast Widget */}
        <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Send className="w-5 h-5 text-brand-red" />
            <span>Diffusion Alerte SMS Massifs aux Riverains</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Envoyez une alerte prioritaire par réseau cellulaire à tous les habitants géolocalisés à Thiaroye-sur-Mer.
          </p>

          <form onSubmit={handleBroadcastSms} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cible de la diffusion</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red">
                <option>Tous les habitants de Thiaroye-sur-Mer (~85,000 personnes)</option>
                <option>Secteur Thiaroye Gare uniquement</option>
                <option>Secteur Tally Diallo uniquement</option>
                <option>Secteur Guinaw Rails uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Message d'alerte (SMS)</label>
              <textarea 
                rows="4"
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-red font-mono text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 transition active:scale-95 text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Diffuser l'Alerte SMS Immédiatement</span>
            </button>

            {smsSent && (
              <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-center font-bold flex items-center justify-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Alerte SMS transmise aux opérateurs télécoms (85,000 destinataires) !</span>
              </div>
            )}
          </form>
        </div>

        {/* Motopompes Mobile Dispatching Console */}
        <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Déploiement des Motopompes d'Urgence</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            État d'affectation des unités mobiles de pompage haute pression sur le terrain.
          </p>

          <div className="space-y-3 text-xs">
            {PUMP_STATIONS.map((pump) => (
              <div key={pump.id} className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{pump.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Capacité : <span className="text-white font-mono">{pump.capacity}</span> | Régime : <span className="text-emerald-400 font-mono">{pump.flowRate}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                  pump.status === 'EN SERVICE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {pump.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Emergency Hotlines Direct Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <PhoneCall className="w-5 h-5 text-brand-sky" />
          <span>Lignes Directes d'Intervention Rapide</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <div key={idx} className="bg-brand-navy p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white">{contact.title}</h4>
              <div className="text-brand-red font-mono font-extrabold text-base">{contact.phone}</div>
              <p className="text-slate-400 text-[11px]">{contact.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
