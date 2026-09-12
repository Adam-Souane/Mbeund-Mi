import { CloudRain, Wind, Droplets, Calendar } from 'lucide-react';

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short' });
}

/**
 * @param {Array} previsions — PrevisionMeteo[], triées -date_prevision côté API.
 */
export default function WeatherWidget({ previsions = [] }) {
  const [current, ...upcoming] = previsions;

  return (
    <div className="rounded-xl border border-navy-50 dark:border-navy-800 bg-white dark:bg-navy p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-navy-50 dark:border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <CloudRain size={17} className="text-navy-600 dark:text-navy-200" />
          <h3 className="text-sm font-bold text-navy dark:text-navy-50">Météo — Thiaroye-sur-Mer</h3>
        </div>
      </div>

      {!current ? (
        <p className="text-xs text-navy-400 py-6 text-center">Aucune prévision météo enregistrée pour l’instant.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 my-4 items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-200">
                <CloudRain size={26} />
              </div>
              <div className="text-2xl font-extrabold text-navy dark:text-navy-50">
                {current.temperature != null ? `${current.temperature}°C` : '—'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-navy-50 dark:bg-navy-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-navy-600 dark:text-navy-200">
                <span className="flex items-center gap-1.5">
                  <Droplets size={13} />
                  Précipitations
                </span>
                <span className="font-bold text-navy dark:text-navy-50">{current.precipitation ?? '—'} mm</span>
              </div>
              <div className="flex justify-between items-center text-navy-600 dark:text-navy-200">
                <span className="flex items-center gap-1.5">
                  <Wind size={13} />
                  Vent
                </span>
                <span className="font-bold text-navy dark:text-navy-50">{current.vitesse_vent ?? '—'} km/h</span>
              </div>
            </div>
          </div>

          {upcoming.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-navy-400 mb-2 flex items-center gap-1.5">
                <Calendar size={13} />
                Prochaines prévisions
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {upcoming.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex-shrink-0 w-16 p-2 rounded-lg border border-navy-50 dark:border-navy-800 text-center"
                  >
                    <div className="text-[10px] font-medium text-navy-400 capitalize truncate">
                      {formatDay(p.date_prevision)}
                    </div>
                    <div className="text-xs font-bold text-navy dark:text-navy-50 mt-1">{p.temperature}°C</div>
                    <div className="text-[10px] text-navy-400">{p.precipitation} mm</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
