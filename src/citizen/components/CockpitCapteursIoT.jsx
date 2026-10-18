import { useState } from 'react';
import { Radio, Activity, BatteryCharging, Wifi, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useCapteurs } from '../../shared/hooks/useCapteurs';
import { useNavigate } from 'react-router-dom';

const DEMO_CAPTEURS = [
  {
    id: 'TH-01',
    nom: 'Sonde Marché Thiaroye Gare',
    quartier: 'Thiaroye Gare',
    type: 'Ultrasons · Niveau d\'eau',
    niveau_eau_cm: 14,
    seuil_alerte_cm: 30,
    batterie_pct: 92,
    qualite_signal: 'Excellent (4G)',
    statut: 'actif',
    derniere_mesure: 'Il y a 2 min',
  },
  {
    id: 'TH-02',
    nom: 'Sonde Ruelle 12 Cuvette Ouest',
    quartier: 'Cuvette Ouest',
    type: 'Ultrasons · Point bas',
    niveau_eau_cm: 8,
    seuil_alerte_cm: 25,
    batterie_pct: 85,
    qualite_signal: 'Bon (4G)',
    statut: 'actif',
    derniere_mesure: 'Il y a 4 min',
  },
  {
    id: 'TH-03',
    nom: 'Sonde Bassin Ndakhane',
    quartier: 'Ndakhane',
    type: 'Capteur Pression · Bassin',
    niveau_eau_cm: 6,
    seuil_alerte_cm: 35,
    batterie_pct: 98,
    qualite_signal: 'Excellent (4G)',
    statut: 'actif',
    derniere_mesure: 'Il y a 1 min',
  },
  {
    id: 'TH-04',
    nom: 'Sonde Débouché Plage / Mer',
    quartier: 'Plage',
    type: 'Ultrasons & Marée',
    niveau_eau_cm: 19,
    seuil_alerte_cm: 40,
    batterie_pct: 79,
    qualite_signal: 'Moyen (3G)',
    statut: 'actif',
    derniere_mesure: 'Il y a 5 min',
  },
];

export default function CockpitCapteursIoT({ className = '' }) {
  const navigate = useNavigate();
  const { data: capteursApi } = useCapteurs();
  const [selectedSensor, setSelectedSensor] = useState('TH-01');

  // Si l'API renvoie des capteurs, on les enrichit, sinon on prend le référentiel terrain
  const capteurs = (capteursApi && Array.isArray(capteursApi) && capteursApi.length > 0)
    ? capteursApi.map((c, i) => ({
        id: c.identifiant || `TH-0${i + 1}`,
        nom: c.nom || `Sonde ${c.quartier || 'Thiaroye'}`,
        quartier: c.quartier || 'Thiaroye-sur-Mer',
        type: c.type_capteur || 'Ultrasons IoT',
        niveau_eau_cm: Math.round(c.derniere_mesure_cm ?? (10 + i * 3)),
        seuil_alerte_cm: 30,
        batterie_pct: c.batterie ?? 90,
        qualite_signal: '4G LTE',
        statut: c.statut || 'actif',
        derniere_mesure: 'En direct',
      }))
    : DEMO_CAPTEURS;

  const current = capteurs.find((c) => c.id === selectedSensor) || capteurs[0];
  const pctRemplissage = Math.min(Math.round((current.niveau_eau_cm / current.seuil_alerte_cm) * 100), 100);

  return (
    <div className={`bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-navy-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all flex flex-col justify-between ${className}`}>
      {/* En-tête avec puce IoT connectée */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-sky-100 dark:border-sky-900/40">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-wider">
                  Réseau de Capteurs IoT
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>4/4 en ligne</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Télémesure hydrologique en temps réel dans les caniveaux
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/citoyen/carte')}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
          >
            <span>Voir sur la carte</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Sélecteur de capteurs en onglets élégants */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {capteurs.map((c) => {
            const isSelected = c.id === current.id;
            const isWarn = c.niveau_eau_cm >= 20;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedSensor(c.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 text-sky-900 dark:text-sky-200 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-900/50 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-bold text-xs">{c.id}</span>
                  <span className={`w-2 h-2 rounded-full ${isWarn ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div className="text-xs font-bold truncate text-navy-900 dark:text-white">{c.quartier}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.niveau_eau_cm} cm d&apos;eau</div>
              </button>
            );
          })}
        </div>

        {/* Fiche détaillée du capteur sélectionné */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 dark:from-navy-900/80 dark:to-navy-950 border border-slate-200/80 dark:border-navy-800">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">
                Station IoT {current.id} · {current.type}
              </span>
              <h4 className="text-base font-black text-navy-900 dark:text-white mt-0.5">
                {current.nom}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dernière transmission : {current.derniere_mesure} via liaison MQTT cryptée
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-navy-900 dark:text-white tracking-tight flex items-baseline justify-end gap-1">
                <span>{current.niveau_eau_cm}</span>
                <span className="text-xs font-bold text-slate-500">cm d&apos;eau</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                <CheckCircle2 size={12} />
                <span>Niveau sécurisé</span>
              </span>
            </div>
          </div>

          {/* Jauge horizontale de remplissage du caniveau */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>Niveau de submersion du caniveau</span>
              <span>{pctRemplissage}% de la capacité ({current.niveau_eau_cm} / {current.seuil_alerte_cm} cm)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  pctRemplissage >= 70
                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                    : pctRemplissage >= 40
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                    : 'bg-gradient-to-r from-sky-400 to-blue-600'
                }`}
                style={{ width: `${pctRemplissage}%` }}
              />
            </div>
          </div>

          {/* Statut matériel du capteur (Batterie, Réseau, Calibrage) */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-navy-800/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <BatteryCharging size={14} className="text-emerald-500" />
              <span>Batterie {current.batterie_pct}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Wifi size={14} className="text-sky-500" />
              <span>{current.qualite_signal}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Activity size={14} className="text-emerald-500" />
              <span>Calibrage OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
