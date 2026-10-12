import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type Alerte = {
  id: number;
  niveau_gravite?: 'rouge' | 'orange' | 'jaune' | 'vert';
  niveau?: string;
  titre?: string;
  message: string;
  consignes?: string;
  date_creation?: string;
  created_at?: string;
  timestamp?: string;
  statut?: string;
  zone?: { quartier?: string };
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
};

const COULEURS_NIVEAU: Record<string, { bg: string; text: string; border: string; label: string }> = {
  rouge: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', label: 'DANGER IMMINENT' },
  orange: { bg: '#FFEDD5', text: '#9A3412', border: '#F97316', label: 'VIGILANCE ÉLEVÉE' },
  jaune: { bg: '#FEF9C3', text: '#854D0E', border: '#EAB308', label: 'ATTENTION' },
  vert: { bg: '#DCFCE7', text: '#166534', border: '#22C55E', label: 'SITUATION NORMALE' },
};

export default function AlertesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'alertes' | 'previsions'>('alertes');
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [previsions, setPrevisions] = useState<Prevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chargerDonnees = async () => {
    try {
      const [resAlertes, resPrev] = await Promise.allSettled([
        axios.get(`${API_URL}/alertes/`),
        axios.get(`${API_URL}/previsions/`),
      ]);

      if (resAlertes.status === 'fulfilled') {
        const liste = resAlertes.value.data?.results || resAlertes.value.data || [];
        setAlertes(Array.isArray(liste) ? liste : []);
      }

      if (resPrev.status === 'fulfilled') {
        const prevList = resPrev.value.data?.results || resPrev.value.data || [];
        setPrevisions(Array.isArray(prevList) ? prevList : []);
      }
    } catch (error) {
      console.error('Erreur chargement alertes & prévisions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    chargerDonnees();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={10}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>Prévisions & alertes</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Thiaroye-sur-Mer · Suivi météo et vigilance</Text>
          </View>
        </View>

        {/* Onglets Alertes vs Prévisions */}
        <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab('alertes')}
            style={[
              styles.tabButton,
              activeTab === 'alertes' && (isDark ? { backgroundColor: Brand.navy[800] } : styles.tabButtonActive),
            ]}
          >
            <Feather
              name="bell"
              size={14}
              color={activeTab === 'alertes' ? Brand.red.DEFAULT : colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: colors.textMuted },
                activeTab === 'alertes' && styles.tabButtonTextActive,
              ]}
            >
              Alertes ({alertes.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('previsions')}
            style={[
              styles.tabButton,
              activeTab === 'previsions' && (isDark ? { backgroundColor: Brand.navy[800] } : styles.tabButtonActive),
            ]}
          >
            <Feather
              name="cloud-rain"
              size={14}
              color={activeTab === 'previsions' ? Brand.red.DEFAULT : colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: colors.textMuted },
                activeTab === 'previsions' && styles.tabButtonTextActive,
              ]}
            >
              Prévisions Météo ({previsions.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Brand.red.DEFAULT} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Chargement des données...</Text>
        </View>
      ) : activeTab === 'alertes' ? (
        alertes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={48} color="#16A34A" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune alerte active</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              La situation est calme. Aucun risque majeur n'est signalé dans votre zone.
            </Text>
            <Pressable
              onPress={onRefresh}
              style={[
                styles.refreshBtn,
                { backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT },
              ]}
            >
              <Text
                style={[
                  styles.refreshBtnText,
                  { color: isDark ? Brand.navy.DEFAULT : '#ffffff' },
                ]}
              >
                Actualiser
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={alertes}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
            renderItem={({ item }) => {
              const niveau = ((item.niveau || item.niveau_gravite || 'vert') as string).toLowerCase();
              const config = COULEURS_NIVEAU[niveau] || COULEURS_NIVEAU.vert;
              const dateStr = item.date_creation || item.created_at || item.timestamp;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Récemment';

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderLeftColor: config.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
                    </View>
                    <Text style={[styles.date, { color: colors.textMuted }]}>{formattedDate}</Text>
                  </View>

                  {item.zone?.quartier ? (
                    <View style={styles.zoneRow}>
                      <Feather name="map-pin" size={14} color={Brand.red.DEFAULT} />
                      <Text style={[styles.zoneName, { color: colors.text }]}>{item.zone.quartier}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>

                  {item.consignes ? (
                    <View
                      style={[
                        styles.consignesBox,
                        { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] },
                      ]}
                    >
                      <Text style={[styles.consignesTitle, { color: isDark ? '#FFFFFF' : Brand.navy.DEFAULT }]}>
                        ⚠️ Consignes de sécurité :
                      </Text>
                      <Text style={[styles.consignesText, { color: isDark ? Brand.navy[200] : Brand.navy[600] }]}>
                        {item.consignes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )
      ) : (
        /* VUE PRÉVISIONS MÉTÉO (Fidèle à AlertesPrevisionsPageBody du Web) */
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        >
          <View style={[styles.weatherCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weatherCardHeader}>
              <Feather name="cloud-rain" size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
              <Text style={[styles.weatherCardTitle, { color: colors.text }]}>Suivi météo & précipitations à venir</Text>
            </View>
            <Text style={[styles.weatherCardSub, { color: colors.textMuted }]}>
              Prévisions locales pour anticiper les épisodes pluvieux à Thiaroye-sur-Mer.
            </Text>

            {previsions.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune prévision météo enregistrée pour l’instant.</Text>
            ) : (
              previsions.map((p) => {
                const dateAffichee = p.date_prevision
                  ? new Date(p.date_prevision).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'À venir';

                const tempStr =
                  p.temperature_max_c != null
                    ? `${Math.round(Number(p.temperature_max_c))}°C`
                    : p.temperature_c != null
                    ? `${Math.round(Number(p.temperature_c))}°C`
                    : p.temperature != null
                    ? `${Math.round(Number(p.temperature))}°C`
                    : '29°C';

                const rainStr = `${Number(p.precipitation_mm ?? p.precipitation ?? 0).toFixed(1)} mm`;
                const ventStr = `${Math.round(Number(p.vitesse_vent ?? 15))} km/h`;

                return (
                  <View key={p.id} style={[styles.prevItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.prevItemTop}>
                      <Text style={[styles.prevDate, { color: colors.text }]}>📅 {dateAffichee}</Text>
                      <Text style={[styles.prevTemp, { color: isDark ? '#60A5FA' : '#2563EB' }]}>{tempStr}</Text>
                    </View>
                    <View style={styles.prevMetricsRow}>
                      <View style={styles.prevMetric}>
                        <Feather name="droplet" size={13} color={isDark ? '#60A5FA' : '#2563EB'} />
                        <Text style={[styles.prevMetricText, { color: colors.textMuted }]}>
                          Pluie : <Text style={[styles.bold, { color: colors.text }]}>{rainStr}</Text>
                        </Text>
                      </View>
                      <View style={styles.prevMetric}>
                        <Feather name="wind" size={13} color={colors.textMuted} />
                        <Text style={[styles.prevMetricText, { color: colors.textMuted }]}>
                          Vent : <Text style={[styles.bold, { color: colors.text }]}>{ventStr}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.navy[100],
  },
  title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT },
  subtitle: { fontSize: 12, color: Brand.navy[500], marginTop: 2 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 3,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Brand.navy[100],
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabButtonActive: {
    backgroundColor: Brand.red[50],
  },
  tabButtonText: { fontSize: 12, fontWeight: '600', color: Brand.navy[400] },
  tabButtonTextActive: { color: Brand.red.DEFAULT, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: Brand.navy[400], marginTop: 12 },
  list: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: Brand.navy[50],
    ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  date: { fontSize: 12, color: Brand.navy[400] },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  zoneName: { fontSize: 13, fontWeight: '700', color: Brand.navy.DEFAULT },
  message: { fontSize: 14, color: Brand.navy[700], lineHeight: 20, marginBottom: 8 },
  consignesBox: {
    backgroundColor: Brand.navy[50],
    padding: 10,
    borderRadius: Radius.md,
    marginTop: 6,
  },
  consignesTitle: { fontSize: 12, fontWeight: '700', color: Brand.navy.DEFAULT, marginBottom: 4 },
  consignesText: { fontSize: 12, color: Brand.navy[600], lineHeight: 17 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT, marginTop: 16, marginBottom: 6 },
  emptyText: { fontSize: 13, color: Brand.navy[500], textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  refreshBtn: {
    backgroundColor: Brand.navy.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  refreshBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  weatherCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    ...Shadow.card,
  },
  weatherCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  weatherCardTitle: { fontSize: 15, fontWeight: '800', color: Brand.navy.DEFAULT },
  weatherCardSub: { fontSize: 12, color: Brand.navy[400], marginBottom: 14 },
  prevItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.navy[50],
  },
  prevItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  prevDate: { fontSize: 13, fontWeight: '700', color: Brand.navy.DEFAULT },
  prevTemp: { fontSize: 15, fontWeight: '800', color: '#2563EB' },
  prevMetricsRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  prevMetric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  prevMetricText: { fontSize: 12, color: Brand.navy[600] },
  bold: { fontWeight: '700', color: Brand.navy.DEFAULT },
});
