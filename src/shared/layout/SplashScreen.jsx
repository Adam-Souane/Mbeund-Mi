import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoLight from '../../assets/logo-light.png';

const DUREE_VISIBLE_MS = 2000;
const DELAI_MAXIMUM_MS = 5000;

export default function SplashScreen() {
  const navigate = useNavigate();
  const continuer = () => navigate('/login', { replace: true });
  const [logoCharge, setLogoCharge] = useState(false);
  const [policeChargee, setPoliceChargee] = useState(false);
  const [progression, setProgression] = useState(15);
  const pret = logoCharge && policeChargee;

  useEffect(() => {
    try {
      sessionStorage.removeItem('mbeund_mi_onboarding_seen');
    } catch {}
    let actif = true;
    const polices = document.fonts?.ready ?? Promise.resolve();
    polices.then(() => {
      if (actif) setPoliceChargee(true);
    });
    return () => {
      actif = false;
    };
  }, []);

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
      className="min-h-screen bg-white flex flex-col items-center justify-between p-6 select-none cursor-pointer"
    >
      {/* Haut : vide et aéré */}
      <div className="w-full h-8" />

      {/* Centre : Logo MBEUND MI authentique + Slogan centré + barre fine */}
      <div
        className={`flex flex-col items-center justify-center text-center max-w-sm w-full transition-all duration-700 ease-out ${
          pret ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <img
          src={logoLight}
          alt="MBEUND MI"
          className="h-12 sm:h-14 w-auto object-contain mb-3"
          onLoad={() => setLogoCharge(true)}
          onError={() => setLogoCharge(true)}
        />

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-5 h-px bg-slate-300" />
          <span className="text-[11px] font-black tracking-widest uppercase text-[#0B2545]">
            Bul Xaar, Waajal Ko.
          </span>
          <span className="w-5 h-px bg-slate-300" />
        </div>

        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Plateforme de prévention des inondations · Thiaroye-sur-Mer
        </p>

        {/* Barre de progression fine et discrète */}
        <div className="w-36 sm:w-44 h-1 bg-slate-100 rounded-full mx-auto mt-7 overflow-hidden">
          <div
            className="h-full bg-[#0B2545] rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progression}%` }}
          />
        </div>
      </div>

      {/* Bas de page officiel sobre */}
      <div className="text-[11px] text-slate-400 font-medium text-center pb-2">
        Commune de Thiaroye-sur-Mer · Dakar, Sénégal
      </div>
    </div>
  );
}
