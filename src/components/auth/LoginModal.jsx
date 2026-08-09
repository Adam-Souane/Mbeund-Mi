import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import Logo from '../common/Logo';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' | 'AGENT' | 'CITOYEN'
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({ email, role });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-brand-navy border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <Logo size="sm" showSlogan={false} />
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-white text-lg">Espace Connexion</h3>
            <p className="text-slate-400 text-xs">Accès réservé aux administrateurs et agents de la cellule de crise</p>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Type de Compte</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2 rounded-xl font-bold border transition ${
                  role === 'ADMIN' ? 'bg-brand-red border-brand-red text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('AGENT')}
                className={`py-2 rounded-xl font-bold border transition ${
                  role === 'AGENT' ? 'bg-brand-red border-brand-red text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Agent Terrain
              </button>
              <button
                type="button"
                onClick={() => setRole('CITOYEN')}
                className={`py-2 rounded-xl font-bold border transition ${
                  role === 'CITOYEN' ? 'bg-brand-red border-brand-red text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Citoyen
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Adresse Email / Identifiant</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input 
                type="email" 
                required
                placeholder="agent@thiaroye.sn" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-brand-navy-light hover:bg-slate-800 text-white font-bold py-3 rounded-xl border border-slate-700 shadow-lg transition active:scale-95 text-xs mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isLoading ? 'Connexion en cours...' : 'Se Connecter'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
