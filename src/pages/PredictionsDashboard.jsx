import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './PredictionsDashboard.css';

const COLORS = {
  vert: '#28a745',
  jaune: '#ffc107',
  orange: '#fd7e14',
  rouge: '#dc3545'
};

const LEVEL_LABELS = {
  vert: '🟢 Vert - Risque Faible',
  jaune: '🟡 Jaune - Risque Moyen',
  orange: '🟠 Orange - Risque Élevé',
  rouge: '🔴 Rouge - Risque Critique'
};

export default function PredictionsDashboard() {
  const [zones, setZones] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Récupérer les données toutes les 5 minutes
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Récupérer zones
      const zonesRes = await fetch('/api/zones-risque/');
      const zonesData = await zonesRes.json();
      setZones(zonesData);

      // Récupérer météo
      const weatherRes = await fetch('/api/previsions-meteo/');
      const weatherDataResponse = await weatherRes.json();
      if (weatherDataResponse.results) {
        setWeatherData(weatherDataResponse.results[0]);
      }

      // Récupérer historique (derniers 7 jours)
      const historicalRes = await fetch('/api/alertes/?limit=30');
      const historicalDataResponse = await historicalRes.json();
      if (historicalDataResponse.results) {
        setHistoricalData(historicalDataResponse.results);
      }

      setLastUpdate(new Date());
    } catch (error) {
      if (import.meta.env.DEV) console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStats = () => {
    const stats = {
      vert: 0,
      jaune: 0,
      orange: 0,
      rouge: 0
    };
    zones.forEach(zone => {
      stats[zone.niveau_risque] = (stats[zone.niveau_risque] || 0) + 1;
    });
    return Object.entries(stats).map(([level, count]) => ({
      name: LEVEL_LABELS[level],
      value: count,
      color: COLORS[level]
    }));
  };

  const getZoneScores = () => {
    return zones.map(zone => ({
      name: zone.quartier,
      score: parseFloat(zone.score_risque_moyen) || 0,
      niveau: zone.niveau_risque
    }));
  };

  const getAlertsTimeline = () => {
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last7Days[key] = 0;
    }

    historicalData.forEach(alert => {
      const date = alert.timestamp.split('T')[0];
      if (date in last7Days) {
        last7Days[date]++;
      }
    });

    return Object.entries(last7Days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      alertes: count
    }));
  };

  if (loading) {
    return <div className="dashboard loading">Chargement des données...</div>;
  }

  return (
    <div className="predictions-dashboard">
      <header className="dashboard-header">
        <h1>📊 Dashboard Prédictions Inondations</h1>
        <p className="last-update">
          Dernière mise à jour: {lastUpdate?.toLocaleTimeString('fr-FR')}
        </p>
      </header>

      <div className="dashboard-grid">
        {/* Statistiques générales */}
        <section className="stats-section">
          <h2>État des Zones</h2>
          <div className="stats-container">
            {getRiskStats().map((stat, idx) => (
              <div key={idx} className="stat-card" style={{ borderLeftColor: stat.color }}>
                <div className="stat-label">{stat.name}</div>
                <div className="stat-value" style={{ color: stat.color }}>
                  {stat.value} zone{stat.value > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Graphique des scores */}
        <section className="chart-section">
          <h2>Scores de Risque par Zone</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getZoneScores()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {getZoneScores().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.niveau]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Historique des alertes */}
        <section className="chart-section">
          <h2>Alertes (7 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getAlertsTimeline()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="alertes" stroke="#dc3545" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Distribution des risques */}
        <section className="chart-section">
          <h2>Distribution des Niveaux</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getRiskStats()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getRiskStats().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Données météo */}
        {weatherData && (
          <section className="weather-section">
            <h2>🌤️ Conditions Météo</h2>
            <div className="weather-grid">
              <div className="weather-card">
                <span className="weather-label">Pluie 24h</span>
                <span className="weather-value">{weatherData.precipitation_mm}mm</span>
              </div>
              <div className="weather-card">
                <span className="weather-label">Température</span>
                <span className="weather-value">{weatherData.temperature_c}°C</span>
              </div>
              <div className="weather-card">
                <span className="weather-label">Humidité</span>
                <span className="weather-value">{weatherData.humidity_percent}%</span>
              </div>
              <div className="weather-card">
                <span className="weather-label">Source</span>
                <span className="weather-value">{weatherData.source}</span>
              </div>
            </div>
          </section>
        )}

        {/* Tableau des zones */}
        <section className="zones-section full-width">
          <h2>Détail des Zones</h2>
          <table className="zones-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Niveau Risque</th>
                <th>Score</th>
                <th>Seuil Jaune</th>
                <th>Seuil Orange</th>
                <th>Seuil Rouge</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone.id} className={`level-${zone.niveau_risque}`}>
                  <td>{zone.quartier}</td>
                  <td>
                    <span className={`badge level-${zone.niveau_risque}`}>
                      {LEVEL_LABELS[zone.niveau_risque]}
                    </span>
                  </td>
                  <td>{(parseFloat(zone.score_risque_moyen) * 100).toFixed(1)}%</td>
                  <td>{(parseFloat(zone.seuil_jaune) * 100).toFixed(0)}%</td>
                  <td>{(parseFloat(zone.seuil_orange) * 100).toFixed(0)}%</td>
                  <td>{(parseFloat(zone.seuil_rouge) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
