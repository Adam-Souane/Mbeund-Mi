import { useState } from 'react';
import { HeartHandshake, Users2, CheckCircle2, ShieldQuestion, AlertCircle, X } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { useZones } from '../../shared/hooks/useZones';
import { useProfilsVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useRelaisQuartierListe, useVerifierRelais } from '../../shared/hooks/useRelaisQuartier';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RegistreCommunautairePage() {
  const { darkMode } = useTheme();
  const [confirmUnverify, setConfirmUnverify] = useState(null);
  const { data: zonesData } = useZones();
  const { data: profilsData, isLoading: profilsLoading } = useProfilsVulnerabilite();
  const { data: relaisData, isLoading: relaisLoading } = useRelaisQuartierListe();
  const verifierRelais = useVerifierRelais();

  const zoneNameById = new Map((zonesData?.features ?? []).map((f) => [f.id, f.properties.quartier]));
  const profils = profilsData?.results ?? [];
  const relais = relaisData?.results ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Registre communautaire</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Foyers vulnérables déclarés et relais de quartier — pour prioriser l’assistance à l’évacuation.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-2">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <HeartHandshake size={16} className="text-red" />
            Profils de vulnérabilité · {profilsData?.count ?? 0}
          </h3>
          {profilsLoading ? (
            <p className="text-sm text-navy-400">Chargement…</p>
          ) : profils.length === 0 ? (
            <p className="text-sm text-navy-400">Aucun profil déclaré pour l’instant.</p>
          ) : (
            profils.map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 border border-navy-50 dark:border-navy-800 rounded-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{p.username}</span>
                    {p.est_prioritaire && (
                      <span className="text-[11px] font-bold uppercase text-red">Prioritaire</span>
                    )}
                  </div>
                  <p className="text-sm text-navy-400 mt-0.5">
                    {zoneNameById.get(p.zone) ?? 'Quartier non précisé'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-sm text-navy-600 dark:text-navy-200">
                    {p.personnes_agees > 0 && <span>{p.personnes_agees} personne(s) âgée(s)</span>}
                    {p.enfants_bas_age > 0 && <span>{p.enfants_bas_age} enfant(s) en bas âge</span>}
                    {p.personne_mobilite_reduite && <span>Mobilité réduite</span>}
                    {p.femme_enceinte && <span>Femme enceinte</span>}
                  </div>
                  {p.notes && <p className="text-sm text-navy-600 dark:text-navy-200 mt-1.5">{p.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-2">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Users2 size={16} className="text-red" />
            Relais de quartier · {relaisData?.count ?? 0}
          </h3>
          {relaisLoading ? (
            <p className="text-sm text-navy-400">Chargement…</p>
          ) : relais.length === 0 ? (
            <p className="text-sm text-navy-400">Aucun relais inscrit pour l’instant.</p>
          ) : (
            relais.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 border border-navy-50 dark:border-navy-800 rounded-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{r.username}</span>
                    {r.verifie ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-risk-vert">
                        <CheckCircle2 size={12} />
                        Vérifié
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-navy-400">
                        <ShieldQuestion size={12} />
                        Non vérifié
                      </span>
                    )}
                    {!r.disponible && (
                      <span className="text-[11px] font-bold uppercase text-navy-400">Indisponible</span>
                    )}
                  </div>
                  <p className="text-sm text-navy-400 mt-0.5">
                    {zoneNameById.get(r.zone) ?? 'Zone inconnue'} · inscrit le {formatDate(r.date_inscription)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (r.verifie) {
                      // Afficher la modale de confirmation pour retirer
                      setConfirmUnverify(r);
                    } else {
                      // Vérifier directement sans confirmation
                      verifierRelais.mutate({ id: r.id, verifie: true });
                    }
                  }}
                  disabled={verifierRelais.isPending}
                  className={`text-sm font-bold rounded-md px-3.5 py-2 disabled:opacity-60 flex-shrink-0 text-white transition-colors ${
                    r.verifie
                      ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                      : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                  }`}
                >
                  {r.verifie ? 'Retirer la vérification' : 'Vérifier'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modale de confirmation pour retirer la vérification */}
      {confirmUnverify && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-navy-900' : 'bg-white'} border ${darkMode ? 'border-navy-800' : 'border-navy-50'} rounded-xl max-w-md w-full p-6`}>
            {/* En-tête */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertCircle size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-navy dark:text-white">Retirer la vérification?</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-400">{confirmUnverify.username}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmUnverify(null)}
                className="p-1 hover:bg-navy-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-navy-600 dark:text-navy-400" />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm text-navy-600 dark:text-navy-300 mb-6">
              Êtes-vous sûr de vouloir retirer la vérification de ce relais de quartier? Ce relais ne sera plus marqué comme vérifié.
            </p>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUnverify(null)}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-navy dark:text-white bg-navy-100 dark:bg-navy-800 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  verifierRelais.mutate({ id: confirmUnverify.id, verifie: false });
                  setConfirmUnverify(null);
                }}
                disabled={verifierRelais.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 transition-colors"
              >
                {verifierRelais.isPending ? 'Suppression...' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AutoriteShell>
  );
}
