import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Maximize2, Navigation } from 'lucide-react';

const SECTEURS_RADAR = [
  { nom: 'Thiaroye Gare', risque: 'Modéré', couleur: '#E0792E', niveau_eau: '14 cm', refuges: 2, capteurs: 1, x: 70, y: 30 },
  { nom: 'Cuvette Ouest', risque: 'Faible', couleur: '#10B981', niveau_eau: '8 cm', refuges: 1, capteurs: 1, x: 25, y: 45 },
  { nom: 'Ndakhane', risque: 'Faible', couleur: '#10B981', niveau_eau: '6 cm', refuges: 2, capteurs: 1, x: 50, y: 60 },
  { nom: 'Plage & Littoral', risque: 'Surveillance', couleur: '#3B82F6', niveau_eau: '19 cm', refuges: 1, capteurs: 1, x: 45, y: 82 },
];

export default function MiniRadarThiaroye({ className = '' }) {
  const navigate = useNavigate();
  const [activeSecteur, setActiveSecteur] = useState(SECTEURS_RADAR[0]);

  return (
    <div className={`bg-navy-950 text-white rounded-3xl p-5 sm:p-6 border border-navy-800 shadow-xl overflow-hidden relative flex flex-col justify-between ${className}`}>
      {/* Grille cartographique technique en arrière-plan */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.4) 0%, transparent 60%), linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        }}
      />

      {/* En-tête avec coordonnées SIG et bouton plein écran */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center">
            <Compass size={18} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Radar SIG & Cartographie Communale
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              GPS : 14°44&apos;50&quot;N · 17°23&apos;05&quot;W · WGS 84
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/citoyen/carte')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <Maximize2 size={13} />
          <span>Plein écran</span>
        </button>
      </div>

      {/* Surface Radar Interactive stylisée */}
      <div className="relative z-10 my-2 h-44 sm:h-52 w-full rounded-2xl bg-gradient-to-b from-navy-900/90 to-navy-950/90 border border-navy-800 p-3 flex items-center justify-center overflow-hidden">
        {/* Cercles concentriques radar */}
        <div className="absolute w-36 h-36 rounded-full border border-sky-500/20 pointer-events-none" />
        <div className="absolute w-60 h-60 rounded-full border border-sky-500/15 pointer-events-none" />
        <div className="absolute w-80 h-80 rounded-full border border-sky-500/10 pointer-events-none" />

        {/* Ligne de balayage radar animée */}
        <div
          className="absolute inset-0 origin-center pointer-events-none animate-spin"
          style={{
            animationDuration: '6s',
            background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.25) 0deg, transparent 60deg, transparent 360deg)',
          }}
        />

        {/* Secteurs représentés sur la carte */}
        {SECTEURS_RADAR.map((sec) => {
          const isSelected = sec.nom === activeSecteur.nom;
          return (
            <button
              key={sec.nom}
              type="button"
              onClick={() => setActiveSecteur(sec)}
              style={{ left: `${sec.x}%`, top: `${sec.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 cursor-pointer ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75"
                  style={{ backgroundColor: sec.couleur }}
                />
                <span
                  className="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white shadow-lg"
                  style={{ backgroundColor: sec.couleur }}
                />
              </div>
              <span
                className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-md transition-all ${
                  isSelected
                    ? 'bg-white text-navy-950 shadow-md font-black scale-105'
                    : 'bg-black/60 text-slate-200 border border-white/20'
                }`}
              >
                {sec.nom}
              </span>
            </button>
          );
        })}

        {/* Océan Atlantique / Trait de côte sud */}
        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-sky-400/60 uppercase tracking-widest pointer-events-none">
          ≈ Océan Atlantique (Baie de Hann)
        </div>
      </div>

      {/* Info-bulle dynamique du secteur sélectionné au clic */}
      <div className="relative z-10 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">{activeSecteur.nom}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${activeSecteur.couleur}33`, color: activeSecteur.couleur }}
            >
              Vigilance : {activeSecteur.risque}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Hauteur d&apos;eau mesurée : <strong>{activeSecteur.niveau_eau}</strong> · {activeSecteur.refuges} point(s) de refuge à proximité
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/citoyen/carte')}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#CC131A] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Navigation size={13} />
            <span>Itinéraire sécurisé</span>
          </button>
        </div>
      </div>
    </div>
  );
}
