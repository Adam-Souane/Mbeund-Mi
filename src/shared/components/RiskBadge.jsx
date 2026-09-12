// Source unique de vérité pour l'affichage de ZoneRisque.niveau_risque /
// Alerte.niveau (vert/jaune/orange/rouge) partout dans l'app.
export const RISK_LEVELS = {
  vert: { label: 'Faible', hex: '#3C9A5F', bg: 'bg-risk-vert/15', text: 'text-risk-vert' },
  jaune: { label: 'Modéré', hex: '#E3B341', bg: 'bg-risk-jaune/15', text: 'text-risk-jaune' },
  orange: { label: 'Élevé', hex: '#E0792E', bg: 'bg-risk-orange/15', text: 'text-risk-orange' },
  rouge: { label: 'Critique', hex: '#C0182A', bg: 'bg-red-50 dark:bg-red/15', text: 'text-red' },
};

export function riskInfo(niveau) {
  return RISK_LEVELS[niveau] ?? RISK_LEVELS.vert;
}

export default function RiskBadge({ niveau, className = '' }) {
  const { label, bg, text } = riskInfo(niveau);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
}
