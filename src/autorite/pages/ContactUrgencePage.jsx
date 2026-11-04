import { useState, useMemo } from 'react';
import {
  Trash2,
  PhoneCall,
  ShieldAlert,
  Send,
  Radio,
  Search,
  UserPlus,
  Users2,
  CheckCircle2,
  AlertCircle,
  X,
  PhoneForwarded,
  MapPin,
  Flame,
  Droplets,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AutoriteShell from '../desktop/AutoriteShell';
import { useZones } from '../../shared/hooks/useZones';
import {
  useContactsAlerte,
  useCreateContactAlerte,
  useDeleteContactAlerte,
} from '../../shared/hooks/useContactsAlerte';
import EtatListe from '../../shared/components/EtatListe';

const LIGNES_URGENCE_COD = [
  {
    id: 'bnsp',
    label: 'Sapeurs-Pompiers (BNSP)',
    numero: '18',
    service: 'Sauvetage, pompage & évacuations',
    icon: Flame,
  },
  {
    id: 'onas',
    label: 'ONAS Assainissement',
    numero: '800 00 11 11',
    service: 'Hydrocurage & motopompes C.O.D',
    icon: Droplets,
  },
  {
    id: 'senelec',
    label: 'SENELEC Urgence Réseau',
    numero: '33 867 66 66',
    service: 'Isolement câbles & postes inondés',
    icon: Zap,
  },
  {
    id: 'samu',
    label: 'SAMU National',
    numero: '1515',
    service: 'Secours médical d’urgence',
    icon: ShieldAlert,
  },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ContactUrgencePage() {
  const { data: zonesData } = useZones();
  const { data, isLoading } = useContactsAlerte();
  const createContact = useCreateContactAlerte();
  const deleteContact = useDeleteContactAlerte();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterStatut, setFilterStatut] = useState('ALL'); // 'ALL' | 'ACTIF' | 'INACTIF'
  const [selectedQuartier, setSelectedQuartier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newZone, setNewZone] = useState('');
  const [addFeedback, setAddFeedback] = useState(null);

  const zonesList = zonesData?.features ?? [];
  const zoneNameById = useMemo(() => {
    return new Map(zonesList.map((f) => [f.id, f.properties.quartier]));
  }, [zonesList]);

  const contacts = data?.results ?? [];

  // Statistiques KPIs
  const totalContacts = contacts.length;
  const totalActifs = contacts.filter((c) => c.actif !== false).length;
  const secteursCouverts = new Set(contacts.map((c) => c.zone).filter(Boolean)).size;

  // Filtrage
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (filterStatut === 'ACTIF' && c.actif === false) return false;
      if (filterStatut === 'INACTIF' && c.actif !== false) return false;

      if (selectedQuartier !== 'ALL') {
        const qName = zoneNameById.get(c.zone) || '';
        if (qName !== selectedQuartier) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nom = (c.nom || '').toLowerCase();
        const tel = (c.telephone || '').toLowerCase();
        const quartier = (zoneNameById.get(c.zone) || '').toLowerCase();
        if (!nom.includes(query) && !tel.includes(query) && !quartier.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, filterStatut, selectedQuartier, searchQuery, zoneNameById]);

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!newTelephone.trim()) return;

    try {
      await createContact.mutateAsync({
        telephone: newTelephone.trim(),
        nom: newNom.trim() || undefined,
        zone: newZone ? Number(newZone) : undefined,
      });
      setNewNom('');
      setNewTelephone('');
      setNewZone('');
      setAddFeedback({ type: 'success', message: 'Riverain inscrit avec succès au registre SMS !' });
      setShowAddForm(false);
      setTimeout(() => setAddFeedback(null), 4000);
    } catch {
      setAddFeedback({ type: 'error', message: "Erreur lors de l'enregistrement du contact." });
    }
  };

  return (
    <AutoriteShell>
      <div className="space-y-4">
        {/* ── 1. EN-TÊTE OPÉRATIONNEL C.O.D SOBRE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <PhoneCall size={13} className="text-[#CC131A]" />
                Poste de Commandement C.O.D · Télécommunications &amp; Alertes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Contact &amp; urgences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Lignes de crise 24/7 et gestion du registre des riverains inscrits aux alertes broadcast SMS
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Radio size={14} className="text-[#0B2545] dark:text-blue-400 animate-pulse" />
              Réseau SMS Opérationnel
            </span>
            <Link
              to="/autorite/crise"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2545] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Send size={13} />
              <span>Diffuser Alerte SMS</span>
            </Link>
          </div>
        </div>

        {/* ── 2. GRILLE DES 4 GRANDS COMPTEURS OPÉRATIONNELS (TOUCHES DE COULEUR ÉLÉGANTES) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-blue-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Contacts Inscrits</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                <Users2 size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalContacts}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">riverains au total</span>
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                Base SMS d&apos;alerte précoce
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-emerald-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Lignes Actives</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {totalActifs}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">numéros vérifiés</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Réception immédiate garantie
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-[#CC131A]/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Lignes Secours C.O.D</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#CC131A] dark:text-red-300 border border-red-200/60 dark:border-red-800/50 flex items-center justify-center shrink-0">
                <ShieldAlert size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {LIGNES_URGENCE_COD.length}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">lignes directes 24/7</span>
              </div>
              <span className="text-[10px] text-[#CC131A] dark:text-red-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CC131A] shrink-0" />
                BNSP · ONAS · SENELEC · SAMU
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[142px] border-t-2 border-t-amber-500/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Couverture Secteurs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                <MapPin size={15} />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white">
                  {secteursCouverts}
                </span>
                <span className="text-xs text-slate-500 font-bold truncate">sur {zonesList.length} quartiers</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Maillage territorial Thiaroye
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. LIGNES D'URGENCE C.O.D (SOBRES ET ÉPURÉES) ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#0B2545] dark:text-slate-200" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                Lignes d&apos;intervention Prioritaire C.O.D (24h/24)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Accès Secours Direct
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LIGNES_URGENCE_COD.map((ligne) => {
              const Icon = ligne.icon;
              return (
                <div
                  key={ligne.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-[#0B2545] dark:text-white block">
                        {ligne.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {ligne.service}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Icon size={14} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-base font-black text-[#0B2545] dark:text-white tracking-tight">
                      {ligne.numero}
                    </span>
                    <a
                      href={`tel:${ligne.numero.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#CC131A] hover:bg-red-800 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <PhoneCall size={10} />
                      Appeler
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback d'action sobre */}
        {addFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              addFeedback.type === 'success'
                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#0B2545] dark:text-slate-200'
                : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {addFeedback.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertCircle size={15} className="text-[#CC131A]" />}
            <span>{addFeedback.message}</span>
          </div>
        )}

        {/* ── 4. BARRE DE RECHERCHE, FILTRAGE & BOUTON AJOUT RIVERAIN ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            {[
              { id: 'ALL', label: `Tous (${contacts.length})` },
              { id: 'ACTIF', label: `Actifs (${totalActifs})` },
              { id: 'INACTIF', label: `Inactifs (${totalContacts - totalActifs})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatut(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterStatut === tab.id
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="inline-block h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

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

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-44 sm:w-56 shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher riverain, tel..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <UserPlus size={14} />
              <span>Inscrire un riverain</span>
            </button>
          </div>
        </div>

        {/* ── 5. FORMULAIRE DÉPLIABLE D'INSCRIPTION D'UN RIVERAIN ── */}
        {showAddForm && (
          <form
            onSubmit={handleCreateContact}
            className="p-5 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#0B2545] dark:text-slate-200" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                  Nouvelle Inscription au Registre d&apos;Alerte SMS
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Nom du chef de foyer / Riverain
                </label>
                <input
                  type="text"
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  placeholder="Ex : Ousmane Sow"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Numéro de Téléphone (SMS) *
                </label>
                <input
                  type="tel"
                  required
                  value={newTelephone}
                  onChange={(e) => setNewTelephone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Quartier / Secteur
                </label>
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545] cursor-pointer"
                >
                  <option value="">Sélectionner un secteur</option>
                  {zonesList.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.properties.quartier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createContact.isPending}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {createContact.isPending ? 'Enregistrement…' : 'Valider l’inscription ✓'}
              </button>
            </div>
          </form>
        )}

        {/* ── 6. LISTE DES CONTACTS DU REGISTRE SMS (SOBRE) ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users2 size={16} className="text-[#0B2545] dark:text-slate-200" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                Registre des Contacts SMS ({filteredContacts.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {filteredContacts.length} affiché(s) sur {contacts.length}
            </span>
          </div>

          <EtatListe
            chargement={isLoading}
            vide={filteredContacts.length === 0}
            messageVide="Aucun contact correspondant aux critères de recherche."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContacts.map((c) => {
                const quartierNom = zoneNameById.get(c.zone) ?? 'Zone générale';
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#0B2545] dark:text-white tracking-wide">
                          {c.telephone}
                        </span>
                        {c.actif !== false ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Inactif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <span className="font-bold text-[#0B2545] dark:text-slate-300">{c.nom || 'Sans nom'}</span> · {quartierNom} · Inscrit le {formatDate(c.date_inscription)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${c.telephone.replace(/\s+/g, '')}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[#CC131A] hover:bg-red-800 text-white font-bold text-[10px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        title="Appeler ce contact"
                      >
                        <PhoneCall size={11} />
                        <span className="hidden sm:inline">Appeler</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(c)}
                        disabled={deleteContact.isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#CC131A] hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Retirer ce contact du registre"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </EtatListe>
        </div>

        {/* ── 7. MODALE ACCESSIBLE DE CONFIRMATION DE SUPPRESSION ── */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl text-[#CC131A] dark:text-red-300">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0B2545] dark:text-white">Retirer du registre SMS ?</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{confirmDelete.telephone} ({confirmDelete.nom || 'Sans nom'})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Êtes-vous certain de vouloir désinscrire ce numéro ? Le riverain ne recevra plus les alertes broadcast d&apos;urgence en cas d&apos;inondation dans sa zone.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteContact.mutate(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                  disabled={deleteContact.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-[#CC131A] hover:bg-red-800 shadow-xs cursor-pointer"
                >
                  {deleteContact.isPending ? 'Suppression…' : 'Confirmer le retrait'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AutoriteShell>
  );
}
