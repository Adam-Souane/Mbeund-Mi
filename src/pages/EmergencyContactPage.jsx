import React from 'react';
import { PhoneCall, Mail, MapPin, Clock, ShieldAlert, Send, Globe, Share2 } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../utils/mockData';
import { useTheme } from '../context/ThemeContext';

export default function EmergencyContactPage() {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-6 pb-12 min-w-0 w-full overflow-hidden">
      
      {/* Header */}
      <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${
        darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <h1 className="text-xl sm:text-2xl font-extrabold flex items-center space-x-2 truncate">
          <PhoneCall className="w-6 h-6 text-emerald-500 shrink-0" />
          <span className="truncate">Contact & Permanence d'Urgence</span>
        </h1>
        <p className={`text-xs mt-1 leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Coordonnées utiles, numéros d'urgence et formulaire de contact direct avec la mairie et le comité de crise de Thiaroye-sur-Mer.
        </p>
      </div>

      {/* Emergency Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EMERGENCY_CONTACTS.map((c, idx) => (
          <div 
            key={idx} 
            className={`border rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between overflow-hidden min-w-0 transition-colors ${
              darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'
            }`}
          >
            <div className="min-w-0 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-red bg-red-500/20 px-2 py-0.5 rounded truncate max-w-full">
                PERMANENCE 24/7
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white dark:text-white truncate">{c.title}</h3>
              <p className={`text-xs leading-relaxed break-words ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {c.desc}
              </p>
            </div>

            <div className={`pt-3 border-t flex items-center justify-between min-w-0 gap-2 ${
              darkMode ? 'border-slate-800/80' : 'border-slate-100'
            }`}>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] sm:text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Numéro d'Urgence :</div>
                <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-500 truncate">{c.phone}</div>
              </div>

              <a
                href={`tel:${c.phone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Appeler</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Social Networks & Official Channels Compartment */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'
      }`}>
        <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
          <Share2 className="w-5 h-5 text-brand-sky shrink-0" />
          <span className="truncate">Réseaux Officiels & Communication Mairie</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs min-w-0">
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noreferrer"
            className={`p-3 rounded-2xl border flex items-center space-x-3 transition min-w-0 ${
              darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">Facebook Mairie</div>
              <div className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>@ThiaroyeSurMerOfficiel</div>
            </div>
          </a>

          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noreferrer"
            className={`p-3 rounded-2xl border flex items-center space-x-3 transition min-w-0 ${
              darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">Twitter / X Urgence</div>
              <div className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>@MbeundMi_Alerte</div>
            </div>
          </a>

          <a 
            href="https://whatsapp.com" 
            target="_blank" 
            rel="noreferrer"
            className={`p-3 rounded-2xl border flex items-center space-x-3 transition min-w-0 ${
              darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">Groupe WhatsApp Alertes</div>
              <div className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Comité Vigilance Local</div>
            </div>
          </a>
        </div>
      </div>

      {/* Direct Message Form */}
      <div className={`border rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-4 overflow-hidden min-w-0 transition-colors ${
        darkMode ? 'bg-brand-navy border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'
      }`}>
        <h3 className="text-sm sm:text-base font-bold flex items-center space-x-2 truncate">
          <Mail className="w-5 h-5 text-brand-sky shrink-0" />
          <span className="truncate">Envoyer un Message au Comité Technique</span>
        </h3>

        <form onSubmit={e => { e.preventDefault(); alert("Message transmis à la mairie et au comité de crise !"); }} className="space-y-4 text-xs min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div className="min-w-0">
              <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nom complet</label>
              <input type="text" required placeholder="Votre nom" className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-red ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`} />
            </div>
            <div className="min-w-0">
              <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Téléphone</label>
              <input type="tel" required placeholder="+221..." className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-red ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`} />
            </div>
          </div>

          <div className="min-w-0">
            <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sujet</label>
            <input type="text" required placeholder="Demande de motopompe / Information..." className={`w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-red ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`} />
          </div>

          <div className="min-w-0">
            <label className={`block font-semibold mb-1 truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Message</label>
            <textarea rows="4" required placeholder="Votre message..." className={`w-full border rounded-xl p-3 focus:outline-none focus:border-brand-red ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}></textarea>
          </div>

          <button type="submit" className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-2 truncate">
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate">Envoyer le Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
