import React from 'react';
import Logo from '../common/Logo';
import { AlertTriangle, PhoneCall, Radio, User, Sun, Moon } from 'lucide-react';
import { CURRENT_RISK } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab, onOpenEmergencyModal, onOpenLoginModal, currentUser }) {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 px-4 lg:px-8 py-3 shadow-lg ${
      darkMode ? 'bg-brand-navy/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Slogan */}
        <div className="flex items-center space-x-6 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <Logo size="sm" showSlogan={true} />
        </div>

        {/* Live Risk Status Banner Badge (Center Header) */}
        <div className={`hidden md:flex items-center space-x-3 px-4 py-2 rounded-full border transition-colors ${
          darkMode ? 'bg-slate-900/80 border-red-500/30' : 'bg-red-50 border-red-200 shadow-sm'
        }`}>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
          </div>
          <div className="text-xs">
            <span className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'}>
              NIVEAU DE RISQUE : 
            </span>
            <span className="text-brand-red font-bold tracking-wide ml-1">{CURRENT_RISK.percentage}% — {CURRENT_RISK.level}</span>
          </div>
          <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
          <div className={`text-xs flex items-center space-x-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <Radio className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
            <span>Thiaroye-sur-Mer</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          
          {/* Light / Dark Mode Switcher Button */}
          <button 
            onClick={toggleTheme}
            title={darkMode ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
            className={`p-2 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-brand-navy border-slate-300 shadow-sm'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Login / Profile button */}
          <button 
            onClick={onOpenLoginModal}
            className={`flex items-center space-x-1.5 text-xs px-3 py-2 rounded-xl border transition ${
              darkMode 
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <User className="w-3.5 h-3.5 text-brand-sky" />
            <span>{currentUser ? currentUser.email.split('@')[0] : 'Connexion'}</span>
          </button>

          {/* Emergency Signalement Direct Button */}
          <button 
            onClick={onOpenEmergencyModal}
            className="flex items-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-red-900/30 transition-all hover:scale-105 active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">Signaler Urgence</span>
            <span className="sm:hidden">Urgence</span>
          </button>

          {/* Quick Emergency Phone */}
          <a
            href="tel:18"
            className={`hidden lg:flex items-center space-x-1.5 text-xs px-3 py-2 rounded-xl border transition ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono font-bold">18</span>
          </a>
        </div>
      </div>
    </header>
  );
}
