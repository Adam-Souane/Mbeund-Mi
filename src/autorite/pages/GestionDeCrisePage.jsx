import { useState, useEffect } from 'react';
import { Send, CheckCircle2, ChevronLeft, ChevronRight, Plus, AlertTriangle, Droplet, CornerDownRight, Check, Phone, Clock, Save, X } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import RiskBadge from '../../shared/components/RiskBadge';
import A11yStatusMessage from '../../shared/components/A11yStatusMessage';
import { useZones } from '../../shared/hooks/useZones';
import { useAlertesListe, useCreateAlerte, useUpdateAlerteStatut } from '../../shared/hooks/useAlertes';
import { useEnregistrerTriageAppel } from '../../shared/hooks/useEnregistrerTriageAppel';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const NIVEAUX = [
  { value: 'vert', label: 'Vert' },
  { value: 'jaune', label: 'Jaune' },
  { value: 'orange', label: 'Orange' },
  { value: 'rouge', label: 'Rouge' },
];

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Envoyée',
  resolue: 'Résolue',
};

// Machine à états exacte de l'action `statut` côté backend
// (AlerteViewSet.statut) : en_attente -> envoyee -> resolue, jamais en arrière.
const NEXT_STATUT = { en_attente: 'envoyee', envoyee: 'resolue' };
const NEXT_LABEL = { en_attente: 'Envoyer', envoyee: 'Marquer résolue' };

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function NouvelleAlerteForm() {
  const { data: zonesData } = useZones();
  const zones = zonesData?.features?.map((f) => ({ id: f.id, ...f.properties })) ?? [];

  const [zoneId, setZoneId] = useState('');
  const [niveau, setNiveau] = useState('jaune');
  const [message, setMessage] = useState('');
  const [canaux, setCanaux] = useState('sms,push');

  const mutation = useCreateAlerte();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!zoneId) return;
    mutation.mutate(
      {
        zone: Number(zoneId),
        niveau,
        message,
        canaux,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setMessage('');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Plus size={15} />
        Émettre une nouvelle alerte
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-semibold mb-1.5" id="zone-label">Zone</span>
          <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1.5" id="zone-desc">
            Sélectionner la zone affectée
          </span>
          <select
            required
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            aria-labelledby="zone-label"
            aria-describedby="zone-desc"
            aria-invalid={!zoneId && mutation.isError}
            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-base"
          >
            <option value="">Sélectionner…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.quartier}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-semibold mb-1.5" id="niveau-label">Niveau</span>
          <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1.5" id="niveau-desc">
            Vert (faible) à Rouge (critique)
          </span>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            aria-labelledby="niveau-label"
            aria-describedby="niveau-desc"
            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-base"
          >
            {NIVEAUX.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-semibold mb-1.5" id="message-label">Message</span>
        <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1.5" id="message-desc">
          Décrivez la situation et les actions recommandées
        </span>
        <textarea
          rows={2}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : Montée d'eau rapide signalée, niveau rouge."
          aria-labelledby="message-label"
          aria-describedby="message-desc"
          aria-invalid={!message && mutation.isError}
          className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-base"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-semibold mb-1.5" id="canaux-label">Canaux</span>
        <span className="block text-xs text-navy-500 dark:text-navy-400 mb-1.5" id="canaux-desc">
          Canaux de communication (sms, push, etc)
        </span>
        <input
          type="text"
          value={canaux}
          onChange={(e) => setCanaux(e.target.value)}
          placeholder="sms,push"
          aria-labelledby="canaux-label"
          aria-describedby="canaux-desc"
          className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-base"
        />
      </label>

      <A11yStatusMessage
        type="error"
        messages={mutation.isError ? flattenApiErrors(mutation.error) : []}
        visible={mutation.isError}
      />

      {mutation.isSuccess && (
        <A11yStatusMessage
          type="success"
          message="Alerte créée avec succès"
          visible={true}
        />
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        aria-label="Émettre l'alerte aux citoyens"
        aria-busy={mutation.isPending}
        className="self-start flex items-center gap-2 bg-red text-white font-bold text-sm px-4 py-2.5 rounded-md disabled:opacity-60 hover:bg-red-700 transition-colors"
      >
        <Send size={14} aria-hidden="true" />
        {mutation.isPending ? 'Envoi…' : "Émettre l'alerte"}
      </button>
    </form>
  );
}

function FilDeReflexe() {
  const categories = [
    {
      id: 'electrique',
      titre: '⚡ Danger électronique',
      icon: AlertTriangle,
      actions: [
        'Couper l\'électricité dans les zones inondées',
        'Signaler les câbles électriques endommagés',
        'Évacuer les installations électriques critiques',
        'Informer les citoyens des dangers',
        'Demander intervention électriciens urgents',
      ],
    },
    {
      id: 'eau',
      titre: '💧 Eau potable & désinfectée',
      icon: Droplet,
      actions: [
        'Vérifier la qualité de l\'eau avec tests',
        'Distribuer de l\'eau potable aux citoyens',
        'Recommander de bouillir l\'eau contaminée',
        'Fermer les points d\'approvisionnement suspects',
        'Mettre en place des stations de désinfection',
      ],
    },
    {
      id: 'evacuation',
      titre: '🚨 Évacuation réflexe & secours',
      icon: CornerDownRight,
      actions: [
        'Identifier les zones à évacuer immédiatement',
        'Activer les relais de quartier et la communication',
        'Accueillir les évacués aux points de refuge',
        'Organiser les secours médicaux et alimentaires',
        'Maintenir contact radio avec équipes terrain',
      ],
    },
  ];

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [callStartTime] = useState(new Date());
  const [callMinutes, setCallMinutes] = useState(0);
  const [citoyenInput, setCitoyenInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const mutation = useEnregistrerTriageAppel();

  // Simulate call timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((new Date() - callStartTime) / 60000);
      setCallMinutes(elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStartTime]);

  const toggleItem = (catId, idx) => {
    const key = `${catId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTotalProgress = () => {
    const total = categories.reduce((sum, cat) => sum + cat.actions.length, 0);
    const completed = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const handleSaveCall = () => {
    if (!citoyenInput.trim()) {
      setStatusMessage('Veuillez entrer un ID ou un numéro de citoyen.');
      setTimeout(() => setStatusMessage(''), 5000);
      return;
    }

    // Find first category with checked items
    let categorie = null;
    for (let cat of categories) {
      const hasCategoryItems = cat.actions.some((_, idx) => checkedItems[`${cat.id}-${idx}`]);
      if (hasCategoryItems) {
        categorie = cat.id;
        break;
      }
    }

    if (!categorie) {
      setStatusMessage('Veuillez cocher au moins un élément.');
      setTimeout(() => setStatusMessage(''), 5000);
      return;
    }

    // Prepare triage data
    const isNumeric = /^\d+$/.test(citoyenInput.trim());
    const triageData = {
      citoyen_id: isNumeric ? Number(citoyenInput.trim()) : null,
      numero_citoyen: !isNumeric ? citoyenInput.trim() : null,
      categorie,
      duree_appel_minutes: callMinutes,
      reponses: checkedItems,
      pourcentage_complete: getTotalProgress(),
      notes_generales: Object.entries(notes)
        .filter(([, val]) => val)
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n'),
    };

    mutation.mutate(triageData, {
      onSuccess: () => {
        setStatusMessage('✓ Triage d\'appel enregistré avec succès!');
        setCitoyenInput('');
        setCheckedItems({});
        setNotes({});
        setTimeout(() => setStatusMessage(''), 5000);
      },
      onError: (error) => {
        const errors = flattenApiErrors(error);
        setStatusMessage(`✗ Erreur: ${errors[0] || 'Impossible d\'enregistrer le triage'}`);
        setTimeout(() => setStatusMessage(''), 5000);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header avec timer et progress */}
      <div className="bg-gradient-to-r from-navy-50 to-navy-100 dark:from-navy-900 dark:to-navy-800 rounded-xl p-4 border border-navy-100 dark:border-navy-700 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-red" />
            <div>
              <p className="text-xs font-semibold text-navy-400">Appel en cours</p>
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Clock size={14} />
                {callMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-navy-400 text-right">Complétude du triage</p>
              <p className="text-sm font-bold text-red">{getTotalProgress()}%</p>
            </div>
            <div className="w-24 bg-navy-200 dark:bg-navy-700 rounded-full h-2.5">
              <div
                className="h-full bg-red rounded-full transition-all"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleSaveCall}
            disabled={mutation.isPending}
            aria-label="Enregistrer l'appel de triage avec toutes les données saisies"
            aria-busy={mutation.isPending}
            className="flex items-center gap-1.5 bg-red text-white font-bold text-sm px-3.5 py-2 rounded-md hover:bg-red-600 transition flex-shrink-0 disabled:opacity-60"
          >
            <Save size={14} aria-hidden="true" />
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer appel'}
          </button>
        </div>

        {/* Citoyen input + status */}
        <div className="flex items-end gap-3 flex-wrap">
          <label className="block flex-1 min-w-[200px]">
            <span className="block text-xs font-semibold text-navy-500 mb-1.5" id="citoyen-label">
              ID ou numéro citoyen
            </span>
            <span className="block text-xs text-navy-400 mb-1" id="citoyen-desc">
              Entrez l'ID (ex: 123) ou le numéro de téléphone
            </span>
            <input
              type="text"
              placeholder="Ex: 123 ou +221 77 123 45 67"
              value={citoyenInput}
              onChange={(e) => setCitoyenInput(e.target.value)}
              aria-labelledby="citoyen-label"
              aria-describedby="citoyen-desc"
              aria-invalid={statusMessage.includes('Veuillez entrer')}
              className="w-full px-3 py-2 rounded border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy text-sm"
            />
          </label>

          {statusMessage && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded flex-1 min-w-[200px] ${
                statusMessage.startsWith('✗') ? 'bg-red/10 text-red' : 'bg-green/10 text-green-600'
              }`}
            >
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Catégories */}
      <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isExpanded = expandedCategory === cat.id;
          const categoryCompleted = cat.actions.filter(
            (_, idx) => checkedItems[`${cat.id}-${idx}`]
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                aria-expanded={isExpanded}
                aria-controls={`category-${cat.id}`}
                aria-label={`${cat.titre} - ${categoryCompleted} sur ${cat.actions.length} complétés`}
                className="w-full px-5 py-3 flex items-center gap-3 bg-navy-50 dark:bg-navy-900 hover:bg-navy-100 dark:hover:bg-navy-800 transition text-left focus:outline-none focus:ring-2 focus:ring-red focus:ring-inset"
              >
                <Icon size={18} className="text-red flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{cat.titre}</h4>
                  <p className="text-xs text-navy-400 mt-0.5">{categoryCompleted}/{cat.actions.length} complétés</p>
                </div>
                <span className={`transform transition flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
              </button>

              {isExpanded && (
                <div id={`category-${cat.id}`} className="p-4 space-y-3 border-t border-navy-50 dark:border-navy-700">
                  {cat.actions.map((action, idx) => {
                    const key = `${cat.id}-${idx}`;
                    const isChecked = checkedItems[key];
                    const checkboxId = `checkbox-${key}`;
                    const notesId = `notes-${key}`;

                    return (
                      <div key={idx} className="space-y-2">
                        <label htmlFor={checkboxId} className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={() => toggleItem(cat.id, idx)}
                            aria-describedby={notesId}
                            className="w-4 h-4 accent-red flex-shrink-0 mt-0.5 cursor-pointer focus:ring-2 focus:ring-red focus:ring-inset"
                          />
                          <span className={`text-sm transition ${isChecked ? 'line-through text-navy-400' : 'text-navy-600 dark:text-navy-200 font-semibold'}`}>
                            {action}
                          </span>
                        </label>
                        {isChecked && (
                          <textarea
                            id={notesId}
                            placeholder="Ajouter des notes (optionnel)..."
                            aria-label={`Notes pour ${action}`}
                            value={notes[key] || ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                            rows={2}
                            className="ml-6 w-full px-2.5 py-1.5 text-xs rounded border border-navy-100 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 placeholder:text-navy-400 focus:ring-2 focus:ring-red focus:ring-inset"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlerteRow({ alerte }) {
  const mutation = useUpdateAlerteStatut();
  const next = NEXT_STATUT[alerte.statut];

  return (
    <div className="flex items-start gap-3 p-4 border border-navy-50 dark:border-navy-800 rounded-lg">
      <RiskBadge niveau={alerte.niveau} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold truncate">{alerte.zone?.quartier}</span>
          <span className="text-xs text-navy-400 flex-shrink-0">{formatDateTime(alerte.timestamp)}</span>
        </div>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">{alerte.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] font-bold uppercase text-navy-400">{STATUT_LABELS[alerte.statut] ?? alerte.statut}</span>
          {next && (
            <button
              onClick={() => mutation.mutate({ id: alerte.id, statut: next })}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-sm font-bold text-red disabled:opacity-60"
            >
              <CheckCircle2 size={13} />
              {NEXT_LABEL[alerte.statut]}
            </button>
          )}
        </div>
        {mutation.isError && (
          <p className="text-xs text-red mt-1">{flattenApiErrors(mutation.error)[0]}</p>
        )}
      </div>
    </div>
  );
}

export default function GestionDeCrisePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAlertesListe(page);
  const alertes = data?.results ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Gestion de crise</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Cycle de vie des alertes · en attente → envoyée → résolue
        </p>
      </div>

      <NouvelleAlerteForm />

      <div>
        <h3 className="text-lg font-bold mb-4">📋 Fil de réflexe — Réponse rapide en 3 catégories</h3>
        <FilDeReflexe />
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold">Toutes les alertes · {data?.count ?? 0}</h3>
        {isLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : alertes.length === 0 ? (
          <p className="text-sm text-navy-400">Aucune alerte pour l’instant.</p>
        ) : (
          alertes.map((a) => <AlerteRow key={a.id} alerte={a} />)
        )}
      </div>

      {(data?.next || data?.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data?.previous}
            className="flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Précédent
          </button>
          <span className="text-sm text-navy-400">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.next}
            className="flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </AutoriteShell>
  );
}
