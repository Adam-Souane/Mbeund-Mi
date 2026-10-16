import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type ZoneRisque = {
  id: number;
  quartier: string;
  niveau_risque: 'vert' | 'jaune' | 'orange' | 'rouge';
  description?: string;
  score_risque_moyen?: number;
};

type Alerte = {
  id: number;
  niveau_gravite?: string;
  niveau?: string;
  message: string;
  date_creation?: string;
  timestamp?: string;
  zone?: {
    quartier?: string;
  };
};

type Prevision = {
  id: number;
  date_prevision?: string;
  temperature?: number;
  temperature_c?: number;
  temperature_max_c?: number;
  temperature_min_c?: number;
  precipitation?: number;
  precipitation_mm?: number;
  vitesse_vent?: number;
  description?: string;
  weather_code?: number;
};

const getDisplayTemp = (p?: Prevision | null): string => {
  if (!p) return '29°C';
  if (p.temperature_max_c != null) {
    return `${Math.round(Number(p.temperature_max_c))}°C`;
  }
  if (p.temperature_c != null) return `${Math.round(Number(p.temperature_c))}°C`;
  if (p.temperature != null) return `${Math.round(Number(p.temperature))}°C`;
  return '29°C';
};

const getDisplayUpcomingTemp = (p: Prevision): string => {
  if (p.temperature_max_c != null) return `${Math.round(Number(p.temperature_max_c))}°`;
  if (p.temperature_c != null) return `${Math.round(Number(p.temperature_c))}°`;
  if (p.temperature != null) return `${Math.round(Number(p.temperature))}°`;
  return '29°';
};

const getDisplayPrecip = (p?: Prevision | null): string => {
  if (!p) return '0.0 mm';
  const val = p.precipitation_mm ?? p.precipitation ?? 0;
  return `${Number(val).toFixed(1)} mm`;
};

const getDisplayVent = (p?: Prevision | null): string => {
  if (!p) return '15 km/h';
  const val = p.vitesse_vent ?? 15;
  return `${Math.round(Number(val))} km/h`;
};

const COULEURS_RISQUE = {
  vert: { bg: '#DCFCE7', text: '#166534', border: '#22C55E', label: 'Faible', hex: '#22C55E' },
  jaune: { bg: '#FEF9C3', text: '#854D0E', border: '#EAB308', label: 'Modéré', hex: '#EAB308' },
  orange: { bg: '#FFEDD5', text: '#9A3412', border: '#F97316', label: 'Élevé', hex: '#F97316' },
  rouge: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', label: 'Critique', hex: '#C0182A' },
};

type SignalementItem = {
  id: number;
  description?: string;
  categorie?: string;
  categorie_display?: string;
  date_creation?: string;
  valide?: boolean;
  niveau_eau_estime?: string;
  niveau_eau_display?: string;
  zone?: { quartier?: string };
  quartier?: string;
};

