import { useState } from 'react';
import {
  Settings,
  HeartHandshake,
  Users2,
  AlertCircle,
  Phone,
  Droplet,
  Utensils,
  Mail,
  MapPin,
  Loader2,
  CheckCircle2,
  Moon,
  Sun,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { useTheme } from '../../theme/ThemeContext';
import { useZones } from '../../shared/hooks/useZones';
import { useMonProfilVulnerabilite, useSaveMonProfilVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useMonRelais, useCreateRelais, useDeleteRelais } from '../../shared/hooks/useRelaisQuartier';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { useSurvivalKit, useSaveSurvivalKit } from '../../shared/hooks/useSurvivalKit';
import { useEmergencyContact, useSaveEmergencyContact } from '../../shared/hooks/useEmergencyContact';
import { useFormulaireDepuis } from '../../shared/hooks/useFormulaireDepuis';

const PROFIL_VIDE = {
  zone: '',
  personnes_agees: 0,
  enfants_bas_age: 0,
  personne_mobilite_reduite: false,
  femme_enceinte: false,
  notes: '',
};

const KIT_VIDE = {
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
};

const CONTACT_VIDE = {
  nom: '',
  relation: 'famille',
  telephone: '',
  email: '',
  adresse: '',
  alerter_automatiquement: true,
};

export default function ParametresPageBody() {
  const { darkMode, toggleTheme } = useTheme();
  const { data: zonesData } = useZones();

  // Profil Vulnérabilité
  const { data: monProfil } = useMonProfilVulnerabilite();
  const saveProfil = useSaveMonProfilVulnerabilite();
  const [profilForm, setProfilForm] = useFormulaireDepuis(monProfil, PROFIL_VIDE);

  // Relais Quartier
  const { data: monRelais } = useMonRelais();
  const createRelais = useCreateRelais();
  const deleteRelais = useDeleteRelais();
  const [relaisZone, setRelaisZone] = useState('');

  // Kit de survie
  const { data: monSurvivalKit } = useSurvivalKit();
  const saveSurvivalKit = useSaveSurvivalKit();
  const [survivalKitForm, setSurvivalKitForm] = useFormulaireDepuis(monSurvivalKit, KIT_VIDE);

  // Contact d'urgence
  const { data: monContact } = useEmergencyContact();
  const saveEmergencyContact = useSaveEmergencyContact();
  const [contactForm, setContactForm] = useFormulaireDepuis(monContact, CONTACT_VIDE);

  // Validation errors
  const [errors, setErrors] = useState({});

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

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-6">
        {/* Bandeau d'en-tête Paramètres */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#103565] to-slate-900 text-white shadow-md border border-blue-900/40">
          <div>
            <div className="flex items-center gap-2">
              <Settings size={22} className="text-white" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Paramètres & Sécurité du foyer
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Personnes vulnérables, kit d'urgence, relais de quartier et préférences
            </p>
          </div>

          {/* Bouton Mode Sombre / Mode Clair sur le côté droit de la bande bleue */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-white/10 hover:bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 transition-colors shadow-xs">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white select-none">
              {darkMode ? (
                <>
                  <Moon size={15} className="text-amber-300" />
                  <span>Mode sombre</span>
                </>
              ) : (
                <>
                  <Sun size={15} className="text-amber-300" />
                  <span>Mode clair</span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={darkMode}
              aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer p-0.5 ${
                darkMode ? 'bg-amber-400' : 'bg-slate-400/60'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                  darkMode ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Grille principale des paramètres */}
        <div className="w-full flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
          {/* 1. Formulaire Vulnérabilité du Foyer */}
          <form
            onSubmit={handleSaveProfil}
            className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <HeartHandshake size={18} className="text-[#CC131A]" />
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Personnes vulnérables du foyer
              </h2>
            </div>
            <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
              Indiquez la présence de personnes à mobilité réduite, seniors ou enfants en bas âge afin que les secours et les relais de quartier priorisent votre foyer lors d’une montée des eaux.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold mb-1.5">Quartier de résidence</span>
                <select
                  value={profilForm.zone}
                  onChange={(e) => setProfilForm((f) => ({ ...f, zone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                >
                  <option value="">Non précisé</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.quartier}
                    </option>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold mb-1.5">Enfants en bas âge</span>
                <input
                  type="number"
                  min={0}
                  value={profilForm.enfants_bas_age}
                  onChange={(e) => setProfilForm((f) => ({ ...f, enfants_bas_age: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                />
              </label>

              <div className="flex flex-col gap-2.5 justify-center">
                <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profilForm.personne_mobilite_reduite}
                    onChange={(e) => setProfilForm((f) => ({ ...f, personne_mobilite_reduite: e.target.checked }))}
                    className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Personne à mobilité réduite</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profilForm.femme_enceinte}
                    onChange={(e) => setProfilForm((f) => ({ ...f, femme_enceinte: e.target.checked }))}
                    className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Femme enceinte</span>
                </label>
              </div>

              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold mb-1.5">Notes médicales ou consignes particulières (optionnel)</span>
                <textarea
                  rows={2}
                  value={profilForm.notes}
                  onChange={(e) => setProfilForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex : personne asthmatique, lit médicalisé au rez-de-chaussée..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm placeholder:text-navy-400 focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                />
              </label>
            </div>

            {saveProfil.isError && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
                {flattenApiErrors(saveProfil.error).map((msg, i) => (
                  <p key={i}>{msg}</p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={saveProfil.isPending}
                className="flex items-center gap-1.5 bg-[#CC131A] hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {saveProfil.isPending && <Loader2 size={14} className="animate-spin" />}
                Enregistrer les personnes vulnérables
              </button>
              {saveProfil.isSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  Enregistré avec succès
                </span>
              )}
            </div>
          </form>

          {/* 2. Relais de quartier */}
          <div className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <Users2 size={18} className="text-[#CC131A]" />
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Engagement Relais de quartier
              </h2>
            </div>
            <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
              Devenez relais bénévole pour coordonner l’alerte précoce et l’assistance dans votre quartier.
            </p>

            {monRelais ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">
                    Inscrit·e pour {zones.find((z) => z.id === monRelais.zone)?.quartier ?? 'votre quartier'}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${
                      monRelais.verifie ? 'text-emerald-600 dark:text-emerald-400' : 'text-navy-400'
                    }`}
                  >
                    {monRelais.verifie ? <CheckCircle2 size={14} /> : null}
                    {monRelais.verifie ? 'Vérifié par la mairie' : 'En attente de validation'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteRelais.mutate(monRelais.id)}
                  disabled={deleteRelais.isPending}
                  className="text-xs font-bold text-red-600 border border-red-500 rounded-xl px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-60 cursor-pointer"
                >
                  Se désinscrire
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={relaisZone}
                  onChange={(e) => setRelaisZone(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                >
                  <option value="">Choisir un quartier</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.quartier}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDevenirRelais}
                  disabled={!relaisZone || createRelais.isPending}
                  className="flex items-center gap-1.5 bg-[#0B2545] hover:bg-[#103565] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {createRelais.isPending && <Loader2 size={14} className="animate-spin" />}
                  Devenir relais de quartier
                </button>
              </div>
            )}

            {createRelais.isError && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
                {flattenApiErrors(createRelais.error).map((msg, i) => (
                  <p key={i}>{msg}</p>
                ))}
              </div>
            )}
          </div>

          {/* 3. Kit de Survie */}
          <form
            onSubmit={handleSaveSurvivalKit}
            className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={18} className="text-amber-500" />
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Kit de survie et préparation d'urgence
              </h2>
            </div>
            <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
              Préparez-vous sereinement aux crues en gardant un kit de premiers secours à portée de main.
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
                <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Droplet size={14} className="text-sky-500" />
                  Eau potable (litres)
                </span>
                <input
                  type="number"
                  min={0}
                  value={survivalKitForm.eau_potable_litres}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, eau_potable_litres: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                  placeholder="Ex: 20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Utensils size={14} className="text-amber-600" />
                  Nourriture sèche (jours)
                </span>
                <input
                  type="number"
                  min={0}
                  value={survivalKitForm.nourriture_jours}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, nourriture_jours: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                  placeholder="Ex: 3"
                />
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.medicaments}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, medicaments: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Médicaments essentiels</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.documents_importants}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, documents_importants: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Documents d’identité protégés</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.lampe_torche}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, lampe_torche: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Lampe torche ou projecteur</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.batterie_portable}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, batterie_portable: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Batterie de secours chargée</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.trousse_premiers_secours}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, trousse_premiers_secours: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Trousse de secours</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={survivalKitForm.points_refuge_identifies}
                  onChange={(e) => setSurvivalKitForm((f) => ({ ...f, points_refuge_identifies: e.target.checked }))}
                  className="accent-[#CC131A] w-4 h-4 rounded cursor-pointer"
                />
                <span>Point de refuge localisé</span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={saveSurvivalKit.isPending}
                className="flex items-center gap-1.5 bg-[#CC131A] hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {saveSurvivalKit.isPending && <Loader2 size={14} className="animate-spin" />}
                Enregistrer le kit
              </button>
              {saveSurvivalKit.isSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  Enregistré
                </span>
              )}
            </div>
          </form>

          {/* 4. Contact d'Urgence */}
          <form
            onSubmit={handleSaveContact}
            className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <Phone size={18} className="text-emerald-600" />
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Contact d’urgence à alerter
              </h2>
            </div>
            <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
              Coordonnées d’une personne de confiance à prévenir automatiquement en cas de montée des eaux.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold mb-1.5">Nom complet</span>
                <input
                  type="text"
                  value={contactForm.nom}
                  onChange={(e) => setContactForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                  placeholder="Ex: Modou Fall"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold mb-1.5">Lien de parenté / Relation</span>
                <select
                  value={contactForm.relation}
                  onChange={(e) => setContactForm((f) => ({ ...f, relation: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm font-medium focus:ring-1 focus:ring-[#CC131A] focus:outline-none"
                  placeholder="Ex: contact@exemple.sn"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                disabled={saveEmergencyContact.isPending}
                className="flex items-center gap-1.5 bg-[#CC131A] hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {saveEmergencyContact.isPending && <Loader2 size={14} className="animate-spin" />}
                Enregistrer le contact
              </button>
              {saveEmergencyContact.isSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  Enregistré
                </span>
              )}
            </div>
          </form>

        </div>
      </div>
    </CitizenShell>
  );
}
