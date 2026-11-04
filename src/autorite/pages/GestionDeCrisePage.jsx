import { useState, useEffect, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Droplet,
  CornerDownRight,
  Phone,
  Clock,
  Save,
  ShieldAlert,
  Radio,
  Smartphone,
  MessageSquare,
  Volume2,
  MapPin,
  Filter,
  Languages,
  Activity,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import RiskBadge from '../../shared/components/RiskBadge';
import A11yStatusMessage from '../../shared/components/A11yStatusMessage';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { useZones } from '../../shared/hooks/useZones';
import { useAlertesListe, useCreateAlerte, useUpdateAlerteStatut } from '../../shared/hooks/useAlertes';
import { useEnregistrerTriageAppel } from '../../shared/hooks/useEnregistrerTriageAppel';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import EtatListe from '../../shared/components/EtatListe';
import Pagination from '../../shared/components/Pagination';

const NIVEAUX = [
  { value: 'vert', label: 'Vert (Normal)' },
  { value: 'jaune', label: 'Jaune (Vigilance)' },
  { value: 'orange', label: 'Orange (Pré-Alerte)' },
  { value: 'rouge', label: 'Rouge (Urgence Absolue)' },
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

const FALLBACK_ZONES = [
  { id: 1, quartier: 'Thiaroye Gare' },
  { id: 2, quartier: 'Cuvette Ouest' },
  { id: 3, quartier: 'Cité Icotaf' },
  { id: 4, quartier: 'Quartier Médina' },
];

const CHANNEL_OPTIONS = [
  { id: 'sms', label: 'SMS Opérateurs', icon: MessageSquare },
  { id: 'push', label: 'Push Mobile WebSocket', icon: Smartphone },
  { id: 'relais_mosquee', label: 'Relais & Mosquées', icon: Volume2 },
  { id: 'radio', label: 'Radio Communautaire', icon: Radio },
];

const TEMPLATES_ALERTE = [
  {
    id: 'crue_critique',
    badge: 'ROUGE',
    label: 'Crue Critique (FR + Wolof)',
    zoneHint: 'gare',
    niveau: 'rouge',
    canaux: 'sms,push,relais_mosquee',
    message:
      'ALERTE ROUGE (C.O.D Thiaroye) : Montée critique des eaux constatée. Évacuez immédiatement vers le refuge École Thiaroye Gare. / [WOLOF] Ndox mi ngi yéeg bu metti ci gox bi. Demleen ci école Thiaroye Gare leegi.',
  },
  {
    id: 'vigilance_orage',
    badge: 'ORANGE',
    label: 'Vigilance Orage (FR + Wolof)',
    zoneHint: 'cuvette',
    niveau: 'orange',
    canaux: 'sms,push',
    message:
      "VIGILANCE ORANGE : Fortes pluies orageuses prévues dans 2h sur la Cuvette Ouest. Mettez vos biens en hauteur et coupez les disjoncteurs bas. / [WOLOF] Taw buubrey dina ñëw ci 2h. Dencleen seen yëf ci kaw.",
  },
  {
    id: 'coupure_senelec',
    badge: 'SENELEC',
    label: 'Danger Électrique',
    zoneHint: 'icotaf',
    niveau: 'rouge',
    canaux: 'sms,push,relais_mosquee',
    message:
      'URGENCE SÉCURITÉ : Câbles électriques immergés signalés. Délestage préventif SENELEC en cours. Ne traversez pas les eaux stagnantes.',
  },
  {
    id: 'fin_alerte',
    badge: 'VERT',
    label: 'Retour à la normale',
    zoneHint: 'gare',
    niveau: 'vert',
    canaux: 'push',
    message:
      'FIN DE VIGILANCE : Décrue confirmée par les sondes IoT et les équipes ONAS. Pompage terminé, circulation rétablie.',
  },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NouvelleAlerteForm({ draftPreview, onDraftChange }) {
  const { data: zonesData } = useZones();
  const apiZones = zonesData?.features?.map((f) => ({ id: f.id, ...f.properties })) ?? [];
  const zones = apiZones.length > 0 ? apiZones : FALLBACK_ZONES;

  const [zoneId, setZoneId] = useState('');
  const [niveau, setNiveau] = useState('jaune');
  const [message, setMessage] = useState('');
  const [canaux, setCanaux] = useState('sms,push');

  const mutation = useCreateAlerte();

  const selectedZoneName = useMemo(() => {
    const found = zones.find((z) => String(z.id) === String(zoneId));
    return found?.quartier || 'Thiaroye Gare (Tous secteurs)';
  }, [zones, zoneId]);

  useEffect(() => {
    if (onDraftChange) {
      onDraftChange({
        zoneName: selectedZoneName,
        niveau,
        message,
        canaux,
      });
    }
  }, [selectedZoneName, niveau, message, canaux, onDraftChange]);

  const activeChannels = useMemo(
    () =>
      canaux
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    [canaux]
  );

  const toggleChannel = (channelId) => {
    const exists = activeChannels.includes(channelId);
    const next = exists
      ? activeChannels.filter((c) => c !== channelId)
      : [...activeChannels, channelId];
    setCanaux(next.length > 0 ? next.join(',') : 'push');
  };

  const applyTemplate = (tpl) => {
    const targetZone =
      zones.find((z) => (z.quartier || '').toLowerCase().includes(tpl.zoneHint)) || zones[0];
    if (targetZone) setZoneId(String(targetZone.id));
    setNiveau(tpl.niveau);
    setMessage(tpl.message);
    setCanaux(tpl.canaux);
  };

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
    <form
      onSubmit={handleSubmit}
      className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Diffusion Officielle Multicanale
          </span>
          <h3 className="text-lg font-black text-[#0B2545] dark:text-white flex items-center gap-2 mt-0.5">
            <Plus size={16} className="text-[#CC131A]" />
            Émettre une nouvelle alerte
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200 text-[11px] font-bold">
          <Languages size={13} />
          FR / Wolof
        </span>
      </div>

      {/* Modèles pré-calibrés */}
      <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Modèles d&apos;alerte pré-calibrés (1-Clic) :
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Remplissage rapide</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEMPLATES_ALERTE.map((tpl) => {
            const isCritique = tpl.niveau === 'rouge';
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold transition cursor-pointer border ${
                  isCritique
                    ? 'bg-white dark:bg-slate-900 hover:bg-red-50/60 dark:hover:bg-red-950/30 text-[#0B2545] dark:text-white border-slate-200 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0B2545] dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="truncate">{tpl.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    isCritique
                      ? 'bg-[#CC131A]/10 text-[#CC131A] dark:bg-[#CC131A]/20 dark:text-red-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tpl.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone & Niveau */}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200 mb-1" id="zone-label">
            Zone Secteur
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5" id="zone-desc">
            Sélectionner la zone affectée
          </span>
          <select
            required
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            aria-labelledby="zone-label"
            aria-describedby="zone-desc"
            aria-invalid={!zoneId && mutation.isError}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
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
          <span className="block text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200 mb-1" id="niveau-label">
            Niveau de Gravité
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5" id="niveau-desc">
            Vert (faible) à Rouge (critique)
          </span>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            aria-labelledby="niveau-label"
            aria-describedby="niveau-desc"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
          >
            {NIVEAUX.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Message */}
      <label className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <span className="block text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200" id="message-label">
            Message Officiel aux Citoyens
          </span>
          <span className="text-[11px] font-semibold text-slate-400">{message.length} caractères</span>
        </div>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5" id="message-desc">
          Décrivez la situation et les consignes de mise en sécurité (Français / Wolof)
        </span>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : Montée d'eau rapide signalée, niveau rouge."
          aria-labelledby="message-label"
          aria-describedby="message-desc"
          aria-invalid={!message && mutation.isError}
          className="flex-1 min-h-[96px] w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
        />
      </label>

      {/* Canaux de diffusion */}
      <div>
        <span className="block text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200 mb-1" id="canaux-label">
          Canaux de Diffusion Actifs
        </span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-2" id="canaux-desc">
          Sélectionnez les vecteurs de transmission vers l&apos;Espace Citoyen
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
          {CHANNEL_OPTIONS.map((ch) => {
            const Icon = ch.icon;
            const isSelected = activeChannels.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span className="truncate">{ch.label}</span>
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={canaux}
          onChange={(e) => setCanaux(e.target.value)}
          placeholder="sms,push"
          aria-labelledby="canaux-label"
          aria-describedby="canaux-desc"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-300"
        />
      </div>

      {mutation.isError && (
        <ErrorMessage
          error={flattenApiErrors(mutation.error)[0]}
          title="Impossible de créer l'alerte"
          suggestion="Vérifiez les champs et réessayez"
          type="error"
        />
      )}

      {mutation.isSuccess && (
        <A11yStatusMessage
          type="success"
          message="✓ Alerte créée et diffusée en temps réel vers l'Espace Citoyen !"
          visible={true}
        />
      )}

      <div className="mt-auto pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Transmission WebSocket instantanée dès validation
        </span>
        <button
          type="submit"
          disabled={mutation.isPending}
          aria-label="Émettre l'alerte aux citoyens"
          aria-busy={mutation.isPending}
          className="flex items-center gap-2 bg-[#CC131A] hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
        >
          <Send size={14} aria-hidden="true" />
          {mutation.isPending ? 'Diffusion en cours…' : "Émettre l'alerte"}
        </button>
      </div>
    </form>
  );
}

function ApercuDirectCitoyen({ draft }) {
  const niveau = draft?.niveau || 'jaune';
  const zoneName = draft?.zoneName || 'Thiaroye Gare';
  const message =
    draft?.message?.trim() ||
    "Sélectionnez un modèle ou rédigez un message pour visualiser l'alerte telle qu'elle s'affichera sur le téléphone des habitants.";
  const canaux = draft?.canaux || 'sms,push';

  return (
    <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-[#0B2545] dark:text-slate-200" />
          <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
            Aperçu Réception Espace Citoyen
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Canal WebSocket Prêt
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RiskBadge niveau={niveau} />
            <span className="text-xs font-black text-[#0B2545] dark:text-white flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              {zoneName}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Direct Mobile
          </span>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
          {message}
        </p>

        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Vecteurs : {canaux}</span>
          <span className="font-bold text-[#0B2545] dark:text-slate-300">Cellule C.O.D</span>
        </div>
      </div>
    </div>
  );
}

function FilDeReflexe() {
  const categories = [
    {
      id: 'electrique',
      titre: 'Danger électrique',
      unite: 'SENELEC',
      icon: AlertTriangle,
      actions: [
        "Couper l'électricité dans les zones inondées",
        'Signaler les câbles électriques endommagés',
        'Évacuer les installations électriques critiques',
        'Informer les citoyens des dangers',
        'Demander intervention électriciens urgents',
      ],
    },
    {
      id: 'eau',
      titre: 'Eau potable & pompage',
      unite: 'ONAS',
      icon: Droplet,
      actions: [
        "Vérifier la qualité de l'eau avec tests",
        "Distribuer de l'eau potable aux citoyens",
        "Recommander de bouillir l'eau contaminée",
        "Fermer les points d'approvisionnement suspects",
        'Mettre en place des stations de désinfection',
      ],
    },
    {
      id: 'evacuation',
      titre: 'Évacuation & secours',
      unite: 'BNSP',
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

  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [callStartTime] = useState(new Date());
  const [callMinutes, setCallMinutes] = useState(0);
  const [citoyenInput, setCitoyenInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const mutation = useEnregistrerTriageAppel();

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

  const toggleAllCategory = (cat) => {
    const allChecked = cat.actions.every((_, idx) => checkedItems[`${cat.id}-${idx}`]);
    setCheckedItems((prev) => {
      const next = { ...prev };
      cat.actions.forEach((_, idx) => {
        next[`${cat.id}-${idx}`] = !allChecked;
      });
      return next;
    });
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
        setStatusMessage("✓ Triage d'appel enregistré avec succès!");
        setCitoyenInput('');
        setCheckedItems({});
        setNotes({});
        setTimeout(() => setStatusMessage(''), 5000);
      },
      onError: (error) => {
        const errors = flattenApiErrors(error);
        setStatusMessage(`✗ Erreur: ${errors[0] || "Impossible d'enregistrer le triage"}`);
        setTimeout(() => setStatusMessage(''), 5000);
      },
    });
  };

  return (
    <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Standard Opérationnel Secours (18 BNSP / 15 SAMU)
          </span>
          <h3 className="text-lg font-black text-[#0B2545] dark:text-white mt-0.5">
            Fil de réflexe — Protocole de Triage &amp; Réponse Rapide
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Phone size={15} className="text-[#0B2545] dark:text-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Durée Appel</p>
              <p className="text-xs font-black text-[#0B2545] dark:text-white flex items-center gap-1">
                <Clock size={12} />
                {callMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Complétude</p>
              <p className="text-xs font-black text-[#0B2545] dark:text-white">{getTotalProgress()}%</p>
            </div>
            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="h-full bg-[#0B2545] dark:bg-sky-400 rounded-full transition-all"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCall}
            disabled={mutation.isPending}
            aria-label="Enregistrer l'appel de triage avec toutes les données saisies"
            aria-busy={mutation.isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition flex-shrink-0 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            <Save size={14} aria-hidden="true" />
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer appel'}
          </button>
        </div>
      </div>

      {/* Identification appelant */}
      <div className="flex items-end gap-3 flex-wrap bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
        <label className="block flex-1 min-w-[240px]">
          <span className="block text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200 mb-1" id="citoyen-label">
            ID ou numéro de téléphone citoyen
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5" id="citoyen-desc">
            Entrez l’ID du dossier ou le numéro de l&apos;appelant
          </span>
          <input
            type="text"
            placeholder="Ex: 123 ou +221 77 123 45 67"
            value={citoyenInput}
            onChange={(e) => setCitoyenInput(e.target.value)}
            aria-labelledby="citoyen-label"
            aria-describedby="citoyen-desc"
            aria-invalid={statusMessage.includes('Veuillez entrer')}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#0B2545] dark:text-white"
          />
        </label>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCitoyenInput('+221 77 842 19 30')}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0B2545] dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            Appelant Démo (+221 77 842 19 30)
          </button>
        </div>

        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl flex-1 min-w-[200px] ${
              statusMessage.startsWith('✗')
                ? 'bg-[#CC131A]/10 text-[#CC131A]'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 3 Colonnes de protocole permanentes et équilibrées (sans accordéon ni vide blanc) */}
      <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const categoryCompleted = cat.actions.filter(
            (_, idx) => checkedItems[`${cat.id}-${idx}`]
          ).length;
          const allChecked = categoryCompleted === cat.actions.length;
          const progressPct = Math.round((categoryCompleted / cat.actions.length) * 100);

          return (
            <div
              key={cat.id}
              className="flex flex-col bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
            >
              {/* En-tête de colonne : titre complet + badge unité + jauge */}
              <div className="px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center shrink-0">
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-[#0B2545] dark:text-white leading-snug">
                        {cat.titre}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {categoryCompleted}/{cat.actions.length} actions validées
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-200 shrink-0">
                    {cat.unite}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      allChecked ? 'bg-emerald-600' : 'bg-[#0B2545] dark:bg-sky-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Liste des 5 actions (toujours ouverte et alignée) */}
              <div
                id={`category-${cat.id}`}
                className="p-4 space-y-2.5 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {cat.actions.map((action, idx) => {
                    const key = `${cat.id}-${idx}`;
                    const isChecked = checkedItems[key];
                    const checkboxId = `checkbox-${key}`;
                    const notesId = `notes-${key}`;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border transition ${
                          isChecked
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <label htmlFor={checkboxId} className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={() => toggleItem(cat.id, idx)}
                            aria-describedby={notesId}
                            className="w-4 h-4 accent-emerald-600 flex-shrink-0 mt-0.5 cursor-pointer"
                          />
                          <span
                            className={`text-xs leading-snug transition ${
                              isChecked
                                ? 'line-through text-slate-400 font-medium'
                                : 'text-[#0B2545] dark:text-slate-200 font-semibold'
                            }`}
                          >
                            {action}
                          </span>
                        </label>
                        {isChecked && (
                          <textarea
                            id={notesId}
                            placeholder="Ajouter une consigne terrain (optionnel)..."
                            aria-label={`Notes pour ${action}`}
                            value={notes[key] || ''}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            rows={2}
                            className="mt-2 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0B2545] dark:text-slate-200"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pied de carte : validation rapide du protocole */}
                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    Protocole {cat.unite}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAllCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      allChecked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        : 'bg-[#0B2545]/10 dark:bg-slate-800 text-[#0B2545] dark:text-white hover:bg-[#0B2545] hover:text-white'
                    }`}
                  >
                    {allChecked ? 'Réinitialiser' : 'Tout valider'}
                  </button>
                </div>
              </div>
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
  const zoneLabel = alerte.zone?.quartier || alerte.zone_nom || 'Thiaroye-sur-Mer';
  const isResolving = alerte.statut === 'envoyee';

  return (
    <div className="flex items-start gap-3.5 p-4 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl transition hover:border-slate-300 dark:hover:border-slate-700">
      <RiskBadge niveau={alerte.niveau} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black text-[#0B2545] dark:text-white truncate">
            {zoneLabel}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
            {formatDateTime(alerte.timestamp)}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          {alerte.message}
        </p>
        <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-[#0B2545] dark:text-slate-300">
              {STATUT_LABELS[alerte.statut] ?? alerte.statut}
            </span>
            {alerte.canaux && (
              <span className="text-[11px] text-slate-400 font-mono truncate">
                [{alerte.canaux}]
              </span>
            )}
          </div>

          {next && (
            <button
              type="button"
              onClick={() => mutation.mutate({ id: alerte.id, statut: next })}
              disabled={mutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer ${
                isResolving
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#0B2545] hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 size={13} />
              {NEXT_LABEL[alerte.statut]}
            </button>
          )}
        </div>
        {mutation.isError && (
          <p className="text-xs text-[#CC131A] mt-1">{flattenApiErrors(mutation.error)[0]}</p>
        )}
      </div>
    </div>
  );
}

export default function GestionDeCrisePage() {
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [orsecActive, setOrsecActive] = useState(false);
  const [draftPreview, setDraftPreview] = useState({
    zoneName: 'Thiaroye Gare',
    niveau: 'jaune',
    message: '',
    canaux: 'sms,push',
  });

  const { data, isLoading } = useAlertesListe(page);
  const alertes = data?.results ?? [];

  const counts = useMemo(() => {
    const enAttente = alertes.filter((a) => a.statut === 'en_attente').length;
    const envoyees = alertes.filter((a) => a.statut === 'envoyee').length;
    const resolues = alertes.filter((a) => a.statut === 'resolue').length;
    return {
      total: data?.count ?? alertes.length,
      enAttente,
      envoyees,
      resolues,
    };
  }, [alertes, data?.count]);

  const filteredAlertes = useMemo(() => {
    if (statutFilter === 'ALL') return alertes;
    return alertes.filter((a) => a.statut === statutFilter);
  }, [alertes, statutFilter]);

  return (
    <AutoriteShell>
      <div className="space-y-6">
        {/* EN-TÊTE INSTITUTIONNEL SALLE DE CRISE */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                  <Activity size={13} className="text-[#CC131A]" />
                  Cellule Opérationnelle de Défense Civile · Thiaroye
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-1">
                Gestion de crise
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Cycle de vie des alertes · en attente → envoyée → résolue &amp; coordination ORSEC
              </p>
            </div>

            <div className="flex items-center flex-nowrap gap-2.5 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 whitespace-nowrap">
                Alertes actives : <span className="font-black">{counts.enAttente + counts.envoyees}</span>
              </div>

              <button
                type="button"
                onClick={() => setOrsecActive((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  orsecActive
                    ? 'bg-[#CC131A] text-white shadow-xs'
                    : 'bg-[#0B2545] hover:bg-slate-800 text-white'
                }`}
              >
                <ShieldAlert size={14} />
                {orsecActive ? 'Plan ORSEC Actif' : 'Activer Plan ORSEC'}
              </button>
            </div>
          </div>

          {/* Compteurs sobres de cycle de vie */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Total Historique
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white mt-1 block">
                {counts.total}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                En attente d&apos;envoi
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white mt-1 block">
                {counts.enAttente}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Diffusées (Actives)
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white mt-1 block">
                {counts.envoyees}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Clôturées / Résolues
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 mt-1 block">
                {counts.resolues}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1 : DIFFUSION D'ALERTE (GAUCHE) + APERÇU CITOYEN & JOURNAL (DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <NouvelleAlerteForm draftPreview={draftPreview} onDraftChange={setDraftPreview} />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <ApercuDirectCitoyen draft={draftPreview} />

            <div className="flex-1 bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3.5">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    Toutes les alertes · {data?.count ?? 0}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Filter size={12} className="text-slate-400 mr-1" />
                    {[
                      { id: 'ALL', label: 'Toutes' },
                      { id: 'en_attente', label: 'Attente' },
                      { id: 'envoyee', label: 'Envoyées' },
                      { id: 'resolue', label: 'Résolues' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatutFilter(tab.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          statutFilter === tab.id
                            ? 'bg-[#0B2545] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <EtatListe
                    chargement={isLoading}
                    vide={filteredAlertes.length === 0}
                    messageVide="Aucune alerte pour ce filtre."
                  >
                    {filteredAlertes.map((a) => (
                      <AlerteRow key={a.id} alerte={a} />
                    ))}
                  </EtatListe>
                </div>
              </div>

              <Pagination page={page} data={data} setPage={setPage} />
            </div>
          </div>
        </div>

        {/* SECTION 2 : TRIAGE D'APPELS D'URGENCE & FIL DE RÉFLEXE */}
        <FilDeReflexe />
      </div>
    </AutoriteShell>
  );
}
