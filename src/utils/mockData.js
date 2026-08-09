// Données géographiques et temporelles pour la plateforme MBEUND MI (Thiaroye-sur-Mer, Dakar)

export const THIAROYE_COORDS = {
  lat: 14.7478,
  lng: -17.3789,
  zoom: 14
};

// Index de risque global actuel (ex: 75% - ALERTE TRÈS ÉLEVÉE)
export const CURRENT_RISK = {
  percentage: 75,
  level: "TRÈS ÉLEVÉ",
  color: "#E61C24",
  statusMessage: "Risque fort d'inondation suite aux pluies torrentielles. Pompages actifs à 92%.",
  lastUpdate: "Aujourd'hui à 17h30",
  activeAlertsCount: 4,
  pumpsRunning: 28,
  sensorsOkPercentage: 92,
  pumpsBrokenCount: 2
};

// Zones sensibles & Risques géographiques à Thiaroye-sur-Mer
export const RISK_ZONES = [
  {
    id: "zone-1",
    name: "Thiaroye Gare — Centre",
    riskLevel: "CRITIQUE",
    percentage: 88,
    color: "#E61C24",
    waterDepth: "45 cm",
    populationAtRisk: "14,500 hab.",
    coordinates: [14.7495, -17.3760],
    polygon: [
      [14.7520, -17.3800],
      [14.7535, -17.3730],
      [14.7470, -17.3720],
      [14.7460, -17.3790]
    ],
    description: "Cuvette naturelle avec accumulation rapide des eaux de ruissellement."
  },
  {
    id: "zone-2",
    name: "Tally Diallo",
    riskLevel: "ÉLEVÉ",
    percentage: 76,
    color: "#F97316",
    waterDepth: "30 cm",
    populationAtRisk: "9,800 hab.",
    coordinates: [14.7430, -17.3820],
    polygon: [
      [14.7450, -17.3860],
      [14.7460, -17.3780],
      [14.7400, -17.3790],
      [14.7390, -17.3850]
    ],
    description: "Axe routier majeur fréquemment submergé lors des crues."
  },
  {
    id: "zone-3",
    name: "Guinaw Rails Sud",
    riskLevel: "TRÈS ÉLEVÉ",
    percentage: 82,
    color: "#E61C24",
    waterDepth: "40 cm",
    populationAtRisk: "18,200 hab.",
    coordinates: [14.7550, -17.3850],
    polygon: [
      [14.7580, -17.3900],
      [14.7590, -17.3810],
      [14.7520, -17.3820],
      [14.7510, -17.3890]
    ],
    description: "Zone basse près de la voie ferrée. Évacuation des eaux lente."
  },
  {
    id: "zone-4",
    name: "Thiaroye Sur Mer — Plage Nord",
    riskLevel: "MODÉRÉ",
    percentage: 45,
    color: "#EAB308",
    waterDepth: "12 cm",
    populationAtRisk: "6,400 hab.",
    coordinates: [14.7380, -17.3720],
    polygon: [
      [14.7410, -17.3760],
      [14.7400, -17.3680],
      [14.7350, -17.3690],
      [14.7360, -17.3750]
    ],
    description: "Érosion côtière et hausse temporaire de la nappe phréatique."
  }
];

// Capteurs IoT de niveau d'eau
export const WATER_SENSORS = [
  {
    id: "sens-01",
    name: "Capteur C-01 (Marché Thiaroye)",
    status: "CRITIQUE",
    waterLevel: "48 cm",
    threshold: "40 cm",
    battery: "94%",
    lastSignal: "Il y a 2 min",
    coords: [14.7485, -17.3750]
  },
  {
    id: "sens-02",
    name: "Capteur C-02 (Tally Diallo Nord)",
    status: "ATTENTION",
    waterLevel: "32 cm",
    threshold: "35 cm",
    battery: "88%",
    lastSignal: "Il y a 5 min",
    coords: [14.7445, -17.3810]
  },
  {
    id: "sens-03",
    name: "Capteur C-03 (Sous-préfet Thiaroye)",
    status: "NORMAL",
    waterLevel: "14 cm",
    threshold: "30 cm",
    battery: "99%",
    lastSignal: "Il y a 1 min",
    coords: [14.7510, -17.3780]
  },
  {
    id: "sens-04",
    name: "Capteur C-04 (Guinaw Rails)",
    status: "CRITIQUE",
    waterLevel: "42 cm",
    threshold: "38 cm",
    battery: "76%",
    lastSignal: "Il y a 3 min",
    coords: [14.7560, -17.3840]
  }
];

// Stations de pompage
export const PUMP_STATIONS = [
  { id: "P-01", name: "Station Pompage Thiaroye Gare", capacity: "1200 m³/h", status: "EN SERVICE", flowRate: "95%", coords: [14.7490, -17.3770] },
  { id: "P-02", name: "Motopompe Haute Pression Tally Diallo", capacity: "800 m³/h", status: "EN SERVICE", flowRate: "88%", coords: [14.7435, -17.3830] },
  { id: "P-03", name: "Station Bassin Guinaw Rails", capacity: "1500 m³/h", status: "EN SERVICE", flowRate: "100%", coords: [14.7570, -17.3860] },
  { id: "P-04", name: "Pompe Auxiliaire Plage Nord", capacity: "600 m³/h", status: "MAINTENANCE", flowRate: "0%", coords: [14.7375, -17.3730] }
];

