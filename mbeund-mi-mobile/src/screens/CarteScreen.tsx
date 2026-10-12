import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type ZoneFeature = {
  type: string;
  id: number;
  geometry: any;
  properties: {
    quartier: string;
    niveau_risque: string;
    description?: string;
    score_risque_moyen?: number;
  };
};

type SignalementFeature = {
  type: string;
  id: number;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    description?: string;
    categorie?: string;
    valide?: boolean;
    date_creation?: string;
  };
};

type RefugeFeature = {
  type: string;
  id: number;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    nom: string;
    type_refuge: string;
    quartier: string;
    capacite?: number;
    contact?: string;
    adresse?: string;
  };
};

type InondationFeature = {
  type: string;
  id: number;
  geometry: any;
  properties: {
    date_debut?: string;
    date_fin?: string;
    surface_ha?: number;
  };
};

type RouteInfo = {
  route: {
    type: string;
    coordinates: [number, number][];
  };
  zone_arrivee: {
    quartier: string;
    niveau_risque: string;
  };
  distance_km: number;
  score_risque_moyen_parcours: number;
  segments_risque_traverses: any[];
};

export default function CarteScreen() {
  const { token } = useAuth();
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);

  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [signalements, setSignalements] = useState<SignalementFeature[]>([]);
  const [refuges, setRefuges] = useState<RefugeFeature[]>([]);
  const [inondations, setInondations] = useState<InondationFeature[]>([]);
  const [loading, setLoading] = useState(true);

  // Couches actives (comme sur le Web)
  const [layers, setLayers] = useState({
    zones: true,
    signalements: true,
    refuges: true,
    inondations: true,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  // Itinéraire sécurisé
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const [resZones, resSig, resRefuges, resInond] = await Promise.allSettled([
        axios.get(`${API_URL}/zones/`, authHeaders),
        axios.get(`${API_URL}/signalements/`, authHeaders),
        axios.get(`${API_URL}/refuges/`, authHeaders),
        axios.get(`${API_URL}/inondations/`, authHeaders),
      ]);

      if (resZones.status === 'fulfilled') {
        const feats = resZones.value.data?.features || [];
        setZones(feats);
      }

      if (resSig.status === 'fulfilled') {
        const feats = resSig.value.data?.results?.features || resSig.value.data?.features || [];
        setSignalements(feats);
      }

      if (resRefuges.status === 'fulfilled') {
        const feats = resRefuges.value.data?.results?.features || resRefuges.value.data?.features || [];
        setRefuges(feats);
      }

      if (resInond.status === 'fulfilled') {
        const feats = resInond.value.data?.results?.features || resInond.value.data?.features || [];
        setInondations(feats);
      }
    } catch (e) {
      console.error('Erreur chargement données carte:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleItineraire = async () => {
    if (routeInfo) {
      setRouteInfo(null);
      return;
    }

    setLoadingRoute(true);
    try {
      // Coordonnées Thiaroye par défaut
      const lat = 14.75;
      const lon = -17.38;
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/itineraire-securise/?lat=${lat}&lon=${lon}`, authHeaders);
      setRouteInfo(res.data);
    } catch (error: any) {
      console.error('Erreur calcul itinéraire:', error);
      const msg = error.response?.data?.detail || "Impossible de calculer l'itinéraire de secours pour le moment.";
      Alert.alert('Information', msg);
    } finally {
      setLoadingRoute(false);
    }
  };

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // HTML Leaflet haute compatibilité (sans hash SRI fragile)
  const leafletHtml = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Carte Mbeund-Mi</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          * { box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #E2E8F0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          #map {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: #E2E8F0;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            padding: 6px;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
            border: 1px solid #E2E8F0;
          }
          .popup-title {
            font-size: 13px;
            font-weight: 800;
            color: #1B2A40;
            margin-bottom: 4px;
          }
          .popup-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .popup-desc {
            font-size: 11px;
            color: #4A6480;
            line-height: 15px;
          }
          .progress-bar-bg {
            width: 100%;
            height: 5px;
            background: #E2E8F0;
            border-radius: 4px;
            overflow: hidden;
            margin: 4px 0;
          }
          .progress-bar-fill {
            height: 100%;
            border-radius: 4px;
          }
        </style>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.onerror = function(msg, url, line) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: msg, line: line }));
            }
          };

          var attempts = 0;
          function runMap() {
            if (typeof L === 'undefined') {
              attempts++;
              if (attempts < 80) {
                setTimeout(runMap, 100);
              }
              return;
            }

            var map = L.map('map', {
              zoomControl: false,
              attributionControl: false
            }).setView([14.7500, -17.3800], 14);

            L.control.zoom({ position: 'topright' }).addTo(map);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            var colors = {
              rouge: '#C0182A',
              orange: '#E0792E',
              jaune: '#EAB308',
              vert: '#22C55E'
            };

            var layersConfig = ${JSON.stringify(layers)};
            var zones = ${JSON.stringify(zones)};
            var signalements = ${JSON.stringify(signalements)};
            var refuges = ${JSON.stringify(refuges)};
            var inondations = ${JSON.stringify(inondations)};
            var route = ${JSON.stringify(routeInfo?.route || null)};

            // 1. Zones à risque
            if (layersConfig.zones && zones.length > 0) {
              zones.forEach(function(zone) {
                if (!zone.geometry) return;
                var props = zone.properties || {};
                var niv = (props.niveau_risque || 'vert').toLowerCase();
                var color = colors[niv] || colors.vert;
                var score = Math.round(Number(props.score_risque_moyen || 0) * 100);

                var layer = L.geoJSON(zone, {
                  style: {
                    color: color,
                    weight: 2.5,
                    opacity: 0.9,
                    fillColor: color,
                    fillOpacity: 0.35
                  }
                }).addTo(map);

                var popupHtml = '<div class="custom-popup">' +
                  '<div class="popup-title">' + (props.quartier || 'Zone Thiaroye') + '</div>' +
                  '<span class="popup-badge" style="background: ' + color + '22; color: ' + color + ';">Risque ' + niv + '</span>' +
                  '<div class="popup-desc">Indice de vulnérabilité : <b>' + score + '%</b></div>' +
                  '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ' + Math.max(5, score) + '%; background: ' + color + ';"></div></div>' +
                  '<div class="popup-desc">' + (props.description || 'Zone sous surveillance hydrologique.') + '</div>' +
                '</div>';

                layer.bindPopup(popupHtml);
              });
            }

            // 2. Inondations historiques
            if (layersConfig.inondations && inondations.length > 0) {
              inondations.forEach(function(inond) {
                if (!inond.geometry) return;
                var props = inond.properties || {};
                var layer = L.geoJSON(inond, {
                  style: {
                    color: '#4A6480',
                    weight: 1.5,
                    dashArray: '4, 4',
                    fillColor: '#4A6480',
                    fillOpacity: 0.25
                  }
                }).addTo(map);

                var popupHtml = '<div class="custom-popup">' +
                  '<div class="popup-title">Épisode d\\'inondation</div>' +
                  '<div class="popup-desc">Historique des zones submergées.</div>' +
                '</div>';
                layer.bindPopup(popupHtml);
              });
            }

            // 3. Points de Refuge
            if (layersConfig.refuges && refuges.length > 0) {
              refuges.forEach(function(ref) {
                if (!ref.geometry || !ref.geometry.coordinates) return;
                var coords = ref.geometry.coordinates;
                var props = ref.properties || {};
                var marker = L.circleMarker([coords[1], coords[0]], {
                  radius: 8,
                  fillColor: '#0D9488',
                  color: '#ffffff',
                  weight: 2,
                  fillOpacity: 1
                }).addTo(map);

                var popupHtml = '<div class="custom-popup">' +
                  '<div class="popup-title">🛡️ ' + (props.nom || 'Lieu sûr') + '</div>' +
                  '<span class="popup-badge" style="background: #CCFBF1; color: #0F766E;">Point de refuge</span>' +
                  '<div class="popup-desc">Quartier : ' + (props.quartier || 'Thiaroye') + '</div>' +
                  (props.capacite ? '<div class="popup-desc">Capacité : ' + props.capacite + ' personnes</div>' : '') +
                  (props.contact ? '<div class="popup-desc">Contact : ' + props.contact + '</div>' : '') +
                '</div>';
                marker.bindPopup(popupHtml);
              });
            }

            // 4. Signalements citoyens
            if (layersConfig.signalements && signalements.length > 0) {
              signalements.forEach(function(sig) {
                if (!sig.geometry || !sig.geometry.coordinates) return;
                var coords = sig.geometry.coordinates;
                var props = sig.properties || {};
                var isValide = props.valide !== false;
                var color = isValide ? '#C0182A' : '#64748B';

                var marker = L.circleMarker([coords[1], coords[0]], {
                  radius: 7,
                  fillColor: color,
                  color: '#ffffff',
                  weight: 2,
                  fillOpacity: 0.95
                }).addTo(map);

                var popupHtml = '<div class="custom-popup">' +
                  '<div class="popup-title">🚨 ' + (props.categorie || 'Signalement') + '</div>' +
                  '<span class="popup-badge" style="background: ' + color + '22; color: ' + color + ';">' + (isValide ? 'Validé' : 'En attente') + '</span>' +
                  '<div class="popup-desc">' + (props.description || 'Signalé par un citoyen.') + '</div>' +
                '</div>';
                marker.bindPopup(popupHtml);
              });
            }

            // 5. Tracé Itinéraire vers lieu sûr
            if (route && route.coordinates && route.coordinates.length > 0) {
              var latLngs = route.coordinates.map(function(c) { return [c[1], c[0]]; });
              
              L.polyline(latLngs, {
                color: '#0D9488',
                weight: 6,
                opacity: 0.4
              }).addTo(map);

              var pathLine = L.polyline(latLngs, {
                color: '#0D9488',
                weight: 4,
                dashArray: '4, 8'
              }).addTo(map);

              var startPt = latLngs[0];
              var endPt = latLngs[latLngs.length - 1];

              L.circleMarker(startPt, {
                radius: 7,
                fillColor: '#1B2A40',
                color: '#ffffff',
                weight: 2,
                fillOpacity: 1
              }).addTo(map).bindPopup('<b>Position de départ</b>');

              L.circleMarker(endPt, {
                radius: 9,
                fillColor: '#0D9488',
                color: '#ffffff',
                weight: 2,
                fillOpacity: 1
              }).addTo(map).bindPopup('<b>Point de sécurité le plus proche</b>');

              map.fitBounds(pathLine.getBounds(), { padding: [40, 40] });
            }

            setTimeout(function() { map.invalidateSize(); }, 250);
            setTimeout(function() { map.invalidateSize(); }, 800);

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
            }
          }

          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            runMap();
          } else {
            document.addEventListener('DOMContentLoaded', runMap);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.title, { color: colors.text }]}>Carte des risques</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Thiaroye-sur-Mer · Zones, refuges & signalements</Text>
        </View>

        {/* Bouton Itinéraire vers lieu sûr (Identique au Web) */}
        <Pressable
          onPress={handleItineraire}
          disabled={loadingRoute}
          style={[
            styles.routeBtn,
            routeInfo && (isDark ? { backgroundColor: '#FFFFFF' } : styles.routeBtnActive),
          ]}
        >
          {loadingRoute ? (
            <ActivityIndicator size="small" color={routeInfo && isDark ? Brand.navy.DEFAULT : '#fff'} />
          ) : (
            <Feather
              name={routeInfo ? 'x' : 'navigation'}
              size={14}
              color={routeInfo && isDark ? Brand.navy.DEFAULT : '#fff'}
            />
          )}
          <Text
            style={[
              styles.routeBtnText,
              routeInfo && isDark && { color: Brand.navy.DEFAULT },
            ]}
          >
            {routeInfo ? 'Fermer itinéraire' : 'Lieu sûr'}
          </Text>
        </Pressable>
      </View>

      {/* Résumé Itinéraire Sécurisé (Identique au Web) */}
      {routeInfo && (
        <View
          style={[
            styles.routeCard,
            {
              backgroundColor: isDark ? Brand.navy[900] : '#F0FDFA',
              borderBottomColor: isDark ? Brand.navy[700] : '#CCFBF1',
            },
          ]}
        >
          <View style={[styles.routeIconBox, { backgroundColor: isDark ? Brand.navy[800] : '#CCFBF1' }]}>
            <Feather name="shield" size={18} color="#0D9488" />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.routeCardTitle, { color: isDark ? '#34D399' : '#0F766E' }]}>
              Point sûr : {routeInfo.zone_arrivee.quartier}
            </Text>
            <Text style={[styles.routeCardSub, { color: isDark ? '#A7F3D0' : '#115E59' }]}>
              Distance: <Text style={styles.bold}>{routeInfo.distance_km} km</Text> · Risque trajet:{' '}
              <Text style={styles.bold}>
                {Math.round(routeInfo.score_risque_moyen_parcours * 100)}%
              </Text>
            </Text>
          </View>
          <Pressable onPress={() => setRouteInfo(null)} hitSlop={10}>
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* Conteneur de la Carte Leaflet */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={Brand.red.DEFAULT} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Initialisation de la carte Leaflet...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHtml, baseUrl: 'https://unpkg.com' }}
            style={styles.webview}
            containerStyle={styles.webviewContainer}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            scalesPageToFit={false}
            scrollEnabled={false}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={Brand.red.DEFAULT} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Affichage de la carte...</Text>
              </View>
            )}
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === 'ERROR') {
                  console.warn('Leaflet WebView Error:', msg);
                }
              } catch (_) {}
            }}
          />
        )}

        {/* Bouton Flottant Sélecteur de Couches (Comme le Web) */}
        <View style={styles.layerControlBox}>
          {panelOpen && (
            <View style={[styles.layerPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.textMuted }]}>Couches SIG</Text>
              <Pressable
                onPress={() => toggleLayer('zones')}
                style={styles.layerCheckboxRow}
              >
                <Feather
                  name={layers.zones ? 'check-square' : 'square'}
                  size={16}
                  color={layers.zones ? Brand.red.DEFAULT : colors.textMuted}
                />
                <Text style={[styles.layerLabel, { color: colors.text }]}>Zones à risque</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleLayer('refuges')}
                style={styles.layerCheckboxRow}
              >
                <Feather
                  name={layers.refuges ? 'check-square' : 'square'}
                  size={16}
                  color={layers.refuges ? '#0D9488' : colors.textMuted}
                />
                <Text style={[styles.layerLabel, { color: colors.text }]}>Points de refuge</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleLayer('signalements')}
                style={styles.layerCheckboxRow}
              >
                <Feather
                  name={layers.signalements ? 'check-square' : 'square'}
                  size={16}
                  color={layers.signalements ? Brand.red.DEFAULT : colors.textMuted}
                />
                <Text style={[styles.layerLabel, { color: colors.text }]}>Signalements</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleLayer('inondations')}
                style={styles.layerCheckboxRow}
              >
                <Feather
                  name={layers.inondations ? 'check-square' : 'square'}
                  size={16}
                  color={layers.inondations ? '#4A6480' : colors.textMuted}
                />
                <Text style={[styles.layerLabel, { color: colors.text }]}>Historique inondations</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => setPanelOpen((prev) => !prev)}
            style={[styles.layerToggleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name={panelOpen ? 'x' : 'layers'} size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Légende discrète en bas à gauche */}
        <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#C0182A' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Critique</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#E0792E' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Élevé</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#0D9488' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Refuge</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Brand.navy[100],
  },
  headerTitleCol: { flex: 1, paddingRight: 10 },
  title: { fontSize: 16, fontWeight: '800', color: Brand.navy.DEFAULT },
  subtitle: { fontSize: 11, color: Brand.navy[400], marginTop: 1 },

  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.red.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  routeBtnActive: {
    backgroundColor: Brand.navy.DEFAULT,
  },
  routeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  routeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCardTitle: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  routeCardSub: { fontSize: 11, color: '#115E59', marginTop: 1 },
  bold: { fontWeight: '700' },

  mapContainer: { flex: 1, position: 'relative', width: '100%', height: '100%' },
  webviewContainer: { flex: 1, width: '100%', height: '100%' },
  webview: { flex: 1, width: '100%', height: '100%', backgroundColor: '#E2E8F0' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  loadingText: { fontSize: 13, color: Brand.navy[500], marginTop: 10 },

  layerControlBox: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 100,
  },
  layerToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.navy[100],
    ...Shadow.card,
  },
  layerPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    width: 190,
    gap: 8,
    ...Shadow.card,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.navy[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  layerCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.navy.DEFAULT,
  },

  legend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    ...Shadow.card,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700', color: Brand.navy.DEFAULT },
});
