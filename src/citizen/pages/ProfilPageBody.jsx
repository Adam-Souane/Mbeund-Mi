import { useEffect, useState } from 'react';
import { Moon, LogOut, ShieldCheck, HeartHandshake, Users2, Loader2, CheckCircle2, Copy, Check, AlertCircle, Droplet, Utensils, Phone, Mail, MapPin, Clock, Layers } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import FormField from '../../shared/components/FormField';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useZones } from '../../shared/hooks/useZones';
import { useMonProfilVulnerabilite, useSaveMonProfilVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useMonRelais, useCreateRelais, useDeleteRelais } from '../../shared/hooks/useRelaisQuartier';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { useSurvivalKit, useSaveSurvivalKit } from '../../shared/hooks/useSurvivalKit';
import { useEmergencyContact, useSaveEmergencyContact } from '../../shared/hooks/useEmergencyContact';
import { useMySignalements } from '../../shared/hooks/useMySignalements';

const ROLE_LABELS = {
  citoyen: 'Citoyen',
  autorite: 'Autorité',
  admin: 'Administrateur',
};

const PROFIL_VIDE = {
  zone: '',
  personnes_agees: 0,
  enfants_bas_age: 0,
  personne_mobilite_reduite: false,
  femme_enceinte: false,
  notes: '',
};