const CONSEILS_DATA = [
  {
    id: 1,
    titre: 'Avant les fortes pluies',
    categorie: 'Prévention',
    description: 'Dégagez les rigoles et caniveaux devant chez vous pour fluidifier l\'évacuation.',
    iconName: 'droplet' as const,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    id: 2,
    titre: 'Sécurité électrique',
    categorie: 'Sécurité',
    description: 'En cas de montée des eaux, coupez le disjoncteur général sans attendre.',
    iconName: 'zap' as const,
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 3,
    titre: 'Kit de survie 72h',
    categorie: 'Urgences',
    description: 'Eau potable, torche, médicaments et papiers protégés dans du plastique étanche.',
    iconName: 'shield' as const,
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    id: 4,
    titre: 'Numéro d\'urgence : 18',
    categorie: 'Alerte rapide',
    description: 'Alertez les sapeurs-pompiers (18) ou le SAMU (1515) dès que le niveau dépasse 30 cm.',
    iconName: 'phone-call' as const,
    color: '#C0182A',
    bg: '#FEF2F2',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { username, token, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [topZone, setTopZone] = useState<ZoneRisque | null>(null);
  const [previsions, setPrevisions] = useState<Prevision[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [mesSignalements, setMesSignalements] = useState<SignalementItem[]>([]);
  const [communaute, setCommunaute] = useState<SignalementItem[]>([]);
  const [upvotes, setUpvotes] = useState<Record<number, number>>({});
  const [userUpvoted, setUserUpvoted] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toggleUpvote = (id: number) => {
    const hasVoted = !!userUpvoted[id];
    const currentCount = upvotes[id] ?? ((id % 4) + 2);
    const newCount = hasVoted ? Math.max(0, currentCount - 1) : currentCount + 1;
    setUpvotes((prev) => ({ ...prev, [id]: newCount }));
    setUserUpvoted((prev) => ({ ...prev, [id]: !hasVoted }));
  };

  const chargerDonnees = async () => {
    try {
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const [resZones, resAlertes, resPrev, resMesSig, resSig] = await Promise.allSettled([
        axios.get(`${API_URL}/zones/`, authHeaders),
        axios.get(`${API_URL}/alertes/`, authHeaders),
        axios.get(`${API_URL}/previsions/`, authHeaders),
        token ? axios.get(`${API_URL}/mes-signalements/`, authHeaders) : Promise.reject('No token'),
        axios.get(`${API_URL}/signalements/`, authHeaders),
      ]);

      // 1. Zones à risque
      if (resZones.status === 'fulfilled') {
        const feats = resZones.value.data?.features || [];
        if (feats.length > 0) {
          const sorted = [...feats].sort((a, b) => {
            const scoreA = Number(a.properties?.score_risque_moyen || 0);
            const scoreB = Number(b.properties?.score_risque_moyen || 0);
            return scoreB - scoreA;
          });
          const best = sorted[0];
          setTopZone({ id: best.id, ...best.properties });
        }
      }

      // 2. Alertes récentes (3 dernières)
      if (resAlertes.status === 'fulfilled') {
        const list = resAlertes.value.data?.results || resAlertes.value.data || [];
        setAlertes(Array.isArray(list) ? list.slice(0, 3) : []);
      }

      // 3. Prévisions météo
      if (resPrev.status === 'fulfilled') {
        const prevList = resPrev.value.data?.results || resPrev.value.data || [];
        if (Array.isArray(prevList)) {
          setPrevisions(prevList);
        }
      }

      // 4. Mes signalements
      if (resMesSig.status === 'fulfilled') {
        const mySigList = resMesSig.value.data?.results || resMesSig.value.data || [];
        if (Array.isArray(mySigList)) {
          setMesSignalements(mySigList.slice(0, 3));
        }
      }

      // 5. Fil communautaire
      if (resSig.status === 'fulfilled') {
        const sigList = resSig.value.data?.results || resSig.value.data || [];
        if (Array.isArray(sigList)) {
          setCommunaute(sigList.slice(0, 4));
        }
      }
    } catch (e) {
      console.error('Erreur chargement données accueil:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    chargerDonnees();
  };

  const niveauZone = (topZone?.niveau_risque || 'vert').toLowerCase() as keyof typeof COULEURS_RISQUE;
  const themeRisque = COULEURS_RISQUE[niveauZone] || COULEURS_RISQUE.vert;
  const currentPrevision = previsions[0] || null;
  const upcomingPrevisions = previsions.slice(1);

  const callEmergency = () => {
    Linking.openURL('tel:18');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* En-tête Citoyen avec toggle Mode Sombre / Mode Clair */}
        <View style={styles.topBar}>
          <View style={styles.flex}>
            <Text style={[styles.hello, { color: colors.text }]}>Bonjour {username || 'Citoyen'}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={colors.textMuted} />
              <Text style={[styles.zoneText, { color: colors.textMuted }]}>{topZone?.quartier || 'Thiaroye-sur-Mer'}</Text>
            </View>
          </View>
          <View style={styles.topBarActions}>
            <View style={[styles.commuHeaderPill, { backgroundColor: isDark ? '#1E3A8A33' : '#EFF6FF', borderColor: isDark ? '#1E40AF' : '#BFDBFE' }]}>
              <View style={styles.pulseDot} />
              <Text style={[styles.commuHeaderPillText, { color: isDark ? '#93C5FD' : '#2563EB' }]}>Entraide active</Text>
            </View>
            <Pressable
              onPress={toggleTheme}
              style={[
                styles.themeToggleIconBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : Brand.navy[100],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
              <Feather
                name={isDark ? 'sun' : 'moon'}
                size={16}
                color={isDark ? '#FACC15' : Brand.navy.DEFAULT}
              />
            </Pressable>
          </View>
        </View>

        {/* Bannière de Risque Majeure (Inversion Mbeund-Mi : Bleu en clair, Blanc en sombre) */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor:
                niveauZone === 'rouge'
                  ? '#C0182A'
                  : isDark
                  ? '#FFFFFF'
                  : '#1B2A40',
              borderColor: isDark ? '#FFFFFF' : Brand.navy[900],
            },
          ]}>
          <View style={styles.heroTop}>
            <View style={styles.heroPill}>
              <View
                style={[
                  styles.heroDot,
                  { backgroundColor: niveauZone === 'rouge' ? '#FFFFFF' : themeRisque.hex },
                ]}
              />
              <Text
                style={[
                  styles.heroPillText,
                  { color: isDark && niveauZone !== 'rouge' ? Brand.navy.DEFAULT : '#ffffff' },
                ]}>
                Votre zone
              </Text>
            </View>
            <View
              style={[
                styles.riskTag,
                {
                  backgroundColor: themeRisque.bg,
                  borderWidth: 1,
                  borderColor: themeRisque.border,
                },
              ]}>
              <View
                style={[
                  styles.heroDot,
                  { backgroundColor: themeRisque.hex, marginRight: 6 },
                ]}
              />
              <Text
                style={[
                  styles.riskTagText,
                  { color: themeRisque.text },
                ]}>
                Risque {niveauZone.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.heroTitle,
              { color: isDark && niveauZone !== 'rouge' ? Brand.navy.DEFAULT : '#ffffff' },
            ]}>
            {topZone?.quartier ? `Quartier ${topZone.quartier}` : 'Thiaroye-sur-Mer'}
          </Text>
          <Text
            style={[
              styles.heroSub,
              {
                color:
                  isDark && niveauZone !== 'rouge'
                    ? Brand.navy[700]
                    : 'rgba(255,255,255,0.9)',
              },
            ]}>
            {topZone?.description ||
              "Restez informé de l'évolution de la situation hydrologique dans votre quartier."}
          </Text>
        </View>

        {/* 4 Cartes d'Accès Rapides (Surfaces en bleu Mbeund-Mi en mode sombre) */}
        <View style={styles.quickGrid}>
          {/* 1. Signaler */}
          <Pressable
            onPress={() => router.push('/signaler')}
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <View
              style={[
                styles.quickIconCircle,
                { backgroundColor: isDark ? Brand.navy[900] : '#FEE2E2' },
              ]}>
              <Feather name="camera" size={18} color={Brand.red.DEFAULT} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Signaler</Text>
          </Pressable>

          {/* 2. Carte */}
          <Pressable
            onPress={() => router.push('/carte')}
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <View
              style={[
                styles.quickIconCircle,
                { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] },
              ]}>
              <Feather name="map" size={18} color={isDark ? '#FFFFFF' : Brand.navy.DEFAULT} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Carte</Text>
          </Pressable>

          {/* 3. Prévisions */}
          <Pressable
            onPress={() => router.push('/alertes')}
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <View
              style={[
                styles.quickIconCircle,
                { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] },
              ]}>
              <Feather
                name="cloud-rain"
                size={18}
                color={isDark ? '#FFFFFF' : Brand.navy.DEFAULT}
              />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Prévisions</Text>
          </Pressable>

          {/* 4. Urgence 18 */}
          <Pressable
            onPress={callEmergency}
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <View
              style={[
                styles.quickIconCircle,
                { backgroundColor: isDark ? Brand.navy[900] : '#FEE2E2' },
              ]}>
              <Feather name="phone-call" size={18} color={Brand.red.DEFAULT} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Urgence 18</Text>
          </Pressable>
        </View>

        {/* Carrousel de conseils & prévention */}
        <View style={styles.sectionMargin}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bons réflexes & Prévention</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Gestes qui sauvent</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conseilsScroll}>
            {CONSEILS_DATA.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.conseilCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View style={styles.conseilCardHeader}>
                  <View style={[styles.conseilIconBox, { backgroundColor: c.bg }]}>
                    <Feather name={c.iconName} size={18} color={c.color} />
                  </View>
                  <View style={[styles.conseilPill, { backgroundColor: `${c.color}15` }]}>
                    <Text style={[styles.conseilPillText, { color: c.color }]}>{c.categorie}</Text>
                  </View>
                </View>
                <Text style={[styles.conseilTitle, { color: colors.text }]}>{c.titre}</Text>
                <Text style={[styles.conseilDesc, { color: colors.textMuted }]} numberOfLines={3}>
                  {c.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Mes Signalements Citoyen */}
        <View style={[styles.blockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.blockCardHeader}>
            <View style={styles.blockCardTitleRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: isDark ? Brand.navy[900] : '#FEE2E2' }]}>
                <Feather name="clock" size={15} color={Brand.red.DEFAULT} />
              </View>
              <View>
                <Text style={[styles.blockTitle, { color: colors.text }]}>Mes signalements</Text>
                <Text style={[styles.blockSub, { color: colors.textMuted }]}>Suivi direct de vos alertes</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/signaler')}>
              <Text style={styles.seeAllText}>+ Nouveau</Text>
            </Pressable>
          </View>

          {mesSignalements.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] }]}>
              <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
                Vous n'avez aucun signalement en cours.
              </Text>
              <Pressable
                onPress={() => router.push('/signaler')}
                style={styles.emptyActionBtn}>
                <Feather name="camera" size={13} color="#FFFFFF" />
                <Text style={styles.emptyActionText}>Signaler une inondation</Text>
              </Pressable>
            </View>
          ) : (
            mesSignalements.map((s) => (
              <View key={s.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.flex}>
                  <View style={styles.itemTitleRow}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {s.categorie_display || s.categorie || 'Inondation'}
                    </Text>
                    {s.niveau_eau_display && s.niveau_eau_display !== 'Indéterminé' && (
                      <View style={[styles.waterTag, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
                        <Text style={[styles.waterTagText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                          Eau : {s.niveau_eau_display}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.itemDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {s.description || 'Signalement transmis par vos soins.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: s.valide ? '#DCFCE7' : '#FEF9C3' },
                  ]}>
                  <Feather
                    name={s.valide ? 'check-circle' : 'clock'}
                    size={11}
                    color={s.valide ? '#166534' : '#854D0E'}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: s.valide ? '#166534' : '#854D0E' },
                    ]}>
                    {s.valide ? 'Validé' : 'En examen'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Fil Communautaire de Quartier */}
        <View style={[styles.blockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.blockCardHeader}>
            <View style={styles.blockCardTitleRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: isDark ? Brand.navy[900] : '#DBEAFE' }]}>
                <Feather name="users" size={15} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.blockTitle, { color: colors.text }]}>Entraide Quartier</Text>
                <Text style={[styles.blockSub, { color: colors.textMuted }]}>Confirmez les signalements voisins</Text>
              </View>
            </View>
          </View>

          {communaute.length === 0 ? (
            <Text style={[styles.emptyAlertsText, { color: colors.textMuted }]}>
              Aucun incident signalé dans le quartier pour l'instant.
            </Text>
          ) : (
            communaute.map((item) => {
              const count = upvotes[item.id] ?? ((item.id % 4) + 2);
              const hasVoted = !!userUpvoted[item.id];
              const isPrioritaire = count >= 4;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.commuCard,
                    {
                      backgroundColor: isPrioritaire
                        ? isDark ? '#451A03' : '#FFFBEB'
                        : isDark ? Brand.navy[900] : Brand.navy[50],
                      borderColor: isPrioritaire
                        ? '#F59E0B'
                        : isDark ? Brand.navy[800] : Brand.navy[100],
                    },
                  ]}>
                  <View style={styles.commuCardTop}>
                    <View style={styles.locationPill}>
                      <Feather name="map-pin" size={11} color={Brand.red.DEFAULT} />
                      <Text style={[styles.commuLocationText, { color: colors.text }]}>
                        {item.zone?.quartier || item.quartier || 'Thiaroye-sur-Mer'}
                      </Text>
                    </View>
                    {isPrioritaire && (
                      <View style={styles.prioritaireBadge}>
                        <Feather name="alert-triangle" size={10} color="#B45309" />
                        <Text style={styles.prioritaireText}>Prioritaire</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.commuDesc, { color: colors.text }]} numberOfLines={2}>
                    {item.description || `Signalement ${item.categorie || 'inondation'}`}
                  </Text>

                  <View style={styles.commuBottom}>
                    <Text style={[styles.commuDate, { color: colors.textMuted }]}>
                      {item.date_creation
                        ? new Date(item.date_creation).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Récent'}
                    </Text>

                    <Pressable
                      onPress={() => toggleUpvote(item.id)}
                      style={[
                        styles.upvoteBtn,
                        {
                          backgroundColor: hasVoted
                            ? '#2563EB'
                            : isDark ? Brand.navy[800] : '#FFFFFF',
                          borderColor: hasVoted
                            ? '#2563EB'
                            : Brand.navy[200],
                        },
                      ]}>
                      <Feather
                        name="thumbs-up"
                        size={12}
                        color={hasVoted ? '#FFFFFF' : (isDark ? '#F1F5F9' : Brand.navy.DEFAULT)}
                      />
                      <Text
                        style={[
                          styles.upvoteText,
                          { color: hasVoted ? '#FFFFFF' : (isDark ? '#F1F5F9' : Brand.navy.DEFAULT) },
                        ]}>
                        {hasVoted ? 'Confirmé' : 'Vu aussi'} ({count})
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Widget Météo (WeatherWidget du Web) */}
        <View style={[styles.weatherCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.weatherHeader}>
            <View style={styles.weatherHeaderLeft}>
              <Feather name="cloud-rain" size={16} color={isDark ? '#93C5FD' : Brand.navy.DEFAULT} />
              <Text style={[styles.weatherTitle, { color: colors.text }]}>Météo — Thiaroye-sur-Mer</Text>
            </View>
          </View>

          {currentPrevision ? (
            <>
              <View style={styles.weatherCurrentRow}>
                <View style={styles.weatherTempCol}>
                  <View style={styles.weatherTempIcon}>
                    <Feather name="cloud-drizzle" size={26} color={isDark ? '#93C5FD' : Brand.navy.DEFAULT} />
                  </View>
                  <Text style={[styles.weatherTempValue, { color: colors.text }]}>
                    {getDisplayTemp(currentPrevision)}
                  </Text>
                </View>

                <View style={[styles.weatherStatsBox, { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] }]}>
                  <View style={styles.weatherStatItem}>
                    <Text style={[styles.weatherStatLabel, { color: colors.textMuted }]}>Précipitations</Text>
                    <Text style={[styles.weatherStatVal, { color: colors.text }]}>
                      {getDisplayPrecip(currentPrevision)}
                    </Text>
                  </View>
                  <View style={styles.weatherStatItem}>
                    <Text style={[styles.weatherStatLabel, { color: colors.textMuted }]}>Vent</Text>
                    <Text style={[styles.weatherStatVal, { color: colors.text }]}>
                      {getDisplayVent(currentPrevision)}
                    </Text>
                  </View>
                </View>
              </View>

              {upcomingPrevisions.length > 0 && (
                <View style={styles.upcomingBox}>
                  <Text style={[styles.upcomingTitle, { color: colors.textMuted }]}>Prochaines prévisions (7 jours) :</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.upcomingScroll}>
                    {upcomingPrevisions.map((item, idx) => (
                      <View key={idx} style={[styles.upcomingItem, { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] }]}>
                        <Text style={[styles.upcomingDay, { color: colors.textMuted }]}>
                          {item.date_prevision
                            ? new Date(item.date_prevision).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                              })
                            : `J+${idx + 1}`}
                        </Text>
                        <Feather name="cloud" size={14} color={isDark ? '#FFFFFF' : Brand.navy[400]} />
                        <Text style={[styles.upcomingTemp, { color: colors.text }]}>
                          {getDisplayUpcomingTemp(item)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.emptyWeatherText, { color: colors.textMuted }]}>Aucune prévision météo disponible.</Text>
          )}
        </View>

        {/* Alertes Récentes (Identique au Web AccueilPageBody) */}
        <View style={[styles.alertesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.alertesHeader}>
            <Text style={[styles.alertesTitle, { color: colors.text }]}>Alertes récentes</Text>
            <Pressable onPress={() => router.push('/alertes')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </Pressable>
          </View>

          {alertes.length === 0 ? (
            <Text style={[styles.emptyAlertsText, { color: colors.textMuted }]}>Aucune alerte pour l'instant.</Text>
          ) : (
            alertes.map((a) => {
              const niv = ((a.niveau || a.niveau_gravite || 'jaune') as string).toLowerCase();
              const badgeTheme = COULEURS_RISQUE[niv as keyof typeof COULEURS_RISQUE] || COULEURS_RISQUE.jaune;
              return (
                <View key={a.id} style={styles.alerteRow}>
                  <View style={[styles.badgeAlerte, { backgroundColor: badgeTheme.bg }]}>
                    <Text style={[styles.badgeAlerteText, { color: badgeTheme.text }]}>
                      {niv.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.alerteZone, { color: colors.text }]}>
                      {a.zone?.quartier || 'Zone Thiaroye'}
                    </Text>
                    <Text style={[styles.alerteMessage, { color: colors.textMuted }]} numberOfLines={2}>
                      {a.message}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  hello: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  zoneText: { fontSize: 12, fontWeight: '600', color: Brand.navy[500] },

  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commuHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  commuHeaderPillText: { fontSize: 10, fontWeight: '800' },
  themeToggleIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Shadow.card,
  },

  heroCard: {
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 16,
    ...Shadow.card,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 7, height: 7, borderRadius: 3.5 },
  heroPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  riskTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
  },
  riskTagText: { fontSize: 10.5, fontWeight: '800' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 17 },

  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    ...Shadow.card,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: Brand.navy.DEFAULT },

  weatherCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    padding: 16,
    marginBottom: 16,
    ...Shadow.card,
  },
  weatherHeader: { borderBottomWidth: 1, borderBottomColor: Brand.navy[50], paddingBottom: 10 },
  weatherHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherTitle: { fontSize: 13, fontWeight: '700', color: Brand.navy.DEFAULT },

  weatherCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  weatherTempCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTempIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Brand.navy[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTempValue: { fontSize: 24, fontWeight: '800', color: Brand.navy.DEFAULT },

  weatherStatsBox: {
    backgroundColor: Brand.navy[50],
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    minWidth: 130,
  },
  weatherStatItem: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherStatLabel: { fontSize: 11, color: Brand.navy[500] },
  weatherStatVal: { fontSize: 11, fontWeight: '700', color: Brand.navy.DEFAULT },

  upcomingBox: {
    borderTopWidth: 1,
    borderTopColor: Brand.navy[50],
    paddingTop: 10,
  },
  upcomingTitle: { fontSize: 11, color: Brand.navy[400], fontWeight: '600', marginBottom: 6 },
  upcomingScroll: { flexDirection: 'row' },
  upcomingItem: {
    alignItems: 'center',
    backgroundColor: Brand.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginRight: 6,
    gap: 4,
  },
  upcomingDay: { fontSize: 10, fontWeight: '700', color: Brand.navy[500], textTransform: 'uppercase' },
  upcomingTemp: { fontSize: 11, fontWeight: '700', color: Brand.navy.DEFAULT },
  emptyWeatherText: { fontSize: 12, color: Brand.navy[400], paddingVertical: 12, textAlign: 'center' },

  alertesCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    padding: 16,
    ...Shadow.card,
  },
  alertesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertesTitle: { fontSize: 13, fontWeight: '700', color: Brand.navy.DEFAULT },
  seeAllText: { fontSize: 12, fontWeight: '700', color: Brand.red.DEFAULT },

  alerteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Brand.navy[50],
  },
  badgeAlerte: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeAlerteText: { fontSize: 9, fontWeight: '800' },
  alerteZone: { fontSize: 12, fontWeight: '700', color: Brand.navy.DEFAULT },
  alerteMessage: { fontSize: 11, color: Brand.navy[500], marginTop: 1, lineHeight: 15 },
  emptyAlertsText: { fontSize: 12, color: Brand.navy[400], textAlign: 'center', paddingVertical: 10 },

  // Styles Section Conseils & Prévention
  sectionMargin: { marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 13.5, fontWeight: '800' },
  sectionSubtitle: { fontSize: 11, fontWeight: '600' },
  conseilsScroll: { gap: 10, paddingRight: 6 },
  conseilCard: {
    width: 220,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 14,
    ...Shadow.card,
  },
  conseilCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  conseilIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  conseilPill: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: Radius.pill },
  conseilPillText: { fontSize: 10, fontWeight: '800' },
  conseilTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  conseilDesc: { fontSize: 11, lineHeight: 15 },

  // Styles Cartes de Blocs (Mes signalements & Communauté)
  blockCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...Shadow.card,
  },
  blockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  blockCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  smallIconCircle: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  blockTitle: { fontSize: 13, fontWeight: '800' },
  blockSub: { fontSize: 10.5 },

  emptyBox: {
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.navy[200],
  },
  emptyBoxText: { fontSize: 11.5, textAlign: 'center' },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.red.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  emptyActionText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    gap: 10,
  },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  itemTitle: { fontSize: 12, fontWeight: '700' },
  waterTag: { paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 },
  waterTagText: { fontSize: 9.5, fontWeight: '700' },
  itemDesc: { fontSize: 11 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusPillText: { fontSize: 10, fontWeight: '800' },

  // Styles Cartes Communauté
  commuCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 11,
    marginBottom: 8,
    gap: 6,
  },
  commuCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commuLocationText: { fontSize: 11, fontWeight: '800' },
  prioritaireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prioritaireText: { fontSize: 9, fontWeight: '800', color: '#B45309' },
  commuDesc: { fontSize: 11.5, lineHeight: 16 },
  commuBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  commuDate: { fontSize: 10 },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  upvoteText: { fontSize: 10.5, fontWeight: '700' },
});
