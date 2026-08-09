import React from 'react';
import { PhoneCall, Mail, MapPin, Clock, ShieldAlert, Send } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../utils/mockData';

export default function EmergencyContactPage() {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <PhoneCall className="w-6 h-6 text-emerald-400" />
          <span>Contact & Permanence d'Urgence</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Coordonnées utiles, numéros d'urgence et formulaire de contact direct avec le comité de crise de Thiaroye-sur-Mer.
        </p>
      </div>

      {/* Emergency Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EMERGENCY_CONTACTS.map((c, idx) => (
          <div key={idx} className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red bg-red-500/20 px-2 py-0.5 rounded">
                PERMANENCE 24/7
              </span>
              <h3 className="text-base font-extrabold text-white mt-2">{c.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">{c.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Numéro d'Urgence :</div>
                <div className="text-xl font-extrabold font-mono text-emerald-400">{c.phone}</div>
              </div>

              <a
                href={`tel:${c.phone}`}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Appeler</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Message Form */}
      <div className="bg-brand-navy border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Mail className="w-5 h-5 text-brand-sky" />
          <span>Envoyer un Message au Comité Technique</span>
        </h3>

        <form onSubmit={e => { e.preventDefault(); alert("Message transmis à la mairie et au comité de crise !"); }} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nom complet</label>
              <input type="text" required placeholder="Votre nom" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Téléphone</label>
              <input type="tel" required placeholder="+221..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Sujet</label>
            <input type="text" required placeholder="Demande de motopompe / Information..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red" />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Message</label>
            <textarea rows="4" required placeholder="Votre message..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-brand-red"></textarea>
          </div>

          <button type="submit" className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Envoyer le Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
