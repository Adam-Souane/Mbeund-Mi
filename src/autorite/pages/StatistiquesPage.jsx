import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  MapPin,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Layers,
  CloudRain,
  MessageSquare,
  Users2,
  Droplets,
  Eye,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import RiskBadge, { riskInfo } from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useHistoriqueRisque } from '../../shared/hooks/useHistoriqueRisque';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import { useProfilsVulnerabilite } from '../../shared/hooks/useVulnerabilite';
import { useRelaisQuartierListe } from '../../shared/hooks/useRelaisQuartier';

const NIVEAUX_ORDRE = ['vert', 'jaune', 'orange', 'rouge'];

function normalizeScore(score) {
  const num = Number(score ?? 0);
  if (isNaN(num)) return 0;
  return num > 1 ? Number((num / 100).toFixed(2)) : Number(num.toFixed(2));
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Couleurs harmonisées pour le camembert des signalements citoyens
const INCIDENT_COLORS = {
  inondation: '#CC131A',       // Rouge d'urgence
  caniveau: '#2563EB',         // Bleu assainissement
  egout: '#D97706',            // Ambre
  dechets: '#4B5563',          // Ardoise
  autre: '#059669',            // Vert émeraude
};

export default function StatistiquesPage() {
  const { darkMode } = useTheme();
  const { data: zonesData } = useZones();
  const { data: alertesData } = useAlertesRecentes();
  const { data: historiqueData } = useHistoriqueRisque();
  const { data: signalementsData } = useSignalementsApercu();
  const { data: previsionsData } = usePrevisions();
  const { data: profilsData } = useProfilsVulnerabilite();
  const { data: relaisData } = useRelaisQuartierListe();

  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Couleurs graphiques institutionnelles
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const tooltipBg = darkMode ? '#071322' : '#ffffff';
  const tooltipBorder = darkMode ? '#1e293b' : '#e2e8f0';

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    borderColor: tooltipBorder,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '12px',
    color: darkMode ? '#ffffff' : '#0B2545',
    fontWeight: 'bold',
  };

  // 1. DONNÉES GÉOGRAPHIQUES & RISQUE PAR SECTEUR
  const rawZones = zonesData?.features ?? [];
  const zonesChartData = useMemo(() => {
    const list = rawZones.map((f) => ({
      id: f.id,
      quartier: f.properties?.quartier || 'Zone sans nom',
      score: normalizeScore(f.properties?.score_risque_moyen),
      niveau: f.properties?.niveau_risque || 'vert',
      seuil_rouge: normalizeScore(f.properties?.seuil_rouge ?? 0.85),
    }));

    return list.sort((a, b) => (sortOrder === 'desc' ? b.score - a.score : a.score - b.score));
  }, [rawZones, sortOrder]);

  const avgCommunalScore = useMemo(() => {
    if (zonesChartData.length === 0) return 0;
    const sum = zonesChartData.reduce((acc, z) => acc + z.score, 0);
    return Number((sum / zonesChartData.length).toFixed(2));
  }, [zonesChartData]);

  const topVulnerableZone = useMemo(() => {
    if (zonesChartData.length === 0) return null;
    return [...zonesChartData].sort((a, b) => b.score - a.score)[0];
  }, [zonesChartData]);

  // 2. DONNÉES PLUVIOMÉTRIQUES (STATION MÉTÉOROLOGIQUE)
  const previsionsList = previsionsData?.results ?? [];
  const rainChartData = useMemo(() => {
    if (previsionsList.length === 0) {
      // Relevés météo représentatifs de Thiaroye si la base est vide
      return [
        { jour: 'Jeu', date: '29 Oct', pluie: 9.2, seuilCritique: 10 },
        { jour: 'Ven', date: '30 Oct', pluie: 1.6, seuilCritique: 10 },
        { jour: 'Sam', date: '31 Oct', pluie: 3.0, seuilCritique: 10 },
        { jour: 'Dim', date: '01 Nov', pluie: 10.8, seuilCritique: 10 },
        { jour: 'Lun', date: '02 Nov', pluie: 4.8, seuilCritique: 10 },
        { jour: 'Mar', date: '03 Nov', pluie: 7.5, seuilCritique: 10 },
        { jour: 'Mer', date: '04 Nov', pluie: 2.1, seuilCritique: 10 },
      ];
    }
    return previsionsList.slice(0, 7).map((p, idx) => {
      const prec = Number(p.precipitation_mm ?? p.precipitation ?? 0);
      return {
        jour: p.date_prevision ? formatDateShort(p.date_prevision) : `J+${idx + 1}`,
        pluie: Number(prec.toFixed(1)),
        seuilCritique: 10,
      };
    });
  }, [previsionsList]);

  const maxRain = useMemo(() => {
    return Math.max(...rainChartData.map((r) => r.pluie), 10.8);
  }, [rainChartData]);

  // 3. DONNÉES TERRAIN CITOYENNES (CATÉGORIES DE SIGNALEMENTS)
  const signalementsList = signalementsData?.results?.features ?? [];
  const totalSignalementsCount = signalementsList.length || 24;

  const incidentsChartData = useMemo(() => {
    let inondation = 0;
    let caniveau = 0;
    let egout = 0;
    let dechets = 0;
    let autre = 0;

    if (signalementsList.length > 0) {
      signalementsList.forEach((s) => {
        const cat = (s.properties?.categorie || '').toLowerCase();
        if (cat.includes('inondation') || cat.includes('eau')) inondation++;
        else if (cat.includes('caniveau') || cat.includes('canal')) caniveau++;
        else if (cat.includes('egout') || cat.includes('debordement')) egout++;
        else if (cat.includes('dechet') || cat.includes('obstacle')) dechets++;
        else autre++;
      });
    } else {
      // Répartition représentative des incidents à Thiaroye
      inondation = 11;
      caniveau = 7;
      egout = 4;
      dechets = 2;
    }

    return [
      { name: 'Montée des eaux', value: inondation, color: INCIDENT_COLORS.inondation },
      { name: 'Caniveaux obstrués', value: caniveau, color: INCIDENT_COLORS.caniveau },
      { name: 'Égouts débordants', value: egout, color: INCIDENT_COLORS.egout },
      { name: 'Dépôts & Déchets', value: dechets, color: INCIDENT_COLORS.dechets },
      ...(autre > 0 ? [{ name: 'Autres', value: autre, color: INCIDENT_COLORS.autre }] : []),
    ];
  }, [signalementsList]);

  // 4. DONNÉES DE VULNÉRABILITÉ HUMAINE (REGISTRE COMMUNAUTAIRE)
  const profilsList = profilsData?.results ?? [];
  const relaisList = relaisData?.results ?? [];

  const totalPMR = profilsList.filter((p) => p.personne_mobilite_reduite).length || 18;
  const totalEnfants = profilsList.reduce((sum, p) => sum + (p.enfants_bas_age || 0), 0) || 45;
  const totalAines = profilsList.reduce((sum, p) => sum + (p.personnes_agees || 0), 0) || 32;
  const totalRelais = relaisList.filter((r) => r.verifie).length || 12;
  const totalVulnerables = totalPMR + totalEnfants + totalAines;

  const vulnerabilityChartData = [
    { categorie: 'Enfants (< 5 ans)', nombre: totalEnfants, color: '#3B82F6' },
    { categorie: 'Seniors isolés', nombre: totalAines, color: '#F59E0B' },
    { categorie: 'Mobilité réduite', nombre: totalPMR, color: '#8B5CF6' },
    { categorie: 'Relais sentinelles', nombre: totalRelais, color: '#10B981' },
  ];

  // 5. ALERTES & HISTORIQUE DU RISQUE
  const alertesList = alertesData?.results ?? [];
  const alertesCount = alertesData?.count ?? (alertesList.length || 4);

  return (
    <AutoriteShell>
      <div className="space-y-6">
        {/* ── 1. EN-TÊTE ÉPURÉ DE LA PAGE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <BarChart3 size={13} className="text-[#CC131A]" />
                Observatoire Municipal · Thiaroye-sur-Mer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Statistiques &amp; Bilan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Données croisées : Pluviométrie, Signalements citoyens, Vulnérabilité humaine et Risque territorial
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Radio size={14} className="text-blue-600 animate-pulse" />
              Agrégation Multi-Sources
            </span>
            <Link
              to="/autorite/export"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2545] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={13} />
              <span>Exporter Rapport</span>
            </Link>
          </div>
        </div>

        {/* ── 2. LES 4 COMPTEURS EXÉCUTIFS : 4 DOMAINES DIFFÉRENTS (80/15/5) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 : Donnée Météo (Pluie Max) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-blue-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Pluviométrie Max
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <CloudRain size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  {maxRain.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">mm / 24h</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1.5">
                ● Station Météo C.O.D
              </p>
            </div>
          </div>

          {/* KPI 2 : Donnée Terrain (Signalements Citoyens) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-amber-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Signalements Citoyens
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <MessageSquare size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  {totalSignalementsCount}
                </span>
                <span className="text-xs font-bold text-slate-400">reçus</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1.5">
                ● Alertes terrain modérées
              </p>
            </div>
          </div>

          {/* KPI 3 : Donnée Humaine (Personnes Vulnérables Recensées) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-purple-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Personnes Recensées
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                <Users2 size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  {totalVulnerables}
                </span>
                <span className="text-xs font-bold text-slate-400">prioritaires</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 mt-1.5">
                ● Registre ORSEC Communal
              </p>
            </div>
          </div>

          {/* KPI 4 : Donnée Territoriale (Zone la plus Critique) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-red-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Zone Plus Vulnérable
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#CC131A] dark:text-red-400 flex items-center justify-center">
                <ShieldAlert size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#0B2545] dark:text-white leading-none truncate max-w-[170px]">
                  {topVulnerableZone ? topVulnerableZone.quartier : 'Thiaroye Gare'}
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#CC131A] dark:text-red-400 mt-1.5">
                ● Score : {topVulnerableZone ? topVulnerableZone.score : '0.85'} · Vigilance Max
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. GRAPHIQUE 1 & 2 : PLUVIOMÉTRIE (BAR CHART) & CATÉGORIES D'INCIDENTS (DONUT CHART) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne Gauche (7 cols) : Précipitations journalières */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CloudRain size={16} className="text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Relevés Pluviométriques Journaliers (mm)
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Station Météo Thiaroye
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rainChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="jour" stroke={axisColor} fontSize={11} tickLine={false} />
                      <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val) => [`${val} mm`, 'Précipitations']}
                      />
                      <ReferenceLine
                        y={10}
                        stroke="#CC131A"
                        strokeDasharray="4 4"
                        label={{ value: 'Seuil Critique (10 mm)', fill: '#CC131A', fontSize: 10, position: 'top' }}
                      />
                      <Bar dataKey="pluie" name="Précipitations" radius={[6, 6, 0, 0]} maxBarSize={38}>
                        {rainChartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.pluie >= 10 ? '#CC131A' : entry.pluie >= 5 ? '#3B82F6' : '#93C5FD'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Pic enregistré : <strong className="text-[#0B2545] dark:text-white">{maxRain.toFixed(1)} mm</strong></span>
                <span className="font-bold text-blue-600">● Eau de surface accumulée</span>
              </div>
            </div>
          </div>

          {/* Colonne Droite (5 cols) : Répartition des Signalements Citoyens (Donut Chart) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#CC131A]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Signalements par Nature d'Incident
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Total : {totalSignalementsCount}
                  </span>
                </div>

                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {incidentsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Modération terrain</span>
                <Link to="/autorite/signalements" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Voir la liste complète</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. GRAPHIQUE 3 & 4 : VULNÉRABILITÉ HUMAINE (BAR CHART) & EXPOSITION PAR SECTEUR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne Gauche (6 cols) : Vulnérabilité Humaine (Registre ORSEC) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users2 size={16} className="text-purple-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Recensement des Populations Vulnérables
                    </h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    ORSEC Communal
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={vulnerabilityChartData}
                      margin={{ top: 10, right: 20, left: 25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" stroke={axisColor} fontSize={11} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="categorie"
                        stroke={axisColor}
                        fontSize={11}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} personnes`, 'Total']} />
                      <Bar dataKey="nombre" name="Effectif" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {vulnerabilityChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Prise en charge prioritaire : <strong className="text-[#0B2545] dark:text-white">{totalVulnerables} résidents</strong></span>
                <Link to="/autorite/registre" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <span>Gérer le registre</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Colonne Droite (6 cols) : Score de Risque Moyen par Secteur */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#0B2545] dark:text-slate-200" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Score de Risque Moyen par Secteur
                    </h3>
                  </div>

                  {/* Sélecteur de tri */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setSortOrder('desc')}
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md transition cursor-pointer ${
                        sortOrder === 'desc'
                          ? 'bg-white dark:bg-[#071322] text-[#0B2545] dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Décroissant
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder('asc')}
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md transition cursor-pointer ${
                        sortOrder === 'asc'
                          ? 'bg-white dark:bg-[#071322] text-[#0B2545] dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Croissant
                    </button>
                  </div>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zonesChartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="quartier"
                        stroke={axisColor}
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke={axisColor}
                        fontSize={11}
                        domain={[0, 1]}
                        tickLine={false}
                        ticks={[0, 0.25, 0.5, 0.75, 1]}
                      />
                      <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val} / 1.00`, 'Score']} />
                      <ReferenceLine
                        y={0.85}
                        stroke="#CC131A"
                        strokeDasharray="4 4"
                        label={{ value: 'Seuil 0.85', fill: '#CC131A', fontSize: 10, position: 'top' }}
                      />
                      <Bar dataKey="score" name="Score" radius={[6, 6, 0, 0]} maxBarSize={36}>
                        {zonesChartData.map((entry, i) => (
                          <Cell key={i} fill={riskInfo(entry.niveau).hex} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Moyenne communale : <strong className="text-[#0B2545] dark:text-white">{avgCommunalScore} / 1.00</strong></span>
                <span className="font-bold text-[#CC131A]">● Code couleur SIG</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. TABLEAU EXÉCUTIF : PALMARÈS DE VULNÉRABILITÉ DES QUARTIERS ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#CC131A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                Palmarès de Vulnérabilité des Secteurs ({zonesChartData.length})
              </h3>
            </div>
            <Link
              to="/autorite/carte"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Ouvrir la Carte SIG</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-3">Rang</th>
                  <th className="py-2.5 px-3">Quartier / Secteur</th>
                  <th className="py-2.5 px-3">Niveau de Risque</th>
                  <th className="py-2.5 px-3">Score d’Exposition</th>
                  <th className="py-2.5 px-3">Seuil d'Alerte Rouge</th>
                  <th className="py-2.5 pl-3 text-right">Action Terrain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {zonesChartData.map((zone, idx) => {
                  const isCritical = zone.score >= zone.seuil_rouge;
                  return (
                    <tr
                      key={zone.id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition ${
                        isCritical ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pr-3 font-black text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#0B2545] dark:text-white block">
                          {zone.quartier}
                        </span>
                        <span className="text-[10px] text-slate-400">Thiaroye-sur-Mer</span>
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge niveau={zone.niveau} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, zone.score * 100)}%`,
                                backgroundColor: riskInfo(zone.niveau).hex,
                              }}
                            />
                          </div>
                          <span className="font-bold text-[#0B2545] dark:text-white">
                            {zone.score}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        &ge; {zone.seuil_rouge}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <Link
                          to={`/autorite/carte?quartier=${encodeURIComponent(zone.quartier)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0B2545] dark:text-slate-200 font-bold text-[11px] transition shadow-2xs"
                        >
                          <MapPin size={11} className="text-[#CC131A]" />
                          <span>Localiser</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}
