import { memo, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle2, Droplet, Utensils } from 'lucide-react';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const SurvivalKitComponent = memo(({ survivalKitForm, setSurvivalKitForm, saveSurvivalKit, onSubmit }) => {
  const createHandler = (field) => useCallback(
    (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setSurvivalKitForm((f) => ({ ...f, [field]: field.includes('_') && !e.target.type.includes('checkbox') ? Number(value) : value }));
    },
    [setSurvivalKitForm, field]
  );

  return (
    <form onSubmit={onSubmit} className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle size={16} className="text-risk-orange" />
        <h3 className="text-sm font-bold">Kit de survie en cas d'inondation</h3>
      </div>
      <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
        Préparez-vous pour les situations d'urgence en complétant votre kit de survie.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <Droplet size={14} />
            Eau potable (litres)
          </span>
          <input
            type="number"
            min={0}
            value={survivalKitForm.eau_potable_litres}
            onChange={createHandler('eau_potable_litres')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: 20"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <Utensils size={14} />
            Nourriture (jours)
          </span>
          <input
            type="number"
            min={0}
            value={survivalKitForm.nourriture_jours}
            onChange={createHandler('nourriture_jours')}
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
            placeholder="Ex: 3"
          />
        </label>

        {['medicaments', 'documents_importants', 'lampe_torche', 'batterie_portable', 'trousse_premiers_secours', 'vetements_secours', 'points_refuge_identifies', 'voisins_contactes'].map(field => (
          <label key={field} className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={survivalKitForm[field]}
              onChange={createHandler(field)}
              className="accent-red w-4 h-4"
            />
            {field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="block text-xs font-semibold mb-1.5">Plan d'évacuation</span>
          <textarea
            rows={2}
            value={survivalKitForm.plan_evacuation}
            onChange={createHandler('plan_evacuation')}
            placeholder="Décrivez votre plan d'évacuation..."
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="block text-xs font-semibold mb-1.5">Notes supplémentaires</span>
          <textarea
            rows={2}
            value={survivalKitForm.notes}
            onChange={createHandler('notes')}
            placeholder="Ajoutez d'autres équipements ou détails..."
            className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
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
  );
});

export const SurvivalKitSection = SurvivalKitComponent;
