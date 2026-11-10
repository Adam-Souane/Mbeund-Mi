import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Envoyée',
  resolue: 'Résolue',
};

const CATEGORIE_LABELS = {
  inondation: 'Inondation',
  egouts: 'Égouts / Caniveaux',
  autre: 'Obstacle pluvial',
};

const NIVEAU_EAU_CONFIG = {
  eleve: {
    label: 'Eau élevée',
    classes: 'bg-red-50 text-[#C0182A] dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900',
  },
  modere: {
    label: 'Eau modérée',
    classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  faible: {
    label: 'Ruissellement',
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  indetermine: {
    label: 'Observation terrain',
    classes: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
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

export default function AlertesPrevisionsPageBody() {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('tous'); // 'tous' | 'alertes' | 'signalements'

  const { data: previsionsData } = usePrevisions();
  const { data: alertesData, isLoading: alertesLoading } = useAlertesRecentes();
  const { data: signalementsData, isLoading: signalementsLoading } = useSignalementsApercu();

  const previsions = previsionsData?.results ?? [];
  const alertes = alertesData?.results ?? [];

  // Normalisation des signalements citoyens (FeatureCollection GeoJSON ou tableau plat)
  const signalements = useMemo(() => {
    let items = [];
    if (Array.isArray(signalementsData?.results?.features)) {
      items = signalementsData.results.features.map((f) => ({
        id: f.id,
        geometry: f.geometry,
        ...f.properties,
      }));
    } else if (Array.isArray(signalementsData?.results)) {
      items = signalementsData.results;
    } else if (Array.isArray(signalementsData?.features)) {
      items = signalementsData.features.map((f) => ({
        id: f.id,
        geometry: f.geometry,
        ...f.properties,
      }));
    } else if (Array.isArray(signalementsData)) {
      items = signalementsData;
    }
    return items;
  }, [signalementsData]);

  const totalActifs = alertes.length + signalements.length;
  const isLoading = alertesLoading || signalementsLoading;

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8">
        {/* En-tête de page moderne et aéré (compacté pour mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-navy-100 dark:border-navy-800/80">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white tracking-tight">
                Prévisions & alertes
              </h1>
              {/* Bouton d'action direct compact sur mobile */}
              <button
                type="button"
                onClick={() => navigate('/citoyen/signaler')}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#C0182A] hover:bg-[#A01020] active:scale-95 text-white shadow-xs transition shrink-0 cursor-pointer"
                title="Signaler un risque"
              >
                <PlusCircle size={14} />
                <span>Signaler</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700">
                <MapPin size={12} className="text-[#C0182A]" />
                Thiaroye-sur-Mer
              </span>
              {totalActifs > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-red-50 dark:bg-red-950/60 text-[#C0182A] dark:text-red-400 border border-red-200 dark:border-red-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C0182A] animate-ping" />
                  {totalActifs} alerte{totalActifs > 1 ? 's' : ''} active{totalActifs > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Vigilance calme
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Surveillance hydro-météorologique en direct, alertes d&apos;inondation et vigilance citoyenne.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/citoyen/signaler')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C0182A] hover:bg-[#A01020] text-white shadow-sm shadow-red-900/20 active:scale-95 transition cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Signaler un risque</span>
            </button>
          </div>
        </div>

        {/* Bloc 1 : Météo Panoramique raffinée (Hauteur divisée par 2, 7 jours intégrés harmonieusement) */}
        <section aria-label="Prévisions météorologiques">
          <WeatherWidget previsions={previsions} variant="panoramic" />
        </section>

        {/* Bloc 2 : Alertes & Vigilance citoyenne (Priorité absolue à la sécurité citoyenne) */}
        <section aria-label="Alertes et vigilance citoyenne">
          <div className="bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl p-3.5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#C0182A] dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-navy-950 dark:text-white">
                    Alertes & Vigilance citoyenne
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Signaux d&apos;alerte officiels des autorités et observations en temps réel des riverains
                  </p>
                </div>
              </div>

              {/* Onglets de filtrage rapide parfaitement adaptés sur mobile et desktop */}
              <div
                className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-900/80 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none self-start sm:self-auto w-full sm:w-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab('tous')}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-center ${
                    filterTab === 'tous'
                      ? 'bg-white dark:bg-navy text-navy-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white'
                  }`}
                >
                  Tous ({totalActifs})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('alertes')}
                  aria-label={`Alertes officielles (${alertes.length})`}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    filterTab === 'alertes'
                      ? 'bg-white dark:bg-navy text-[#C0182A] dark:text-red-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white'
                  }`}
                >
                  <Radio size={12} />
                  <span className="hidden sm:inline">Alertes officielles</span>
                  <span className="sm:hidden">Officielles</span> ({alertes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('signalements')}
                  aria-label={`Vigilance citoyenne (${signalements.length})`}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    filterTab === 'signalements'
                      ? 'bg-white dark:bg-navy text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white'
                  }`}
                >
                  <Users size={12} />
                  <span className="hidden sm:inline">Vigilance citoyenne</span>
                  <span className="sm:hidden">Citoyennes</span> ({signalements.length})
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="py-8 text-center text-xs text-navy-400 animate-pulse">
                Chargement des alertes et remontées citoyennes…
              </div>
            )}

            {!isLoading && totalActifs > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Volet 1 : Alertes officielles transmises */}
                {(filterTab === 'tous' || filterTab === 'alertes') &&
                  alertes.map((a) => (
                    <div
                      key={`alerte-${a.id}`}
                      className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/50 hover:border-red-300 transition"
                    >
                      <RiskBadge niveau={a.niveau} className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-black text-navy-950 dark:text-white truncate">
                            {a.zone?.quartier || a.zone_nom || 'Thiaroye'}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/10 text-[#C0182A] dark:text-red-400">
                              <Radio size={10} />
                              Officiel
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDateTime(a.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-navy-900 dark:text-slate-200 mt-1 leading-snug">
                          {a.message}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-navy border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200">
                            {STATUT_LABELS[a.statut] ?? a.statut}
                          </span>
                          {a.canaux && (
                            <span className="text-[10px] text-slate-400">
                              Diffusé via {a.canaux}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Volet 2 : Vigilances et remontées citoyennes */}
                {(filterTab === 'tous' || filterTab === 'signalements') &&
                  signalements.map((s) => {
                    const niveauConfig =
                      NIVEAU_EAU_CONFIG[s.niveau_eau_estime] || NIVEAU_EAU_CONFIG.indetermine;
                    const categorieLabel =
                      CATEGORIE_LABELS[s.categorie] || s.categorie || 'Signalement riverain';
                    const quartier = s.citoyen_quartier || 'Thiaroye-sur-Mer';

                    return (
                      <div
                        key={`signalement-${s.id}`}
                        className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-navy-900/40 border border-slate-200/70 dark:border-navy-800 hover:border-blue-300 dark:hover:border-navy-700 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Users size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-black text-navy-950 dark:text-white flex items-center gap-1 truncate">
                              <MapPin size={11} className="text-blue-500 shrink-0" />
                              {quartier}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${niveauConfig.classes}`}
                              >
                                {niveauConfig.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDateTime(s.date_creation)}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-navy-850 dark:text-slate-200 mt-1 leading-snug">
                            {s.description || 'Observation de vigilance transmise par un riverain de Thiaroye.'}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-navy border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300">
                                {categorieLabel}
                              </span>
                              {s.valide ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 size={11} />
                                  Vérifié sentinelle
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                  <Clock size={11} />
                                  En cours
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate('/citoyen/carte')}
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2563EB] hover:underline p-1 -mr-1 rounded-md active:scale-95 transition cursor-pointer"
                            >
                              <span>Voir sur la carte</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {filterTab === 'alertes' && alertes.length === 0 && (
                  <p className="col-span-full text-xs text-slate-500 py-6 text-center">
                    Aucune alerte officielle active pour l’instant.
                  </p>
                )}
                {filterTab === 'signalements' && signalements.length === 0 && (
                  <p className="col-span-full text-xs text-slate-500 py-6 text-center">
                    Aucun signalement riverain en attente pour l’instant.
                  </p>
                )}
              </div>
            )}

            {!isLoading && totalActifs === 0 && (
              /* CARTE DE SÉRÉNITÉ QUAND AUCUNE ALERTE NI SIGNALEMENT N'EST ACTIF */
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Vigilance Verte · Situation calme
                    </h3>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-200/90 mt-0.5 leading-relaxed">
                      Aucun risque critique d&apos;inondation n&apos;a été détecté par le réseau de capteurs IoT ni signalé par les habitants aujourd’hui.
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall size={12} className="text-emerald-600" />
                    Urgences Sapeurs-Pompiers : <strong>18</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>SAMU : <strong>15</strong></span>
                  <span className="text-slate-400">·</span>
                  <span>Mairie Thiaroye : <strong>800 00 20 20</strong></span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </CitizenShell>
  );
}
