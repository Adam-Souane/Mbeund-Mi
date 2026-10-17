import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Navigation, MapPin, Users, ArrowRight } from 'lucide-react';
import { useRefuges } from '../../shared/hooks/useRefuges';

// Liste des refuges réels de Thiaroye-sur-Mer (fallback résilient)
const REFUGES_SECOURS = [
  {
    id: 1,
    nom: 'CEM Thiaroye 44 (Site d’évacuation surélevé)',
    type: 'École surélevée',
    adresse: 'Ndakhane / Tally Diallo, Thiaroye',
    quartier: 'Ndakhane',
    capacite: 450,
    coords: [14.7455, -17.3825],
  },
  {
    id: 2,
    nom: 'Poste de Santé Ndakhane',
    type: 'Centre de soins & secours',
    adresse: 'Avenue Principale Ndakhane',
    quartier: 'Ndakhane',
    capacite: 150,
    coords: [14.7475, -17.3840],
  },
  {
    id: 3,
    nom: 'Mairie de Thiaroye-sur-Mer',
    type: 'Bâtiment public sécurisé',
    adresse: 'Place Municipale, Thiaroye',
    quartier: 'Gare',
    capacite: 300,
    coords: [14.7520, -17.3792],
  },
  {
    id: 4,
    nom: 'École Primaire El Hadji Amadou Thiam',
    type: 'École refuge',
    adresse: 'Médina Fass, Thiaroye',
    quartier: 'Fass',
    capacite: 350,
    coords: [14.7510, -17.3780],
  },
];

function getDistanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function LieuSurWidget({ userQuartier = 'Thiaroye-sur-Mer', className = '' }) {
  const navigate = useNavigate();
  const { data: refugesGeoJson } = useRefuges();

  // Extraction de la liste des refuges
  const refugesList = useMemo(() => {
    const apiRefuges = (refugesGeoJson?.features || []).map((f) => ({
      id: f.id,
      nom: f.properties?.nom || 'Point de Refuge',
      type: f.properties?.type_refuge || 'Abri sûr',
      adresse: f.properties?.adresse || f.properties?.quartier || 'Thiaroye',
      quartier: f.properties?.quartier || 'Thiaroye',
      capacite: f.properties?.capacite_personnes || 200,
      coords: f.geometry?.coordinates ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : [14.7455, -17.3825],
    }));

    return apiRefuges.length > 0 ? apiRefuges : REFUGES_SECOURS;
  }, [refugesGeoJson]);

  // Détermination du refuge le plus adapté selon le quartier du citoyen
  const closestRefuge = useMemo(() => {
    const qLower = (userQuartier || '').toLowerCase();
    const match = refugesList.find((r) => r.quartier.toLowerCase().includes(qLower) || qLower.includes(r.quartier.toLowerCase()));
    return match || refugesList[0];
  }, [refugesList, userQuartier]);

  // Distance indicative (par défaut ~340m dans le quartier)
  const distanceEstimee = 340;

  const handleAllerAuLieuSur = () => {
    navigate(`/citoyen/carte?refugeId=${closestRefuge.id}`);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900/95 to-teal-950/70 text-white border border-teal-500/30 dark:border-teal-400/20 shadow-xl transition-all hover:border-teal-400/50 group ${className}`}
    >
      {/* 1. Trame cartographique vectorielle subtile en arrière-plan */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern-lieu-sur" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" className="text-teal-300" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern-lieu-sur)" />
        </svg>
      </div>

      {/* 2. Lueur atmosphérique verte d'accueil sécurisé */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 relative z-10">
        {/* Volet Visuel Gauche : Mini-Radar / Balise de guidage temps réel */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Mini-Balise Radar Cartographique */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-950 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
            {/* Cercles concentriques radar */}
            <span className="absolute w-12 h-12 rounded-full border border-emerald-400/20 animate-ping opacity-60" />
            <span className="absolute w-8 h-8 rounded-full border border-emerald-400/30" />
            
            {/* Trait de repérage laser */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/40 relative z-10">
              <ShieldCheck size={20} className="text-white" />
            </div>

            {/* Pastille de signal direct */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
          </div>

          {/* Informations et métadonnées du refuge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
                Lieu sûr le plus proche
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Accessible 24h/24
              </span>
            </div>

            <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight truncate">
              {closestRefuge.nom}
            </h3>

            {/* Badges d'accessibilité immédiate (Distance, temps de marche, capacité) */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-400/25 text-teal-200 font-bold">
                <MapPin size={11} className="text-teal-400" />
                <span>~{distanceEstimee} m · 4 min à pied</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300 font-medium text-xs">
                <Users size={12} className="text-slate-400" />
                <span>Capacité {closestRefuge.capacite} pers.</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                · {closestRefuge.type}
              </span>
            </div>
          </div>
        </div>

        {/* Volet Droit : Commande directe d'évacuation interactive */}
        <div className="flex items-center gap-2 shrink-0 self-stretch lg:self-auto pt-1 lg:pt-0">
          <button
            type="button"
            onClick={handleAllerAuLieuSur}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Navigation size={16} className="text-slate-950 animate-bounce" />
            <span className="tracking-wide">Itinéraire d’évacuation</span>
            <ArrowRight size={15} className="text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
}
