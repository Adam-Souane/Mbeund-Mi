import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { riskInfo } from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useHistoriqueRisque } from '../../shared/hooks/useHistoriqueRisque';

const NIVEAUX_ORDRE = ['vert', 'jaune', 'orange', 'rouge'];

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function StatistiquesPage() {
  const { darkMode } = useTheme();
  const { data: zonesData } = useZones();
  const { data: alertesData } = useAlertesRecentes();
  const { data: historiqueData } = useHistoriqueRisque();

  const gridColor = darkMode ? '#2E4460' : '#EBF0F5';
  const axisColor = darkMode ? '#8AA0B8' : '#4A6480';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1B2A40' : '#FFFFFF',
    borderColor: darkMode ? '#2E4460' : '#EBF0F5',
    borderRadius: 8,
    fontSize: 12,
  };

  const zonesChartData =
    zonesData?.features?.map((f) => ({
      quartier: f.properties.quartier,
      score: Number(f.properties.score_risque_moyen ?? 0),
      niveau: f.properties.niveau_risque,
    })) ?? [];

  const alertesParNiveau = NIVEAUX_ORDRE.map((niveau) => ({
    niveau,
    label: riskInfo(niveau).label,
    count: alertesData?.results?.filter((a) => a.niveau === niveau).length ?? 0,
  }));

  const historiqueChartData =
    historiqueData?.results
      ?.slice()
      .reverse()
      .map((h) => ({
        date: formatDateShort(h.date_calcul),
        score: Number(h.score_risque ?? 0),
        type: h.type_cible,
      })) ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Statistiques</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">Thiaroye-sur-Mer · Vue d’ensemble des indicateurs de risque</p>
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={15} />
          Score de risque moyen par zone
        </h3>
        {zonesChartData.length === 0 ? (
          <p className="text-sm text-navy-400">Aucune zone enregistrée pour l’instant.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zonesChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="quartier" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} domain={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" name="Score de risque" radius={[4, 4, 0, 0]}>
                  {zonesChartData.map((entry, i) => (
                    <Cell key={i} fill={riskInfo(entry.niveau).hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <h3 className="text-base font-bold mb-4">Alertes par niveau</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertesParNiveau} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Alertes" radius={[4, 4, 0, 0]}>
                  {alertesParNiveau.map((entry, i) => (
                    <Cell key={i} fill={riskInfo(entry.niveau).hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <h3 className="text-base font-bold mb-4">Historique du score de risque</h3>
          {historiqueChartData.length === 0 ? (
            <p className="text-sm text-navy-400">Aucun historique enregistré pour l’instant.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historiqueChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} domain={[0, 1]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" name="Score de risque" stroke="#C0182A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AutoriteShell>
  );
}
