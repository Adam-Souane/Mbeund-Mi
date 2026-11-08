import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import logoLight from '../../assets/logo-light.png';

// Durée d'affichage optimale : 2 secondes pour apprécier le splash sans ralentir l'accès
const DUREE_VISIBLE_MS = 2000;
const DELAI_MAXIMUM_MS = 6000;

export default function SplashScreen() {
  const navigate = useNavigate();
  const continuer = () => navigate('/login', { replace: true });
  const [logoCharge, setLogoCharge] = useState(false);
  const [policeChargee, setPoliceChargee] = useState(false);
  const [progression, setProgression] = useState(15);
  const pret = logoCharge && policeChargee;

  useEffect(() => {
    let actif = true;
    const polices = document.fonts?.ready ?? Promise.resolve();
    polices.then(() => {
      if (actif) setPoliceChargee(true);
    });
    return () => {
      actif = false;
    };
  }, []);

  // Animation progressive de la barre de chargement
  useEffect(() => {
    if (!pret) return;
    const interval = setInterval(() => {
      setProgression((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, DUREE_VISIBLE_MS / 10);
    return () => clearInterval(interval);
  }, [pret]);

  useEffect(() => {
    const delai = pret ? DUREE_VISIBLE_MS : DELAI_MAXIMUM_MS;
    const timer = setTimeout(() => navigate('/login', { replace: true }), delai);
    return () => clearTimeout(timer);
  }, [pret, navigate]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Accéder directement à la connexion"
      onClick={continuer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') continuer();
      }}
      className="min-h-screen bg-white relative flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer overflow-hidden"
    >
      {/* Halo radial discret et élégant en arrière-plan blanc */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(11,37,69,0.06),rgba(255,255,255,1))] pointer-events-none" />

      {/* En-tête : Badge Cœur IA & Prévention */}
      <div className="relative z-10 w-full flex justify-center pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-xs text-xs font-semibold text-[#0B2545] tracking-wide animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#087E8B] animate-pulse" />
          <span className="flex items-center gap-1 font-bold text-[#087E8B]">
            <Sparkles size={13} className="text-[#087E8B]" /> Cœur IA
          </span>
          <span className="text-slate-300">·</span>
          <span>Système d'Alerte Précoce</span>
        </div>
      </div>

      {/* Bloc Central : Logo MBEUND MI + Slogan dans un cadre blanc raffiné */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto px-4 max-w-md w-full">
        {/* Conteneur logo surélevé avec ombre douce */}
        <div
          className={`transform transition-all duration-700 ease-out ${
            pret ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
          }`}
        >
          <div className="relative inline-flex items-center justify-center p-6 sm:p-7 rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 mb-6">
            <img
              src={logoLight}
              alt="MBEUND MI - Cœur IA"
              className="h-12 sm:h-14 w-auto object-contain"
              onLoad={() => setLogoCharge(true)}
              onError={() => setLogoCharge(true)}
            />
          </div>

          {/* Slogan officiel en wolof */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="w-6 h-px bg-slate-300" />
            <span className="text-xs font-black tracking-widest uppercase text-[#0B2545]">
              Bul Xaar, Waajal Ko.
            </span>
            <span className="w-6 h-px bg-slate-300" />
          </div>

          {/* Sous-titre */}
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-xs mx-auto">
            Surveillance hydrologique & mobilisation citoyenne
          </p>

          {/* Barre de progression fine et moderne */}
          <div className="w-48 sm:w-56 h-1 bg-slate-100 rounded-full mx-auto mt-7 overflow-hidden">
            <div
              className="h-full bg-[#0B2545] rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progression}%` }}
            />
          </div>

          <p className="text-[11px] font-semibold text-slate-400 mt-3 flex items-center justify-center gap-1">
            <span>Chargement sécurisé</span>
            <span className="animate-pulse">...</span>
          </p>
        </div>
      </div>

      {/* Bas de page officiel : Commune de Thiaroye-sur-Mer */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3 gap-1">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck size={13} className="text-[#087E8B]" /> Plateforme Officielle · Commune de Thiaroye-sur-Mer
        </span>
        <span className="text-slate-400">Dakar, Sénégal</span>
      </div>
    </div>
  );
}
