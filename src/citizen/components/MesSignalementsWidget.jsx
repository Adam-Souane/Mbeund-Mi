import { Link } from 'react-router-dom';
import { Camera, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useMySignalements } from '../../shared/hooks/useMySignalements';
import { useAuth } from '../../auth/AuthContext';

export default function MesSignalementsWidget() {
  const { user } = useAuth();
  const { data, isLoading } = useMySignalements();

  // Liste des signalements du citoyen (format paginé Django { results: [...] } ou array direct)
  const signalements = data?.results ?? (Array.isArray(data) ? data : []);
  const recents = signalements.slice(0, 3);

  return (
    <div className="bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red/15 text-red flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-navy-50">Mes signalements</h3>
            <span className="text-[11px] text-navy-400">Suivi direct de vos alertes</span>
          </div>
        </div>

        <Link
          to="/citoyen/signaler"
          className="text-xs font-bold text-red hover:text-red-700 flex items-center gap-0.5"
        >
          Nouveau <ChevronRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-navy-400 animate-pulse">
          Chargement de vos signalements…
        </div>
      ) : recents.length === 0 ? (
        <div className="py-5 px-4 text-center rounded-xl bg-navy-50/50 dark:bg-navy-900/40 border border-dashed border-navy-200 dark:border-navy-800">
          <p className="text-xs text-navy-600 dark:text-navy-300 font-medium mb-2">
            Vous n'avez pas encore envoyé de signalement.
          </p>
          <Link
            to="/citoyen/signaler"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red text-white text-xs font-bold hover:bg-red-700 transition"
          >
            <Camera size={13} />
            Signaler une inondation
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recents.map((sig) => {
            const dateStr = sig.date_creation
              ? new Date(sig.date_creation).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Récemment';

            return (
              <div
                key={sig.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-navy-50/50 dark:bg-navy-900/30 border border-navy-100 dark:border-navy-800/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-navy-900 dark:text-navy-50 capitalize">
                      {sig.categorie_display || sig.categorie || 'Inondation'}
                    </span>
                    {sig.niveau_eau_display && sig.niveau_eau_display !== 'Indéterminé' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">
                        Eau : {sig.niveau_eau_display}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-1">
                    {sig.description || 'Signalement transmis par vos soins.'}
                  </p>
                  <span className="text-[10px] text-navy-400 mt-1 block">{dateStr}</span>
                </div>

                {/* Badge de statut */}
                <div className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold">
                  {sig.valide ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} />
                      Validé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full">
                      <Clock size={12} />
                      En examen
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