export default function ProfilPageBody() {
  const { username, role, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { data: zonesData } = useZones();

  // Profil Vulnérabilité
  const { data: monProfil } = useMonProfilVulnerabilite();
  const saveProfil = useSaveMonProfilVulnerabilite();
  const [profilForm, setProfilForm] = useState(PROFIL_VIDE);

  // Relais Quartier
  const { data: monRelais } = useMonRelais();
  const createRelais = useCreateRelais();
  const deleteRelais = useDeleteRelais();
  const [relaisZone, setRelaisZone] = useState('');
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Kit de survie
  const { data: monSurvivalKit } = useSurvivalKit();
  const saveSurvivalKit = useSaveSurvivalKit();
  const [survivalKitForm, setSurvivalKitForm] = useState({
    eau_potable_litres: 0,
    nourriture_jours: 0,
    medicaments: false,
    documents_importants: false,
    lampe_torche: false,
    batterie_portable: false,
    trousse_premiers_secours: false,
    vetements_secours: false,
    plan_evacuation: '',
    points_refuge_identifies: false,
    voisins_contactes: false,
    notes: '',
  });

  // Contact d'urgence
  const { data: monContact } = useEmergencyContact();
  const saveEmergencyContact = useSaveEmergencyContact();
  const [contactForm, setContactForm] = useState({
    nom: '',
    relation: 'famille',
    telephone: '',
    email: '',
    adresse: '',
    alerter_automatiquement: true,
  });

  // Historique des signalements
  const { data: mesSignalements } = useMySignalements();

  // Validation errors
  const [errors, setErrors] = useState({});

  // Effects
  useEffect(() => {
    if (monProfil) {
      setProfilForm({
        zone: monProfil.zone ?? '',
        personnes_agees: monProfil.personnes_agees ?? 0,
        enfants_bas_age: monProfil.enfants_bas_age ?? 0,
        personne_mobilite_reduite: monProfil.personne_mobilite_reduite ?? false,
        femme_enceinte: monProfil.femme_enceinte ?? false,
        notes: monProfil.notes ?? '',
      });
    }
  }, [monProfil]);

  useEffect(() => {
    if (monSurvivalKit) {
      setSurvivalKitForm({
        eau_potable_litres: monSurvivalKit.eau_potable_litres ?? 0,
        nourriture_jours: monSurvivalKit.nourriture_jours ?? 0,
        medicaments: monSurvivalKit.medicaments ?? false,
        documents_importants: monSurvivalKit.documents_importants ?? false,
        lampe_torche: monSurvivalKit.lampe_torche ?? false,
        batterie_portable: monSurvivalKit.batterie_portable ?? false,
        trousse_premiers_secours: monSurvivalKit.trousse_premiers_secours ?? false,
        vetements_secours: monSurvivalKit.vetements_secours ?? false,
        plan_evacuation: monSurvivalKit.plan_evacuation ?? '',
        points_refuge_identifies: monSurvivalKit.points_refuge_identifies ?? false,
        voisins_contactes: monSurvivalKit.voisins_contactes ?? false,
        notes: monSurvivalKit.notes ?? '',
      });
    }
  }, [monSurvivalKit]);

  useEffect(() => {
    if (monContact) {
      setContactForm({
        nom: monContact.nom ?? '',
        relation: monContact.relation ?? 'famille',
        telephone: monContact.telephone ?? '',
        email: monContact.email ?? '',
        adresse: monContact.adresse ?? '',
        alerter_automatiquement: monContact.alerter_automatiquement ?? true,
      });
    }
  }, [monContact]);

  const copyUsername = () => {
    navigator.clipboard.writeText(username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const zones = zonesData?.features?.map((f) => ({ id: f.id, quartier: f.properties.quartier })) ?? [];

  const handleSaveProfil = (e) => {
    e.preventDefault();
    saveProfil.mutate({ ...profilForm, zone: profilForm.zone || null });
  };

  const handleDevenirRelais = () => {
    if (!relaisZone) return;
    createRelais.mutate({ zone: relaisZone });
  };

  const handleSaveSurvivalKit = (e) => {
    e.preventDefault();
    setErrors({});
    saveSurvivalKit.mutate(survivalKitForm, {
      onError: (error) => {
        const errorMessages = flattenApiErrors(error);
        setErrors({ survivalKit: errorMessages[0] });
      },
    });
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    setErrors({});
    saveEmergencyContact.mutate(contactForm, {
      onError: (error) => {
        const errorMessages = flattenApiErrors(error);
        setErrors({ contact: errorMessages[0] });
      },
    });
  };

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <CitizenShell>
      {/* Desktop : identité et préférences côte à côte sur toute la largeur
          disponible (comme la page Carte), ancrées en haut comme les autres
          pages — plus de colonne plafonnée ni de centrage vertical qui
          laissait un vide au-dessus. */}
      <div className="w-full flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-navy dark:bg-navy-800 text-white flex items-center justify-center text-xl font-extrabold flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold truncate">{username ?? 'Utilisateur'}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 dark:text-navy-200 mt-1">
                <ShieldCheck size={13} />
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>

          <div className="border-t border-navy-100 dark:border-navy-700 pt-4">
            <p className="text-xs font-semibold text-navy-600 dark:text-navy-400 mb-2">Identifiant de connexion</p>
            <div className="flex items-center gap-2 bg-navy-50 dark:bg-navy-800 px-3 py-2.5 rounded-lg">
              <code className="text-sm font-mono font-semibold text-navy dark:text-white flex-1">{username}</code>
              <button
                type="button"
                onClick={copyUsername}
                className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition flex-shrink-0"
                title="Copier l'identifiant"
              >
                {copiedUsername ? <Check size={16} className="text-risk-vert" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase text-navy-400 mb-3">Préférences</h3>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <Moon size={16} />
              Mode sombre
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={darkMode}
              aria-label="Activer le mode sombre"
              className={`w-11 h-6 rounded-pill transition-colors flex-shrink-0 ${darkMode ? 'bg-navy dark:bg-navy-50' : 'bg-navy-200'}`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow transform transition-transform ${
                  darkMode ? 'translate-x-5 bg-white dark:bg-navy' : 'translate-x-0.5 bg-white'
                }`}
              />
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfil} className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake size={16} className="text-red" />
            <h3 className="text-sm font-bold">Vulnérabilité du foyer</h3>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
            Facultatif — aide l’autorité et les relais de quartier à prioriser l’assistance à l’évacuation en cas d’alerte.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Quartier</span>
              <select
                value={profilForm.zone}
                onChange={(e) => setProfilForm((f) => ({ ...f, zone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
              >
                <option value="">Non précisé</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.quartier}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Personnes âgées dans le foyer</span>
              <input
                type="number"
                min={0}
                value={profilForm.personnes_agees}
                onChange={(e) => setProfilForm((f) => ({ ...f, personnes_agees: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Enfants en bas âge</span>
              <input
                type="number"
                min={0}
                value={profilForm.enfants_bas_age}
                onChange={(e) => setProfilForm((f) => ({ ...f, enfants_bas_age: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
              />
            </label>

            <div className="flex flex-col gap-2.5 justify-center">
              <label className="flex items-center gap-2.5 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={profilForm.personne_mobilite_reduite}
                  onChange={(e) => setProfilForm((f) => ({ ...f, personne_mobilite_reduite: e.target.checked }))}
                  className="accent-red w-4 h-4"
                />
                Personne à mobilité réduite
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={profilForm.femme_enceinte}
                  onChange={(e) => setProfilForm((f) => ({ ...f, femme_enceinte: e.target.checked }))}
                  className="accent-red w-4 h-4"
                />
                Femme enceinte
              </label>
            </div>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold mb-1.5">Notes (optionnel)</span>
              <textarea
                rows={2}
                value={profilForm.notes}
                onChange={(e) => setProfilForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex : traitement médical nécessitant une prise quotidienne."
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400"
              />
            </label>
          </div>

          {saveProfil.isError && (
            <div className="mt-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
              {flattenApiErrors(saveProfil.error).map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={saveProfil.isPending}
              className="flex items-center gap-1.5 bg-red text-white font-bold text-sm px-5 py-2.5 rounded-md disabled:opacity-60"
            >
              {saveProfil.isPending && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
            {saveProfil.isSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-risk-vert">
                <CheckCircle2 size={14} />
                Enregistré
              </span>
            )}
          </div>
        </form>

        <div className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users2 size={16} className="text-red" />
            <h3 className="text-sm font-bold">Relais de quartier</h3>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
            Devenez volontaire pour être notifié en priorité lors d’une alerte et aider les foyers vulnérables à évacuer.
          </p>

          {monRelais ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold">
                  Inscrit·e pour {zones.find((z) => z.id === monRelais.zone)?.quartier ?? 'votre quartier'}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${
                    monRelais.verifie ? 'text-risk-vert' : 'text-navy-400'
                  }`}
                >
                  {monRelais.verifie ? <CheckCircle2 size={13} /> : null}
                  {monRelais.verifie ? 'Vérifié par une autorité' : 'En attente de vérification'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteRelais.mutate(monRelais.id)}
                disabled={deleteRelais.isPending}
                className="text-xs font-bold text-red border-[1.5px] border-red rounded-md px-3.5 py-2 disabled:opacity-60"
              >
                Se désinscrire
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={relaisZone}
                onChange={(e) => setRelaisZone(e.target.value)}
                className="px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
              >
                <option value="">Choisir un quartier</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.quartier}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDevenirRelais}
                disabled={!relaisZone || createRelais.isPending}
                className="flex items-center gap-1.5 bg-navy dark:bg-navy-800 text-white font-bold text-sm px-4 py-2.5 rounded-md disabled:opacity-60"
              >
                {createRelais.isPending && <Loader2 size={14} className="animate-spin" />}
                Devenir relais de quartier
              </button>
            </div>
          )}

          {createRelais.isError && (
            <div className="mt-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
              {flattenApiErrors(createRelais.error).map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}
        </div>

        {/* Kit de Survie */}
        <form onSubmit={handleSaveSurvivalKit} className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-risk-orange" />
            <h3 className="text-sm font-bold">Kit de survie en cas d'inondation</h3>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
            Préparez-vous pour les situations d'urgence en complétant votre kit de survie.
          </p>

          {errors.survivalKit && (
            <ErrorMessage
              error={errors.survivalKit}
              title="Erreur lors de la sauvegarde"
              suggestion="Vérifiez les données et réessayez"
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" id="eau-label">
                <Droplet size={14} aria-hidden="true" />
                Eau potable (litres)
              </span>
              <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1" id="eau-desc">
                Quantité d'eau potable actuellement stockée
              </span>
              <input
                type="number"
                min={0}
                value={survivalKitForm.eau_potable_litres}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, eau_potable_litres: Number(e.target.value) }))}
                aria-labelledby="eau-label"
                aria-describedby="eau-desc"
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm focus:ring-2 focus:ring-red focus:ring-inset"
                placeholder="Ex: 20"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" id="nourriture-label">
                <Utensils size={14} aria-hidden="true" />
                Nourriture (jours)
              </span>
              <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1" id="nourriture-desc">
                Nombre de jours de nourriture non-périssable disponible
              </span>
              <input
                type="number"
                min={0}
                value={survivalKitForm.nourriture_jours}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, nourriture_jours: Number(e.target.value) }))}
                aria-labelledby="nourriture-label"
                aria-describedby="nourriture-desc"
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm focus:ring-2 focus:ring-red focus:ring-inset"
                placeholder="Ex: 3"
              />
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.medicaments}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, medicaments: e.target.checked }))}
                aria-label="Médicaments essentiels disponibles"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Médicaments essentiels
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.documents_importants}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, documents_importants: e.target.checked }))}
                aria-label="Documents importants préparés"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Documents importants
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.lampe_torche}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, lampe_torche: e.target.checked }))}
                aria-label="Lampe torche disponible"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Lampe torche
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.batterie_portable}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, batterie_portable: e.target.checked }))}
                aria-label="Batterie portable chargée"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Batterie portable
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.trousse_premiers_secours}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, trousse_premiers_secours: e.target.checked }))}
                aria-label="Trousse de premiers secours préparée"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Trousse de premiers secours
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.vetements_secours}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, vetements_secours: e.target.checked }))}
                aria-label="Vêtements de secours disponibles"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Vêtements de secours
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.points_refuge_identifies}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, points_refuge_identifies: e.target.checked }))}
                aria-label="Points de refuge identifiés"
                className="accent-red w-4 h-4 focus:ring-2 focus:ring-red"
              />
              Points de refuge identifiés
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={survivalKitForm.voisins_contactes}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, voisins_contactes: e.target.checked }))}
                className="accent-red w-4 h-4"
              />
              Voisins contactés
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold mb-1.5">Plan d'évacuation</span>
              <textarea
                rows={2}
                value={survivalKitForm.plan_evacuation}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, plan_evacuation: e.target.value }))}
                placeholder="Décrivez votre plan d'évacuation..."
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold mb-1.5">Notes supplémentaires</span>
              <textarea
                rows={2}
                value={survivalKitForm.notes}
                onChange={(e) => setSurvivalKitForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ajoutez d'autres équipements ou détails..."
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400"
              />
            </label>
          </div>

          {saveSurvivalKit.isError && (
            <div className="mt-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
              {flattenApiErrors(saveSurvivalKit.error).map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={saveSurvivalKit.isPending}
              className="flex items-center gap-1.5 bg-red text-white font-bold text-sm px-5 py-2.5 rounded-md disabled:opacity-60"
            >
              {saveSurvivalKit.isPending && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
            {saveSurvivalKit.isSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-risk-vert">
                <CheckCircle2 size={14} />
                Enregistré
              </span>
            )}
          </div>
        </form>

        {/* Contact d'Urgence */}
        <form onSubmit={handleSaveContact} className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={16} className="text-risk-vert" />
            <h3 className="text-sm font-bold">Contact d'urgence</h3>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
            Indiquez une personne de confiance à contacter en cas d'urgence.
          </p>

          {errors.contact && (
            <ErrorMessage
              error={errors.contact}
              title="Erreur lors de la sauvegarde"
              suggestion="Vérifiez les données et réessayez"
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Nom complet</span>
              <input
                type="text"
                value={contactForm.nom}
                onChange={(e) => setContactForm((f) => ({ ...f, nom: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
                placeholder="Ex: Jean Dupont"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Relation</span>
              <select
                value={contactForm.relation}
                onChange={(e) => setContactForm((f) => ({ ...f, relation: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
              >
                <option value="famille">Famille</option>
                <option value="ami">Ami</option>
                <option value="voisin">Voisin</option>
                <option value="medecin">Médecin</option>
                <option value="autre">Autre</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <Phone size={14} />
                Téléphone
              </span>
              <input
                type="tel"
                value={contactForm.telephone}
                onChange={(e) => setContactForm((f) => ({ ...f, telephone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
                placeholder="Ex: +221 77 123 45 67"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <Mail size={14} />
                Email
              </span>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
                placeholder="Ex: jean@example.com"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} />
                Adresse
              </span>
              <textarea
                rows={2}
                value={contactForm.adresse}
                onChange={(e) => setContactForm((f) => ({ ...f, adresse: e.target.value }))}
                placeholder="Adresse complète du contact..."
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400"
              />
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                checked={contactForm.alerter_automatiquement}
                onChange={(e) => setContactForm((f) => ({ ...f, alerter_automatiquement: e.target.checked }))}
                className="accent-red w-4 h-4"
              />
              M'alerter automatiquement en cas d'urgence
            </label>
          </div>

          {saveEmergencyContact.isError && (
            <div className="mt-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
              {flattenApiErrors(saveEmergencyContact.error).map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={saveEmergencyContact.isPending}
              className="flex items-center gap-1.5 bg-red text-white font-bold text-sm px-5 py-2.5 rounded-md disabled:opacity-60"
            >
              {saveEmergencyContact.isPending && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
            {saveEmergencyContact.isSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-risk-vert">
                <CheckCircle2 size={14} />
                Enregistré
              </span>
            )}
          </div>
        </form>

        {/* Historique des Signalements */}
        <div className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={16} className="text-risk-jaune" />
            <h3 className="text-sm font-bold">Historique de mes signalements</h3>
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
            Consulter tous vos signalements passés.
          </p>

          {mesSignalements?.results && mesSignalements.results.length > 0 ? (
            <div className="space-y-3">
              {mesSignalements.results.map((signalement) => (
                <div key={signalement.id} className="border-l-4 border-risk-jaune pl-4 py-3 bg-navy-50 dark:bg-navy-900 rounded-md">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold">{signalement.description}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${
                        signalement.valide ? 'text-risk-vert' : 'text-navy-500'
                      }`}>
                        {signalement.valide ? '✓ Validé' : '⏳ En attente'}
                      </span>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      signalement.categorie_display === 'Inondation' ? 'bg-risk-bleu/20 text-risk-bleu' :
                      signalement.categorie_display === 'Dégâts' ? 'bg-red/20 text-red' :
                      'bg-navy-200 text-navy-600'
                    }`}>
                      {signalement.categorie_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-navy-600 dark:text-navy-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(signalement.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Droplet size={12} />
                      Niveau: {signalement.niveau_eau_display}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-600 dark:text-navy-400 py-6 text-center">
              Vous n'avez pas encore fait de signalements.
            </p>
          )}
        </div>

        <button
          onClick={logout}
          className="lg:col-span-2 flex items-center justify-center gap-2 text-sm font-bold text-red border-[1.5px] border-red rounded-md px-4 py-3"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </CitizenShell>
  );
}
