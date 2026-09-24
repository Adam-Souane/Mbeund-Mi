import { memo, useCallback } from 'react';
import { Phone, Loader2, CheckCircle2, Mail, MapPin } from 'lucide-react';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const EmergencyContactComponent = memo(({ contactForm, setContactForm, saveEmergencyContact, onSubmit }) => {
  const createHandler = (field) => useCallback(
    (e) => setContactForm((f) => ({ ...f, [field]: e.target.value })),
    [setContactForm, field]
  );

  const toggleAutoAlert = useCallback(
    () => setContactForm((f) => ({ ...f, alerter_automatiquement: !f.alerter_automatiquement })),
    [setContactForm]
  );

  return (
    <form onSubmit={onSubmit} className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={16} className="text-risk-vert" />
        <h3 className="text-sm font-bold">Contact d'urgence</h3>
      </div>
      <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
        Indiquez une personne de confiance à contacter en cas d'urgence.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">Nom complet</span>
          <input
            type="text"
            value={contactForm.nom}
            onChange={createHandler('nom')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: Jean Dupont"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">Relation</span>
          <select
            value={contactForm.relation}
            onChange={createHandler('relation')}
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
            onChange={createHandler('telephone')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: +221 77 123 45 67"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <Mail size={14} />
            Email (optionnel)
          </span>
          <input
            type="email"
            value={contactForm.email}
            onChange={createHandler('email')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: jean@example.com"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} />
            Adresse (optionnel)
          </span>
          <textarea
            rows={2}
            value={contactForm.adresse}
            onChange={createHandler('adresse')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: 123 Rue de la Paix, Thiès"
          />
        </label>

        <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer sm:col-span-2">
          <input
            type="checkbox"
            checked={contactForm.alerter_automatiquement}
            onChange={toggleAutoAlert}
            className="accent-red w-4 h-4"
          />
          M'alerter automatiquement si mon contact ne répond pas lors d'une évacuation
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
  );
});

export const EmergencyContactSection = EmergencyContactComponent;
