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

export default function HomeScreen() {
  const router = useRouter();
  const { username, token, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [topZone, setTopZone] = useState<ZoneRisque | null>(null);
  const [previsions, setPrevisions] = useState<Prevision[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerDonnees = async () => {
    try {
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const [resZones, resAlertes, resPrev] = await Promise.allSettled([
        axios.get(`${API_URL}/zones/`, authHeaders),
        axios.get(`${API_URL}/alertes/`, authHeaders),
        axios.get(`${API_URL}/previsions/`, authHeaders),
      ]);

      // 1. Zones à risque
      if (resZones.status === 'fulfilled') {
        const feats = resZones.value.data?.features || [];
        if (feats.length > 0) {
          // Zone la plus vulnérable (comme la fonction pickMostAtRiskZone du Web)
          const sorted = [...feats].sort((a, b) => {
            const scoreA = Number(a.properties?.score_risque_moyen || 0);
            const scoreB = Number(b.properties?.score_risque_moyen || 0);
            return scoreB - scoreA;
          });
          const best = sorted[0];
          setTopZone({ id: best.id, ...best.properties });
        }
      }

      // 2. Alertes récentes (3 dernières comme sur le Web)
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
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : Brand.navy[100],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
            <Feather
              name={isDark ? 'sun' : 'moon'}
              size={15}
              color={isDark ? '#FACC15' : Brand.navy.DEFAULT}
            />
            <Text
              style={[
                styles.themeToggleText,
                { color: isDark ? '#F1F5F9' : Brand.navy.DEFAULT },
              ]}>
              {isDark ? 'Clair' : 'Sombre'}
            </Text>
          </Pressable>
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

  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1.2,
    ...Shadow.card,
  },
  themeToggleText: { fontSize: 11.5, fontWeight: '700' },

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
});