// Signalements Citoyens (Terrain)
export const CITIZEN_REPORTS = [
  {
    id: "REP-2026-081",
    author: "Amadou Diallo",
    location: "Rue Diamaguene, Thiaroye Gare",
    waterDepth: "Niveau au-dessus des genoux (~50 cm)",
    timestamp: "Aujourd'hui à 16:45",
    status: "VALIDÉ",
    severity: "ÉLEVÉE",
    description: "Eau stagnante bloquant l'accès aux maisons et au commerce local. Besoin urgent d'une motopompe.",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
    coords: [14.7482, -17.3755],
    likes: 24,
    comments: 8
  },
  {
    id: "REP-2026-082",
    author: "Fatou Sow",
    location: "Poste de Santé — Tally Diallo",
    waterDepth: "Infiltration dans la cour (~25 cm)",
    timestamp: "Aujourd'hui à 15:20",
    status: "EN COURS",
    severity: "MOYENNE",
    description: "Le caniveau central est obstrué par des déchets. L'eau monte lentement vers la pharmacie.",
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
    coords: [14.7428, -17.3815],
    likes: 19,
    comments: 5
  },
  {
    id: "REP-2026-083",
    author: "Moussa Ndiaye",
    location: "Route Nationale N1 (Échangeur)",
    waterDepth: "Submersion chaussée (~35 cm)",
    timestamp: "Aujourd'hui à 14:10",
    status: "VALIDÉ",
    severity: "ÉLEVÉE",
    description: "Embouteillage monstre dû à une cuvette d'eau. Plusieurs véhicules légers coincés.",
    image: "https://images.unsplash.com/photo-1516900557549-41557d405daf?auto=format&fit=crop&w=600&q=80",
    coords: [14.7505, -17.3802],
    likes: 42,
    comments: 12
  },
  {
    id: "REP-2026-084",
    author: "Awa Seck",
    location: "Quartier Plage Nord",
    waterDepth: "Eau de pluie accumulée (~15 cm)",
    timestamp: "Hier à 19:30",
    status: "RÉSOLU",
    severity: "FAIBLE",
    description: "Pompage effectué avec succès par l'équipe municipale.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
    coords: [14.7390, -17.3710],
    likes: 15,
    comments: 2
  }
];

// Données Historiques des Précipitations et Pompage (Graphiques Recharts)
export const RAINFALL_HISTORY = [
  { time: "08:00", pluie: 5, niveauEau: 10, pompage: 20 },
  { time: "10:00", pluie: 18, niveauEau: 22, pompage: 45 },
  { time: "12:00", pluie: 45, niveauEau: 48, pompage: 85 },
  { time: "14:00", pluie: 62, niveauEau: 65, pompage: 98 },
  { time: "16:00", pluie: 38, niveauEau: 52, pompage: 92 },
  { time: "18:00", pluie: 15, niveauEau: 35, pompage: 75 }
];

export const FORECAST_7DAYS = [
  { day: "Aujourd'hui", temp: "28°C", rainProb: "90%", rainMm: "52 mm", risk: "TRÈS ÉLEVÉ", icon: "cloud-rain" },
  { day: "Demain", temp: "29°C", rainProb: "75%", rainMm: "30 mm", risk: "ÉLEVÉ", icon: "cloud-drizzle" },
  { day: "Mardi", temp: "30°C", rainProb: "40%", rainMm: "12 mm", risk: "MODÉRÉ", icon: "cloud-sun" },
  { day: "Mercredi", temp: "31°C", rainProb: "20%", rainMm: "2 mm", risk: "FAIBLE", icon: "sun" },
  { day: "Jeudi", temp: "30°C", rainProb: "15%", rainMm: "0 mm", risk: "FAIBLE", icon: "sun" },
  { day: "Vendredi", temp: "29°C", rainProb: "60%", rainMm: "22 mm", risk: "MODÉRÉ", icon: "cloud-rain" },
  { day: "Samedi", temp: "28°C", rainProb: "85%", rainMm: "45 mm", risk: "TRÈS ÉLEVÉ", icon: "cloud-lightning" }
];

// Contacts d'urgence & Numéros d'aide
export const EMERGENCY_CONTACTS = [
  { title: "Sapeurs-Pompiers (Dakar / Thiaroye)", phone: "18", secondary: "+221 33 823 00 00", desc: "Intervention rapide et secours d'urgence" },
  { title: "Comité de Vigilance Inondations Thiaroye", phone: "+221 77 654 32 10", secondary: "Permanence 24/7", desc: "Signalement rapide et coordination locale" },
  { title: "Mairie de Thiaroye-sur-Mer (Service Technique)", phone: "+221 33 834 12 34", secondary: "Horaires de bureau", desc: "Informations motopompes et abris temporaires" },
  { title: "SAMU National (Assistance Médicale)", phone: "15", secondary: "+221 33 869 40 40", desc: "Urgences médicales et évacuations" }
];
