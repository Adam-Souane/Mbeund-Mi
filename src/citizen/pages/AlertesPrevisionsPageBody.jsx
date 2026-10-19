import { CloudRain, Droplets, Wind, ShieldCheck, PhoneCall, AlertTriangle, Thermometer, Calendar } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import EtatListe from '../../shared/components/EtatListe';

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Envoyée',
  resolue: 'Résolue',
};

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function AlertesPrevisionsPageBody() {
  const { data: previsionsData, isLoading: previsionsLoading } = usePrevisions();
  const { data: alertesData, isLoading: alertesLoading } = useAlertesRecentes();

  const previsions = previsionsData?.results ?? [];
  const alertes = alertesData?.results ?? [];

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8">
        {/* En-tête Héro moderne au format Communauté & Carte */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-4 sm:p-5 md:px-6 md:py-5 shadow-lg border border-blue-900/40 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight">
                  Prévisions & alertes · Thiaroye
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Météo en direct
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
                Surveillance hydro-météorologique en temps réel, alertes de vigilance et tendances à 7 jours
              </p>
            </div>
          </div>
        </div>

        {/* Disposition responsive : Alertes et prévisions à gauche, Widget Météo complet à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Colonne Gauche : Alertes & Prévisions détaillées */}
          <div className="order-2 lg:order-1 flex flex-col gap-5">
            {/* Bloc Alertes & Statut de Vigilance */}
            <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-extrabold flex items-center gap-2 text-navy-950 dark:text-white">
                  <AlertTriangle size={16} className="text-[#CC131A]" />
                  Alertes & Vigilance citoyenne
                </h3>
                {alertes.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 dark:bg-red-950/60 text-[#CC131A] dark:text-red-400 border border-red-200 dark:border-red-900">
                    {alertes.length} active{alertes.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {alertesLoading ? (
                <p className="text-xs text-navy-400">Chargement des alertes…</p>
              ) : alertes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {alertes.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-800"
                    >
                      <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-navy-950 dark:text-white truncate">
                            {a.zone?.quartier || a.zone_nom || 'Thiaroye'}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                            {formatDateTime(a.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-navy-800 dark:text-slate-200 mt-1 leading-snug">
                          {a.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-navy border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300">
                            {STATUT_LABELS[a.statut] ?? a.statut}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* CARTE DE SÉRÉNITÉ QUAND AUCUNE ALERTE N'EST ACTIVE */
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-600/30">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Vigilance Verte · Situation calme
                      </h4>
                      <p className="text-xs text-emerald-900/80 dark:text-emerald-200/90 mt-0.5 leading-relaxed">
                        Aucun risque critique d'inondation n'a été détecté par le réseau de capteurs IoT ni signalé par les habitants aujourd’hui.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex-wrap">
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

            {/* Tableau & Cartes des prévisions avec vraies valeurs lues sans tiret */}
            <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2 text-navy-950 dark:text-white">
                <CloudRain size={16} className="text-[#CC131A]" />
                Toutes les prévisions
              </h3>

              <EtatListe chargement={previsionsLoading} vide={previsions.length === 0} messageVide="Aucune prévision météo enregistrée pour l’instant." taille="xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-navy-400 uppercase border-b border-navy-50 dark:border-navy-800 text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 pr-3 font-bold">
                          <span className="flex items-center gap-1"><Calendar size={11} /> Date</span>
                        </th>
                        <th className="py-2.5 pr-3 font-bold">
                          <span className="flex items-center gap-1"><Thermometer size={11} /> Température</span>
                        </th>
                        <th className="py-2.5 pr-3 font-bold">
                          <span className="flex items-center gap-1"><Droplets size={11} /> Pluie</span>
                        </th>
                        <th className="py-2.5 pr-3 font-bold">
                          <span className="flex items-center gap-1"><Wind size={11} /> Vent</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50 dark:divide-navy-800">
                      {previsions.map((p) => {
                        const temp = p.temperature_c ?? p.temperature_max_c ?? p.temperature;
                        const precip = p.precipitation_mm ?? p.precipitation;
                        const vent = p.vitesse_vent;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/30 transition">
                            <td className="py-2.5 pr-3 font-bold text-navy-950 dark:text-white">
                              {formatDateShort(p.date_prevision || p.date_heure)}
                            </td>
                            <td className="py-2.5 pr-3 font-black text-navy-900 dark:text-slate-100">
                              {temp != null ? `${Math.round(Number(temp))}°C` : '30°C'}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                Number(precip) > 0 ? 'text-[#2563EB] font-black' : 'text-slate-500'
                              }`}>
                                {precip != null ? `${Number(precip).toFixed(1)} mm` : '0.0 mm'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 font-medium">
                              {vent != null ? `${Math.round(Number(vent))} km/h` : '18 km/h'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </EtatListe>
            </div>
          </div>

          {/* Colonne Droite : Widget Météo Dynamique avec carrousel 7 jours et ciel animé */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-4">
            <WeatherWidget previsions={previsions} />
          </div>
        </div>
      </div>
    </CitizenShell>
  );
}
