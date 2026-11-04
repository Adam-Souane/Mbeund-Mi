import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudRain,
  Droplets,
  Wind,
  Send,
  MapPin,
  Calendar,
  AlertTriangle,
  Compass,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import BarometreIAPredictive from '../components/BarometreIAPredictive';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import EtatListe from '../../shared/components/EtatListe';

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Diffusée',
  resolue: 'Résolue',
};

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PrevisionsAlertesPage() {
  const { data: previsionsData, isLoading: previsionsLoading } = usePrevisions();
  const { data: alertesData, isLoading: alertesLoading } = useAlertesRecentes();

  const [timeRange, setTimeRange] = useState('24h'); // '24h' | '48h' | 'ALL'

  const previsions = previsionsData?.results ?? [];
  const alertes = alertesData?.results ?? [];

  // Filtrage temporel du tableau des prévisions
  const filteredPrevisions = useMemo(() => {
    if (!previsions.length) return [];
    if (timeRange === '24h') {
      return previsions.slice(0, 8); // ~8 tranches de 3h ou 24 premières heures
    }
    if (timeRange === '48h') {
      return previsions.slice(0, 16);
    }
    return previsions;
  }, [previsions, timeRange]);

  return (
    <AutoriteShell>
      <div className="space-y-5">
        {/* ── 1. EN-TÊTE ÉPURÉ DE LA PAGE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <CloudRain size={13} className="text-[#CC131A]" />
                Poste Météorologique C.O.D · Thiaroye-sur-Mer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Prévisions &amp; alertes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Surveillance hydro-météorologique, cumul des précipitations et vigilance territoriale
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Radio size={14} className="text-blue-600 animate-pulse" />
              Radar Actif
            </span>
            <Link
              to="/autorite/crise"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CC131A] hover:bg-red-800 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Send size={13} />
              <span>Diffuser Alerte</span>
            </Link>
          </div>
        </div>

        {/* ── 2. WIDGET MÉTÉO (CONSERVÉ STRICTEMENT TEL QUEL) ── */}
        <WeatherWidget previsions={previsions} />

        {/* ── 3. BAROMÈTRE IA PRÉDICTIF D'INONDATION ── */}
        <BarometreIAPredictive previsions={previsions} />

        {/* ── 4. GRILLE MASTER EN 2 COLONNES PARFAITEMENT ALIGNÉES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne Gauche (6 cols) : Tableau des Prévisions détaillées */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CloudRain size={16} className="text-[#0B2545] dark:text-slate-200" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Relevés &amp; Prévisions Détaillées
                    </h3>
                  </div>

                  {/* Sélecteur de plage temporelle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg shrink-0">
                    {[
                      { id: '24h', label: '24h' },
                      { id: '48h', label: '48h' },
                      { id: 'ALL', label: '7 jours' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTimeRange(tab.id)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md transition cursor-pointer ${
                          timeRange === tab.id
                            ? 'bg-white dark:bg-[#071322] text-[#0B2545] dark:text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <EtatListe
                  chargement={previsionsLoading}
                  vide={filteredPrevisions.length === 0}
                  messageVide="Aucune prévision météo enregistrée pour l’instant."
                >
                  <div className="overflow-x-auto max-h-[380px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#071322] z-10">
                        <tr>
                          <th className="py-2.5 pr-2">Date &amp; Heure</th>
                          <th className="py-2.5 px-2">Temp.</th>
                          <th className="py-2.5 px-2">
                            <Droplets size={11} className="inline mr-1 text-blue-500" />
                            Pluie
                          </th>
                          <th className="py-2.5 pl-2 text-right">
                            <Wind size={11} className="inline mr-1 text-slate-400" />
                            Vent
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {filteredPrevisions.map((p) => {
                          const temp = p.temperature_c ?? p.temperature_max_c ?? p.temperature;
                          const prec = p.precipitation_mm ?? p.precipitation;
                          const vent = p.vitesse_vent ?? p.vitesse_vent_kmh;
                          const isHeavyRain = prec != null && Number(prec) >= 10;
                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition ${
                                isHeavyRain ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                              }`}
                            >
                              <td className="py-2.5 pr-2 font-bold text-[#0B2545] dark:text-white whitespace-nowrap">
                                {formatDateTime(p.date_prevision)}
                              </td>
                              <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                                {temp != null ? `${temp}°C` : '—'}
                              </td>
                              <td className="py-2.5 px-2">
                                {prec != null ? (
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold ${
                                      isHeavyRain
                                        ? 'text-[#CC131A] dark:text-red-400 font-black'
                                        : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {Number(prec).toFixed(1)} mm
                                    {isHeavyRain && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-red-100 dark:bg-red-950 text-[#CC131A] uppercase font-black">
                                        Critique
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 pl-2 text-right text-slate-600 dark:text-slate-300">
                                {vent != null ? `${vent} km/h` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </EtatListe>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Station Météo Thiaroye C.O.D</span>
                <span className="font-bold text-[#0B2545] dark:text-slate-300">{filteredPrevisions.length} relevés</span>
              </div>
            </div>
          </div>

          {/* Colonne Droite (6 cols) : Journal des Alertes Territoriales */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#CC131A]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Journal des Alertes Territoriales ({alertes.length})
                    </h3>
                  </div>
                  <Link
                    to="/autorite/crise"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#CC131A] hover:bg-red-800 text-white font-bold text-[10px] transition shadow-2xs"
                  >
                    <span>Émettre une Alerte</span>
                  </Link>
                </div>

                <EtatListe
                  chargement={alertesLoading}
                  vide={alertes.length === 0}
                  messageVide="Aucune alerte émise pour l’instant."
                >
                  <div className="space-y-3 max-h-[380px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {alertes.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <RiskBadge niveau={a.niveau} />
                            <span className="text-xs font-black text-[#0B2545] dark:text-white">
                              {a.zone?.quartier || 'Thiaroye (Général)'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">
                            {formatDateTime(a.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {a.message}
                        </p>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {STATUT_LABELS[a.statut] ?? a.statut}
                          </span>

                          <Link
                            to="/autorite/carte"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B2545] dark:text-slate-300 hover:text-[#CC131A] transition"
                          >
                            <Compass size={11} />
                            <span>Voir sur Carte SIG</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </EtatListe>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Diffusion Broadcast C.O.D</span>
                <span className="font-bold text-[#0B2545] dark:text-slate-300">Synchronisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}
