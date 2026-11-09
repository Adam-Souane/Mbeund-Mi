import { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Users2,
  CheckCircle2,
  ShieldQuestion,
  AlertCircle,
  X,
  Baby,
  Accessibility,
  Radio,
  Send,
  Search,
  MapPin,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AutoriteShell from '../desktop/AutoriteShell';
import { useZones } from '../../shared/hooks/useZones';
import { useProfilsVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useRelaisQuartierListe, useVerifierRelais } from '../../shared/hooks/useRelaisQuartier';
import EtatListe from '../../shared/components/EtatListe';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RegistreCommunautairePage() {
  const [confirmUnverify, setConfirmUnverify] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ORSEC' | 'PMR'
  const [selectedQuartier, setSelectedQuartier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: zonesData } = useZones();
  const { data: profilsData, isLoading: profilsLoading } = useProfilsVulnerabilite();
  const { data: relaisData, isLoading: relaisLoading } = useRelaisQuartierListe();
  const verifierRelais = useVerifierRelais();

  const zonesList = zonesData?.features ?? [];
  const zoneNameById = useMemo(() => {
    return new Map(zonesList.map((f) => [f.id, f.properties.quartier]));
  }, [zonesList]);

  const profils = profilsData?.results ?? [];
  const relais = relaisData?.results ?? [];

  // Statistiques de vulnérabilité
  const totalPMR = profils.filter((p) => p.personne_mobilite_reduite).length;
  const totalEnfants = profils.reduce((sum, p) => sum + (p.enfants_bas_age || 0), 0);
  const totalAines = profils.reduce((sum, p) => sum + (p.personnes_agees || 0), 0);
  const totalRelaisAccredites = relais.filter((r) => r.verifie).length;

  // Filtrage des profils de vulnérabilité
  const filteredProfils = useMemo(() => {
    return profils.filter((p) => {
      if (filterType === 'ORSEC' && !p.est_prioritaire) return false;
      if (filterType === 'PMR' && !p.personne_mobilite_reduite) return false;

      if (selectedQuartier !== 'ALL') {
        const qName = zoneNameById.get(p.zone) || '';
        if (qName !== selectedQuartier) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const username = (p.username || '').toLowerCase();
        const quartier = (zoneNameById.get(p.zone) || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        if (!username.includes(query) && !quartier.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [profils, filterType, selectedQuartier, searchQuery, zoneNameById]);

  // Filtrage des relais de quartier
  const filteredRelais = useMemo(() => {
    return relais.filter((r) => {
      if (selectedQuartier !== 'ALL') {
        const qName = zoneNameById.get(r.zone) || '';
        if (qName !== selectedQuartier) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const username = (r.username || '').toLowerCase();
        const quartier = (zoneNameById.get(r.zone) || '').toLowerCase();
        if (!username.includes(query) && !quartier.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [relais, selectedQuartier, searchQuery, zoneNameById]);

  const filterTabs = [
    { id: 'ALL', label: `Tous les foyers (${profils.length})` },
    { id: 'ORSEC', label: `Prioritaires ORSEC (${profils.filter((p) => p.est_prioritaire).length})` },
    { id: 'PMR', label: `Mobilité réduite (${totalPMR})` },
  ];

  return (
    <AutoriteShell>
      <div className="space-y-4">
        {/* ── 1. EN-TÊTE DU POSTE DE COMMANDEMENT C.O.D ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <Users2 size={13} className="text-[#CC131A]" />
                Cellule C.O.D · Protection des Populations &amp; Secours
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Registre communautaire
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Recensement des foyers vulnérables et maillage des relais de quartier pour l&apos;évacuation prioritaire
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Radio size={14} className="text-emerald-600 animate-pulse" />
              Secours aux Personnes
            </span>
            <Link
              to="/autorite/crise"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CC131A] hover:bg-red-800 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Send size={13} />
              <span>Alerter les Quartiers</span>
            </Link>
          </div>
        </div>

        {/* ── 2. GRILLE DES 4 GRANDS COMPTEURS OPÉRATIONNELS (CHARTE MBEUND-MI) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-[#CC131A]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Mobilité Réduite</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#CC131A] dark:text-red-300 border border-red-200/60 dark:border-red-800/50 flex items-center justify-center shrink-0">
                <Accessibility size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalPMR}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">foyers prioritaires</span>
              </div>
              <span className="text-[10px] text-[#CC131A] dark:text-red-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CC131A] shrink-0" />
                Évacuation prioritaire
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-blue-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Enfants en bas âge</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                <Baby size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalEnfants}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">nourrissons &amp; enfants</span>
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                Pédiatrie d&apos;urgence &amp; Refuges
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-amber-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Personnes Âgées</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                <HeartHandshake size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalAines}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">seniors recensés</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Prise en charge avec les relais
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-emerald-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Relais Sentinelles</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                <UserCheck size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalRelaisAccredites}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">sur {relais.length} accrédités</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Chefs de zone opérationnels
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. BARRE DE FILTRAGE & RECHERCHE SUR UNE LIGNE CONTINUE ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === tab.id
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="inline-block h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

            {/* Sélecteur de Quartier */}
            <select
              value={selectedQuartier}
              onChange={(e) => setSelectedQuartier(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none shrink-0 cursor-pointer"
            >
              <option value="ALL">Tous les secteurs</option>
              {zonesList.map((z) => (
                <option key={z.id} value={z.properties.quartier}>
                  {z.properties.quartier}
                </option>
              ))}
            </select>
          </div>

          {/* Recherche */}
          <div className="relative w-48 sm:w-60 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher foyer, relais..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
            />
          </div>
        </div>

        {/* ── 4. GRILLE MASTER EN 2 COLONNES : PROFILS VULNÉRABLES & RELAIS SENTINELLES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne 1 : Profils de vulnérabilité (6 col.) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <HeartHandshake size={16} className="text-[#CC131A]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    Profils de vulnérabilité · {filteredProfils.length}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Déclarations Citoyennes
                </span>
              </div>

              <EtatListe chargement={profilsLoading} vide={filteredProfils.length === 0} messageVide="Aucun profil correspondant aux critères.">
                <div className="space-y-3">
                  {filteredProfils.map((p) => {
                    const quartierNom = zoneNameById.get(p.zone) ?? 'Quartier non précisé';
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-[#0B2545] dark:text-white">{p.username}</span>
                          {p.est_prioritaire ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 dark:bg-red-950/80 text-[#CC131A] dark:text-red-300 border border-red-200 dark:border-red-800/80 animate-pulse">
                              Prioritaire ORSEC
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Vigilance Standard
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={12} className="text-[#CC131A]" />
                            {quartierNom}
                          </span>
                          <Link
                            to="/autorite/carte"
                            className="text-[11px] font-bold text-[#0B2545] dark:text-slate-300 hover:underline flex items-center gap-1"
                          >
                            <span>Localiser SIG</span>
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.personne_mobilite_reduite && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/80 text-[#CC131A] dark:text-red-300 border border-red-200/60 dark:border-red-800">
                              <Accessibility size={12} />
                              Mobilité réduite
                            </span>
                          )}
                          {p.enfants_bas_age > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200">
                              <Baby size={12} />
                              {p.enfants_bas_age} bébé(s)/enfant(s)
                            </span>
                          )}
                          {p.personnes_agees > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              {p.personnes_agees} senior(s)
                            </span>
                          )}
                          {p.femme_enceinte && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200">
                              Femme enceinte
                            </span>
                          )}
                        </div>

                        {p.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 italic">
                            &quot;{p.notes}&quot;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </EtatListe>
            </div>
          </div>

          {/* Colonne 2 : Relais de quartier sentinelles (6 col.) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users2 size={16} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    Relais de quartier · {filteredRelais.length}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Sentinelles de Quartier
                </span>
              </div>

              <EtatListe chargement={relaisLoading} vide={filteredRelais.length === 0} messageVide="Aucun relais inscrit pour l’instant.">
                <div className="space-y-3">
                  {filteredRelais.map((r) => {
                    const quartierNom = zoneNameById.get(r.zone) ?? 'Zone générale';
                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#0B2545] dark:text-white">{r.username}</span>
                            {r.verifie ? (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 size={11} />
                                Accrédité
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                <ShieldQuestion size={11} />
                                En attente
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {quartierNom} · Inscrit le {formatDate(r.date_inscription)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (r.verifie) {
                              setConfirmUnverify(r);
                            } else {
                              verifierRelais.mutate({ id: r.id, verifie: true });
                            }
                          }}
                          disabled={verifierRelais.isPending}
                          className={`text-xs font-black rounded-xl px-4 py-2 disabled:opacity-60 flex-shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs ${
                            r.verifie
                              ? 'bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {r.verifie ? 'Retirer vérification' : 'Accréditer ✓'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </EtatListe>
            </div>
          </div>
        </div>

        {/* ── 5. MODALE ACCESSIBLE DE CONFIRMATION DU RETRAIT ── */}
        {confirmUnverify && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-300">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0B2545] dark:text-white">Retirer l&apos;accréditation ?</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{confirmUnverify.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmUnverify(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Êtes-vous sûr de vouloir retirer l’accréditation de ce relais de quartier ? Ce contact ne figurera plus comme référent d’urgence prioritaire pour les secours.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmUnverify(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    verifierRelais.mutate({ id: confirmUnverify.id, verifie: false });
                    setConfirmUnverify(null);
                  }}
                  disabled={verifierRelais.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-[#CC131A] hover:bg-red-800 shadow-xs cursor-pointer"
                >
                  {verifierRelais.isPending ? 'Mise à jour…' : 'Confirmer le retrait'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AutoriteShell>
  );
}
