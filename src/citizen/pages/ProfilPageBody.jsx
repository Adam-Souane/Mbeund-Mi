import { useEffect, useState } from 'react';
import { Moon, LogOut, ShieldCheck, HeartHandshake, Users2, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { useZones } from '../../shared/hooks/useZones';
import { useMonProfilVulnerabilite, useSaveMonProfilVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useMonRelais, useCreateRelais, useDeleteRelais } from '../../shared/hooks/useRelaisQuartier';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

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

  const { data: monProfil } = useMonProfilVulnerabilite();
  const saveProfil = useSaveMonProfilVulnerabilite();
  const [profilForm, setProfilForm] = useState(PROFIL_VIDE);

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

  const { data: monRelais } = useMonRelais();
  const createRelais = useCreateRelais();
  const deleteRelais = useDeleteRelais();
  const [relaisZone, setRelaisZone] = useState('');
  const [copiedUsername, setCopiedUsername] = useState(false);

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
