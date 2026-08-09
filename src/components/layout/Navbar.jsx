import React from 'react';
import Logo from '../common/Logo';
import { AlertTriangle, Bell, PhoneCall, Search, ShieldAlert, Radio, User } from 'lucide-react';
import { CURRENT_RISK } from '../../utils/mockData';

export default function Navbar({ activeTab, setActiveTab, onOpenEmergencyModal, onOpenLoginModal, currentUser }) {
  return (
    <header className="sticky top-0 z-50 bg-brand-navy/95 backdrop-blur-md border-b border-slate-800 text-white px-4 lg:px-8 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Slogan */}
        <div className="flex items-center space-x-6 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <Logo size="sm" showSlogan={true} />
        </div>

        {/* Live Risk Status Banner Badge (Center Header) */}
        <div className="hidden md:flex items-center space-x-3 bg-slate-900/80 px-4 py-2 rounded-full border border-red-500/30">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400 font-medium">NIVEAU DE RISQUE : </span>
            <span className="text-brand-red font-bold tracking-wide">{CURRENT_RISK.percentage}% — {CURRENT_RISK.level}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs text-slate-300 flex items-center space-x-1">
            <Radio className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
            <span>Thiaroye-sur-Mer</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          
          {/* Login / Profile button */}
          <button 
            onClick={onOpenLoginModal}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <User className="w-3.5 h-3.5 text-brand-sky" />
            <span>{currentUser ? currentUser.email.split('@')[0] : 'Connexion'}</span>
          </button>

          {/* Emergency Signalement Direct Button */}
          <button 
            onClick={onOpenEmergencyModal}
            className="flex items-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>Signaler Urgence</span>
          </button>

          {/* Quick Emergency Phone */}
          <a
            href="tel:18"
            className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <PhoneCall className="w-3.5 h-3.5 text-green-400" />
            <span className="font-mono font-bold">18</span>
          </a>
        </div>
      </div>
    </header>
  );
}

