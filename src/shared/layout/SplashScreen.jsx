import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoDark from '../../assets/logo-dark.png';

// Durée d'affichage une fois le logo et la police chargés. Le compte à rebours
// ne part pas avant : au premier chargement (serveurs qui démarrent), le logo
// arrive tard et l'écran partait vers la connexion avant qu'on l'ait vu.
const DUREE_VISIBLE_MS = 2500;
// Filet de sécurité si le logo ne se charge jamais.
const DELAI_MAXIMUM_MS = 8000;

export default function SplashScreen() {
  const navigate = useNavigate();
  const continuer = () => navigate('/login', { replace: true });
  const [logoCharge, setLogoCharge] = useState(false);
  const [policeChargee, setPoliceChargee] = useState(false);
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

  useEffect(() => {
    const delai = pret ? DUREE_VISIBLE_MS : DELAI_MAXIMUM_MS;
    const timer = setTimeout(() => navigate('/login', { replace: true }), delai);
    return () => clearTimeout(timer);
  }, [pret, navigate]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Accéder à la connexion"
      onClick={continuer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') continuer();
      }}
      className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 cursor-pointer"
    >
      {/* Logo et textes apparaissent ensemble, en fondu, une fois chargés */}
      <div className={`flex flex-col items-center gap-4 transition-opacity duration-700 ${pret ? 'opacity-100' : 'opacity-0'}`}>
        <img
          src={logoDark}
          alt="MBEUND MI"
          className="h-10"
          onLoad={() => setLogoCharge(true)}
          onError={() => setLogoCharge(true)}
        />
        <div className="flex items-center gap-3">
          <span className="w-6 h-px bg-navy-50" />
          <span className="text-xs font-semibold tracking-widest uppercase text-navy-50">Bul Xaar, Waajal Ko.</span>
          <span className="w-6 h-px bg-navy-50" />
        </div>
        <span className="mt-2.5 text-xs font-bold tracking-wider uppercase text-navy-400">
          Plateforme de prévention des inondations
        </span>
      </div>
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-navy-50 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
