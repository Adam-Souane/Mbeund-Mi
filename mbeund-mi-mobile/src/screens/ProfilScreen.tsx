import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PrimaryButton } from '@/components';

type TabType = 'vulnerabilite' | 'kit' | 'contact' | 'signalements';

type ZoneOption = {
  id: number;
  quartier: string;
};

type ProfilVulnerabilite = {
  zone: number | string | null;
  personnes_agees: number;
  enfants_bas_age: number;
  personne_mobilite_reduite: boolean;
  femme_enceinte: boolean;
  notes: string;
};

type SurvivalKit = {
  eau_potable_litres: number;
  nourriture_jours: number;
  medicaments: boolean;
  documents_importants: boolean;
  lampe_torche: boolean;
  batterie_portable: boolean;
  trousse_premiers_secours: boolean;
  vetements_secours: boolean;
  plan_evacuation: string;
  points_refuge_identifies: boolean;
  voisins_contactes: boolean;
  notes: string;
};

type EmergencyContact = {
  nom: string;
  relation: string;
  telephone: string;
  email: string;
  adresse: string;
  alerter_automatiquement: boolean;
};

type MonRelais = {
  id: number;
  zone: number;
  verifie: boolean;
};

type MonSignalement = {
  id: number;
  categorie: string;
  categorie_display?: string;
  description: string;
  valide: boolean;
  niveau_eau?: string;
  niveau_eau_display?: string;
  date_creation: string;
};

const RELATIONS = [
  { id: 'famille', label: 'Famille' },
  { id: 'ami', label: 'Ami(e)' },
  { id: 'voisin', label: 'Voisin(e)' },
  { id: 'medecin', label: 'Médecin' },
  { id: 'autre', label: 'Autre' },
];

export default function ProfilScreen() {
  const router = useRouter();
  const { username, role, token, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [activeTab, setActiveTab] = useState<TabType>('vulnerabilite');

  // Données globales
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 1. Profil de vulnérabilité
  const [profil, setProfil] = useState<ProfilVulnerabilite>({
    zone: null,
    personnes_agees: 0,
    enfants_bas_age: 0,
    personne_mobilite_reduite: false,
    femme_enceinte: false,
    notes: '',
  });
  const [sauvegardeProfilEnCours, setSauvegardeProfilEnCours] = useState(false);
  const [succesProfil, setSuccesProfil] = useState(false);

  // Relais quartier
  const [monRelais, setMonRelais] = useState<MonRelais | null>(null);
  const [relaisZoneSelectionnee, setRelaisZoneSelectionnee] = useState<number | null>(null);
  const [actionRelaisEnCours, setActionRelaisEnCours] = useState(false);

  // 2. Kit de survie
  const [kit, setKit] = useState<SurvivalKit>({
    eau_potable_litres: 0,
    nourriture_jours: 0,
    medicaments: false,
    documents_importants: false,
    lampe_torche: false,
    batterie_portable: false,
    trousse_premiers_secours: false,
    vetements_secours: false,
    plan_evacuation: '',
    points_refuge_identifies: false,
    voisins_contactes: false,
    notes: '',
  });
  const [sauvegardeKitEnCours, setSauvegardeKitEnCours] = useState(false);
  const [succesKit, setSuccesKit] = useState(false);

  // 3. Contact d'urgence
  const [contact, setContact] = useState<EmergencyContact>({
    nom: '',
    relation: 'famille',
    telephone: '',
    email: '',
    adresse: '',
    alerter_automatiquement: true,
  });
  const [sauvegardeContactEnCours, setSauvegardeContactEnCours] = useState(false);
  const [succesContact, setSuccesContact] = useState(false);

  // 4. Mes signalements
  const [signalements, setSignalements] = useState<MonSignalement[]>([]);
  const [chargementSignalements, setChargementSignalements] = useState(false);
  const [seenSignalementsCount, setSeenSignalementsCount] = useState<number>(0);

  // Charger le nombre de signalements déjà consultés par le citoyen
  useEffect(() => {
    SecureStore.getItemAsync('seen_signalements_count')
      .then((val) => {
        if (val !== null) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) setSeenSignalementsCount(parsed);
        }
      })
      .catch(() => {});
  }, []);

  // Dès que le citoyen est sur l'onglet 'signalements', marquer tous les signalements comme vus
  useEffect(() => {
    if (activeTab === 'signalements' && signalements.length > 0) {
      if (seenSignalementsCount !== signalements.length) {
        setSeenSignalementsCount(signalements.length);
        SecureStore.setItemAsync('seen_signalements_count', String(signalements.length)).catch(() => {});
      }
    }
  }, [activeTab, signalements.length, seenSignalementsCount]);

  // Nombre de nouveaux signalements non consultés
  const unreadSignalements =
    activeTab === 'signalements'
      ? 0
      : Math.max(0, signalements.length - seenSignalementsCount);

  // Chargement des données à l'ouverture
  useEffect(() => {
    if (!token) return;

    const chargerTout = async () => {
      setLoadingInitial(true);
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [resZones, resProfil, resRelais, resKit, resContact, resSig] = await Promise.allSettled([
          axios.get(`${API_URL}/zones/`, authHeader),
          axios.get(`${API_URL}/mon-profil-vulnerabilite/`, authHeader),
          axios.get(`${API_URL}/relais-quartier/moi/`, authHeader),
          axios.get(`${API_URL}/mon-survival-kit/`, authHeader),
          axios.get(`${API_URL}/mon-emergency-contact/`, authHeader),
          axios.get(`${API_URL}/mes-signalements/`, authHeader),
        ]);

        // Zones
        if (resZones.status === 'fulfilled') {
          const feats = resZones.value.data?.features || [];
          const list: ZoneOption[] = feats.map((f: any) => ({
            id: f.id,
            quartier: f.properties?.quartier || `Zone ${f.id}`,
          }));
          setZones(list);
          if (list.length > 0) setRelaisZoneSelectionnee(list[0].id);
        }

        // Profil vulnérabilité
        if (resProfil.status === 'fulfilled' && resProfil.value.data) {
          const d = resProfil.value.data;
          setProfil({
            zone: d.zone || null,
            personnes_agees: d.personnes_agees || 0,
            enfants_bas_age: d.enfants_bas_age || 0,
            personne_mobilite_reduite: Boolean(d.personne_mobilite_reduite),
            femme_enceinte: Boolean(d.femme_enceinte),
            notes: d.notes || '',
          });
        }

        // Relais
        if (resRelais.status === 'fulfilled' && resRelais.value.data) {
          setMonRelais(resRelais.value.data);
        }

        // Kit de survie
        if (resKit.status === 'fulfilled' && resKit.value.data) {
          const k = resKit.value.data;
          setKit({
            eau_potable_litres: k.eau_potable_litres || 0,
            nourriture_jours: k.nourriture_jours || 0,
            medicaments: Boolean(k.medicaments),
            documents_importants: Boolean(k.documents_importants),
            lampe_torche: Boolean(k.lampe_torche),
            batterie_portable: Boolean(k.batterie_portable),
            trousse_premiers_secours: Boolean(k.trousse_premiers_secours),
            vetements_secours: Boolean(k.vetements_secours),
            plan_evacuation: k.plan_evacuation || '',
            points_refuge_identifies: Boolean(k.points_refuge_identifies),
            voisins_contactes: Boolean(k.voisins_contactes),
            notes: k.notes || '',
          });
        }

        // Contact d'urgence
        if (resContact.status === 'fulfilled' && resContact.value.data) {
          const c = resContact.value.data;
          setContact({
            nom: c.nom || '',
            relation: c.relation || 'famille',
            telephone: c.telephone || '',
            email: c.email || '',
            adresse: c.adresse || '',
            alerter_automatiquement: c.alerter_automatiquement !== false,
          });
        }

        // Signalements
        if (resSig.status === 'fulfilled') {
          const sList = resSig.value.data?.results || resSig.value.data || [];
          setSignalements(Array.isArray(sList) ? sList : []);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    chargerTout();
  }, [token]);

  // Sauvegarde Profil de vulnérabilité
  const handleSauvegarderProfil = async () => {
    if (!token) return;
    setSauvegardeProfilEnCours(true);
    setSuccesProfil(false);
    try {
      await axios.put(
        `${API_URL}/mon-profil-vulnerabilite/`,
        { ...profil, zone: profil.zone || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccesProfil(true);
      setTimeout(() => setSuccesProfil(false), 3000);
      Alert.alert('Succès', 'Profil de vulnérabilité du foyer mis à jour.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setSauvegardeProfilEnCours(false);
    }
  };

  // Rejoindre ou quitter les relais
  const handleDevenirRelais = async () => {
    if (!token || !relaisZoneSelectionnee) return;
    setActionRelaisEnCours(true);
    try {
      const res = await axios.post(
        `${API_URL}/relais-quartier/`,
        { zone: relaisZoneSelectionnee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMonRelais(res.data);
      Alert.alert('Engagement enregistré', 'Merci pour votre engagement comme relais de quartier !');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.response?.data?.detail || "Impossible d'enregistrer votre engagement.");
    } finally {
      setActionRelaisEnCours(false);
    }
  };

  const handleQuitterRelais = async () => {
    if (!token || !monRelais) return;
    setActionRelaisEnCours(true);
    try {
      await axios.delete(`${API_URL}/relais-quartier/${monRelais.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonRelais(null);
      Alert.alert('Désinscription', 'Vous ne faites plus partie des relais de quartier.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de se désinscrire.');
    } finally {
      setActionRelaisEnCours(false);
    }
  };

  // Sauvegarde Kit de Survie
  const handleSauvegarderKit = async () => {
    if (!token) return;
    setSauvegardeKitEnCours(true);
    setSuccesKit(false);
    try {
      await axios.put(`${API_URL}/mon-survival-kit/`, kit, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccesKit(true);
      setTimeout(() => setSuccesKit(false), 3000);
      Alert.alert('Succès', 'Kit de survie et plan de préparation enregistrés.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’enregistrer le kit de survie.');
    } finally {
      setSauvegardeKitEnCours(false);
    }
  };

  // Calcul du score de préparation du Kit
  const scorePreparation = (() => {
    let score = 0;
    if (kit.eau_potable_litres >= 15) score += 15;
    else if (kit.eau_potable_litres > 0) score += 8;

    if (kit.nourriture_jours >= 3) score += 15;
    else if (kit.nourriture_jours > 0) score += 8;

    if (kit.medicaments) score += 10;
    if (kit.documents_importants) score += 10;
    if (kit.lampe_torche) score += 10;
    if (kit.batterie_portable) score += 10;
    if (kit.trousse_premiers_secours) score += 10;
    if (kit.vetements_secours) score += 10;
    if (kit.points_refuge_identifies) score += 5;
    if (kit.voisins_contactes) score += 5;

    return Math.min(score, 100);
  })();

  // Sauvegarde Contact d'urgence
  const handleSauvegarderContact = async () => {
    if (!token) return;
    if (!contact.nom.trim() || !contact.telephone.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir au moins le nom et le numéro de téléphone.');
      return;
    }
    setSauvegardeContactEnCours(true);
    setSuccesContact(false);
    try {
      await axios.put(`${API_URL}/mon-emergency-contact/`, contact, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccesContact(true);
      setTimeout(() => setSuccesContact(false), 3000);
      Alert.alert('Succès', 'Contact d’urgence enregistré.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’enregistrer le contact d’urgence.');
    } finally {
      setSauvegardeContactEnCours(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de votre compte citoyen ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const dialNumber = (num: string) => {
    Linking.openURL(`tel:${num}`);
  };

  const formatDateHeureSignalement = (dateStr?: string) => {
    if (!dateStr) return 'Récemment';
    try {
      const d = new Date(dateStr);
      const dateFormatted = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const heureFormatted = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateFormatted} à ${heureFormatted}`;
    } catch {
      return 'Récemment';
    }
  };

  const initial = (username || 'C')[0]?.toUpperCase();
  const quartierActuel = zones.find((z) => z.id === Number(profil.zone))?.quartier || 'Thiaroye-sur-Mer';

  if (loadingInitial) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.red.DEFAULT} />
          <Text style={styles.loadingText}>Chargement de votre espace citoyen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
        {/* En-tête profil */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }]}>{username || 'Citoyen'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable
                    onPress={toggleTheme}
                    hitSlop={10}
                    style={styles.themeToggleBtn}
                    accessibilityRole="button"
                    accessibilityLabel={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
                    <Feather
                      name={isDark ? 'sun' : 'moon'}
                      size={16}
                      color={isDark ? '#FACC15' : Brand.navy.DEFAULT}
                    />
                  </Pressable>
                  <Pressable onPress={handleLogout} hitSlop={10} style={styles.logoutIconBtn}>
                    <Feather name="log-out" size={17} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={[styles.badgeRole, { backgroundColor: isDark ? '#1E293B' : Brand.navy[50] }]}>
                  <Feather name="shield" size={12} color={isDark ? '#93C5FD' : Brand.navy[600]} />
                  <Text style={[styles.badgeRoleText, { color: isDark ? '#E2E8F0' : Brand.navy[700] }]}>Compte Citoyen</Text>
                </View>
                {monRelais?.verifie ? (
                  <View style={styles.badgeRelais}>
                    <Feather name="check-circle" size={11} color="#15803D" />
                    <Text style={styles.badgeRelaisText}>Relais Validé</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.zoneText, { color: colors.textMuted }]}>📍 {quartierActuel}, Dakar</Text>
            </View>
          </View>
        </View>

        {/* Emplacement des quatre carrés de navigation */}
        {/* Emplacement des quatre carrés de navigation sur la même ligne */}
        <View style={[styles.gridTabsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Carré 1 : Mon Foyer */}
          <Pressable
            onPress={() => setActiveTab('vulnerabilite')}
            style={[
              styles.gridTabSquare,
              { backgroundColor: isDark ? colors.surface : Brand.background, borderColor: colors.border },
              activeTab === 'vulnerabilite' && styles.gridTabSquareActive,
            ]}>
            <View
              style={[
                styles.tabIconCircle,
                activeTab === 'vulnerabilite' && styles.tabIconCircleActive,
              ]}>
              <Feather
                name="home"
                size={18}
                color={activeTab === 'vulnerabilite' ? '#ffffff' : Brand.red.DEFAULT}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.gridTabLabel,
                { color: isDark ? colors.text : Brand.navy[700] },
                activeTab === 'vulnerabilite' && styles.gridTabLabelActive,
              ]}>
              Mon Foyer
            </Text>
          </Pressable>

          {/* Carré 2 : Kit Survie */}
          <Pressable
            onPress={() => setActiveTab('kit')}
            style={[
              styles.gridTabSquare,
              { backgroundColor: isDark ? colors.surface : Brand.background, borderColor: colors.border },
              activeTab === 'kit' && styles.gridTabSquareActive,
            ]}>
            <View
              style={[
                styles.tabIconCircle,
                activeTab === 'kit' && styles.tabIconCircleActive,
              ]}>
              <Feather
                name="package"
                size={18}
                color={activeTab === 'kit' ? '#ffffff' : Brand.red.DEFAULT}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.gridTabLabel,
                { color: isDark ? colors.text : Brand.navy[700] },
                activeTab === 'kit' && styles.gridTabLabelActive,
              ]}>
              Kit Survie
            </Text>
          </Pressable>

          {/* Carré 3 : Urgence */}
          <Pressable
            onPress={() => setActiveTab('contact')}
            style={[
              styles.gridTabSquare,
              { backgroundColor: isDark ? colors.surface : Brand.background, borderColor: colors.border },
              activeTab === 'contact' && styles.gridTabSquareActive,
            ]}>
            <View
              style={[
                styles.tabIconCircle,
                activeTab === 'contact' && styles.tabIconCircleActive,
              ]}>
              <Feather
                name="phone"
                size={18}
                color={activeTab === 'contact' ? '#ffffff' : Brand.red.DEFAULT}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.gridTabLabel,
                { color: isDark ? colors.text : Brand.navy[700] },
                activeTab === 'contact' && styles.gridTabLabelActive,
              ]}>
              Urgence
            </Text>
          </Pressable>

          {/* Carré 4 : Signalements */}
          <Pressable
            onPress={() => {
              setActiveTab('signalements');
              if (signalements.length > 0) {
                setSeenSignalementsCount(signalements.length);
                SecureStore.setItemAsync('seen_signalements_count', String(signalements.length)).catch(() => {});
              }
            }}
            style={[
              styles.gridTabSquare,
              { backgroundColor: isDark ? colors.surface : Brand.background, borderColor: colors.border },
              activeTab === 'signalements' && styles.gridTabSquareActive,
            ]}>
            <View style={styles.iconWithBadgeWrapper}>
              <View
                style={[
                  styles.tabIconCircle,
                  activeTab === 'signalements' && styles.tabIconCircleActive,
                ]}>
                <Feather
                  name="list"
                  size={18}
                  color={activeTab === 'signalements' ? '#ffffff' : Brand.red.DEFAULT}
                />
              </View>
              {unreadSignalements > 0 && (
                <View style={styles.tabSquareBadge}>
                  <Text style={styles.tabSquareBadgeText}>
                    {unreadSignalements}
                  </Text>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.gridTabLabel,
                { color: isDark ? colors.text : Brand.navy[700] },
                activeTab === 'signalements' && styles.gridTabLabelActive,
              ]}>
              Signalements
            </Text>
          </Pressable>
        </View>

        {/* CONTENU ONGLET 1 : FOYER & VULNÉRABILITÉ */}
        {activeTab === 'vulnerabilite' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="heart" size={17} color={Brand.red.DEFAULT} />
                <Text style={styles.cardTitle}>Vulnérabilité de votre foyer</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Facultatif — aide l'autorité et les relais à prioriser l'assistance à l'évacuation en cas de montée des eaux.
              </Text>

              {/* Sélection du quartier */}
              <Text style={styles.inputLabel}>Quartier de résidence :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {zones.map((z) => {
                  const estChoisi = Number(profil.zone) === z.id;
                  return (
                    <Pressable
                      key={z.id}
                      onPress={() => setProfil((prev) => ({ ...prev, zone: estChoisi ? null : z.id }))}
                      style={[styles.chip, estChoisi && styles.chipActive]}>
                      <Text style={[styles.chipText, estChoisi && styles.chipTextActive]}>
                        {z.quartier}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Steppers Personnes âgées & Enfants */}
              <View style={styles.counterRow}>
                <View style={styles.counterBox}>
                  <Text style={styles.counterLabel}>Personnes âgées</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setProfil((p) => ({ ...p, personnes_agees: Math.max(0, p.personnes_agees - 1) }))
                      }
                      style={styles.stepperBtn}>
                      <Feather name="minus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                    <Text style={styles.stepperVal}>{profil.personnes_agees}</Text>
                    <Pressable
                      onPress={() => setProfil((p) => ({ ...p, personnes_agees: p.personnes_agees + 1 }))}
                      style={styles.stepperBtn}>
                      <Feather name="plus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.counterBox}>
                  <Text style={styles.counterLabel}>Enfants en bas âge</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setProfil((p) => ({ ...p, enfants_bas_age: Math.max(0, p.enfants_bas_age - 1) }))
                      }
                      style={styles.stepperBtn}>
                      <Feather name="minus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                    <Text style={styles.stepperVal}>{profil.enfants_bas_age}</Text>
                    <Pressable
                      onPress={() => setProfil((p) => ({ ...p, enfants_bas_age: p.enfants_bas_age + 1 }))}
                      style={styles.stepperBtn}>
                      <Feather name="plus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Interrupteurs PMR et Femme Enceinte */}
              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Personne à mobilité réduite (PMR)</Text>
                  <Text style={styles.switchSubtitle}>Fauteuil roulant, difficulté motrice</Text>
                </View>
                <Switch
                  value={profil.personne_mobilite_reduite}
                  onValueChange={(val) => setProfil((p) => ({ ...p, personne_mobilite_reduite: val }))}
                  trackColor={{ false: Brand.navy[100], true: Brand.red[200] }}
                  thumbColor={profil.personne_mobilite_reduite ? Brand.red.DEFAULT : '#ffffff'}
                />
              </View>

              <View style={[styles.switchRow, styles.borderTop]}>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Femme enceinte dans le foyer</Text>
                  <Text style={styles.switchSubtitle}>Assistance particulière requise</Text>
                </View>
                <Switch
                  value={profil.femme_enceinte}
                  onValueChange={(val) => setProfil((p) => ({ ...p, femme_enceinte: val }))}
                  trackColor={{ false: Brand.navy[100], true: Brand.red[200] }}
                  thumbColor={profil.femme_enceinte ? Brand.red.DEFAULT : '#ffffff'}
                />
              </View>

              {/* Notes médicales */}
              <Text style={styles.inputLabel}>Notes particulières / Traitements :</Text>
              <TextInput
                style={styles.textArea}
                multiline
                blurOnSubmit={false}
                numberOfLines={3}
                placeholder="Ex : Traitement régulier sous insuline, dialyse..."
                placeholderTextColor={colors.placeholder}
                value={profil.notes}
                onChangeText={(text) => setProfil((p) => ({ ...p, notes: text }))}
              />

              <PrimaryButton
                title={sauvegardeProfilEnCours ? 'Enregistrement...' : 'Enregistrer mon foyer'}
                onPress={handleSauvegarderProfil}
                loading={sauvegardeProfilEnCours}
                style={styles.btnAction}
              />
              {succesProfil ? (
                <Text style={styles.successMsg}>✓ Profil de vulnérabilité enregistré avec succès</Text>
              ) : null}
            </View>

            {/* Relais de quartier */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="users" size={17} color={colors.text} />
                <Text style={styles.cardTitle}>Engagement : Relais de Quartier</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Devenez volontaire pour être notifié en priorité et relayer les alertes d'évacuation aux voisins vulnérables.
              </Text>

              {monRelais ? (
                <View style={styles.relaisActiveBox}>
                  <View style={styles.flex}>
                    <Text style={styles.relaisQuartierNom}>
                      Inscrit pour :{' '}
                      {zones.find((z) => z.id === monRelais.zone)?.quartier || 'Votre quartier'}
                    </Text>
                    <Text
                      style={[
                        styles.relaisStatusText,
                        { color: monRelais.verifie ? '#15803D' : '#D97706' },
                      ]}>
                      {monRelais.verifie
                        ? '✓ Validé par les autorités'
                        : '⏳ En attente de validation administrative'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleQuitterRelais}
                    disabled={actionRelaisEnCours}
                    style={styles.btnDesinscription}>
                    <Text style={styles.btnDesinscriptionText}>Se retirer</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Sélectionnez votre quartier d'action :</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {zones.map((z) => {
                      const estChoisi = relaisZoneSelectionnee === z.id;
                      return (
                        <Pressable
                          key={z.id}
                          onPress={() => setRelaisZoneSelectionnee(z.id)}
                          style={[styles.chip, estChoisi && styles.chipActive]}>
                          <Text style={[styles.chipText, estChoisi && styles.chipTextActive]}>
                            {z.quartier}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Pressable
                    onPress={handleDevenirRelais}
                    disabled={actionRelaisEnCours || !relaisZoneSelectionnee}
                    style={[styles.btnRelais, !relaisZoneSelectionnee && { opacity: 0.5 }]}>
                    {actionRelaisEnCours ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather
                          name="user-check"
                          size={15}
                          color={isDark ? Brand.navy.DEFAULT : '#ffffff'}
                        />
                        <Text style={styles.btnRelaisText}>Devenir Relais de quartier</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* CONTENU ONGLET 2 : KIT DE SURVIE */}
        {activeTab === 'kit' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="shield" size={17} color="#D97706" />
                <Text style={styles.cardTitle}>Kit de Survie & Préparation</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Évaluez et préparez les équipements essentiels de votre foyer face aux inondations.
              </Text>

              {/* Jauge de Préparation */}
              <View style={styles.jaugeBox}>
                <View style={styles.jaugeHeader}>
                  <Text style={styles.jaugeTitre}>Score de préparation</Text>
                  <Text
                    style={[
                      styles.jaugeValeur,
                      { color: scorePreparation >= 70 ? '#15803D' : '#D97706' },
                    ]}>
                    {scorePreparation}%
                  </Text>
                </View>
                <View style={styles.jaugeTrack}>
                  <View
                    style={[
                      styles.jaugeFill,
                      {
                        width: `${scorePreparation}%`,
                        backgroundColor: scorePreparation >= 70 ? '#22C55E' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.jaugeConseil}>
                  {scorePreparation >= 80
                    ? 'Excellent niveau de préparation aux urgences !'
                    : scorePreparation >= 50
                    ? 'Bonne base, complétez les équipements manquants ci-dessous.'
                    : 'Attention : préparez vos réserves d’eau et de vivres au plus vite.'}
                </Text>
              </View>

              {/* Provisions de base */}
              <Text style={styles.subSectionTitle}>Provisions de réserve</Text>
              <View style={styles.counterRow}>
                <View style={styles.counterBox}>
                  <Text style={styles.counterLabel}>Eau potable (Litres)</Text>
                  <Text style={styles.recomText}>Recommandé : 15L min</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setKit((k) => ({ ...k, eau_potable_litres: Math.max(0, k.eau_potable_litres - 5) }))
                      }
                      style={styles.stepperBtn}>
                      <Feather name="minus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                    <Text style={styles.stepperVal}>{kit.eau_potable_litres} L</Text>
                    <Pressable
                      onPress={() => setKit((k) => ({ ...k, eau_potable_litres: k.eau_potable_litres + 5 }))}
                      style={styles.stepperBtn}>
                      <Feather name="plus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.counterBox}>
                  <Text style={styles.counterLabel}>Nourriture (Jours)</Text>
                  <Text style={styles.recomText}>Non-périssable : 3j min</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setKit((k) => ({ ...k, nourriture_jours: Math.max(0, k.nourriture_jours - 1) }))
                      }
                      style={styles.stepperBtn}>
                      <Feather name="minus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                    <Text style={styles.stepperVal}>{kit.nourriture_jours} j</Text>
                    <Pressable
                      onPress={() => setKit((k) => ({ ...k, nourriture_jours: k.nourriture_jours + 1 }))}
                      style={styles.stepperBtn}>
                      <Feather name="plus" size={14} color={Brand.navy.DEFAULT} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Checklist d'équipements */}
              <Text style={styles.subSectionTitle}>Checklist des indispensables</Text>

              {[
                { key: 'medicaments', label: 'Médicaments réguliers & ordonnances', icon: 'plus-circle' },
                { key: 'documents_importants', label: 'Documents d’identité sous plastique étanche', icon: 'file-text' },
                { key: 'lampe_torche', label: 'Lampe torche avec piles de rechange', icon: 'sun' },
                { key: 'batterie_portable', label: 'Batterie externe / Powerbank chargée', icon: 'battery-charging' },
                { key: 'trousse_premiers_secours', label: 'Trousse de premiers secours (pansements, désinfectant)', icon: 'activity' },
                { key: 'vetements_secours', label: 'Vêtements chauds & bottes de pluie au sec', icon: 'archive' },
                { key: 'points_refuge_identifies', label: 'Point de refuge identifié pour la famille', icon: 'map-pin' },
                { key: 'voisins_contactes', label: 'Voisins immédiats prévenus et coordonnés', icon: 'users' },
              ].map((item) => {
                const checked = Boolean((kit as any)[item.key]);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setKit((k) => ({ ...k, [item.key]: !checked }))}
                    style={styles.checkItem}>
                    <View style={[styles.checkCircle, checked && styles.checkCircleActive]}>
                      {checked ? <Feather name="check" size={13} color="#ffffff" /> : null}
                    </View>
                    <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Plan d'évacuation */}
              <Text style={styles.inputLabel}>Plan d'évacuation familial :</Text>
              <TextInput
                style={styles.textArea}
                multiline
                blurOnSubmit={false}
                numberOfLines={2}
                placeholder="Ex: Rassemblement sur le toit ou départ vers l'école Thiaroye..."
                placeholderTextColor={colors.placeholder}
                value={kit.plan_evacuation}
                onChangeText={(text) => setKit((k) => ({ ...k, plan_evacuation: text }))}
              />

              <PrimaryButton
                title={sauvegardeKitEnCours ? 'Enregistrement...' : 'Enregistrer mon kit de survie'}
                onPress={handleSauvegarderKit}
                loading={sauvegardeKitEnCours}
                style={styles.btnAction}
              />
              {succesKit ? (
                <Text style={styles.successMsg}>✓ Kit de survie mis à jour</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* CONTENU ONGLET 3 : CONTACT D'URGENCE */}
        {activeTab === 'contact' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="phone-call" size={17} color="#15803D" />
                <Text style={styles.cardTitle}>Personne à contacter en cas d'urgence</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Cette personne sera notifiée et contactée prioritairement si votre secteur fait l'objet d'une alerte critique.
              </Text>

              <Text style={styles.inputLabel}>Nom complet :</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Awa Ndiaye"
                placeholderTextColor={colors.placeholder}
                value={contact.nom}
                onChangeText={(text) => setContact((c) => ({ ...c, nom: text }))}
              />

              <Text style={styles.inputLabel}>Lien de parenté / Relation :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {RELATIONS.map((r) => {
                  const estChoisi = contact.relation === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setContact((c) => ({ ...c, relation: r.id }))}
                      style={[styles.chip, estChoisi && styles.chipActive]}>
                      <Text style={[styles.chipText, estChoisi && styles.chipTextActive]}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Numéro de téléphone :</Text>
              <TextInput
                style={styles.input}
                placeholder="+221 77 123 45 67"
                keyboardType="phone-pad"
                placeholderTextColor={colors.placeholder}
                value={contact.telephone}
                onChangeText={(text) => setContact((c) => ({ ...c, telephone: text }))}
              />

              <Text style={styles.inputLabel}>Email (optionnel) :</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@exemple.sn"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.placeholder}
                value={contact.email}
                onChangeText={(text) => setContact((c) => ({ ...c, email: text }))}
              />

              <Text style={styles.inputLabel}>Adresse de résidence :</Text>
              <TextInput
                style={styles.input}
                placeholder="Quartier, repère..."
                placeholderTextColor={colors.placeholder}
                value={contact.adresse}
                onChangeText={(text) => setContact((c) => ({ ...c, adresse: text }))}
              />

              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Alerte SMS automatique</Text>
                  <Text style={styles.switchSubtitle}>Prévenir ce contact en cas d'alerte rouge</Text>
                </View>
                <Switch
                  value={contact.alerter_automatiquement}
                  onValueChange={(val) => setContact((c) => ({ ...c, alerter_automatiquement: val }))}
                  trackColor={{ false: Brand.navy[100], true: '#86EFAC' }}
                  thumbColor={contact.alerter_automatiquement ? '#15803D' : '#ffffff'}
                />
              </View>

              <PrimaryButton
                title={sauvegardeContactEnCours ? 'Enregistrement...' : 'Enregistrer le contact d’urgence'}
                onPress={handleSauvegarderContact}
                loading={sauvegardeContactEnCours}
                style={styles.btnAction}
              />
              {succesContact ? (
                <Text style={styles.successMsg}>✓ Contact d’urgence enregistré avec succès</Text>
              ) : null}
            </View>

            {/* Raccourcis d'urgence fixes */}
            <Text style={styles.sectionTitle}>Numéros d'urgence nationaux & secours</Text>
            <View style={styles.card}>
              <Pressable onPress={() => dialNumber('18')} style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Feather name="phone-call" size={16} color="#DC2626" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.infoLabel}>Sapeurs-Pompiers (Inondations / Sauvetage)</Text>
                  <Text style={styles.infoVal}>18 (Appel gratuit 24h/24)</Text>
                </View>
                <Feather name="phone-forwarded" size={15} color={Brand.navy[400]} />
              </Pressable>

              <Pressable onPress={() => dialNumber('15')} style={[styles.infoRow, styles.borderTop]}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <Feather name="phone" size={16} color="#4338CA" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.infoLabel}>SAMU National (Urgences médicales)</Text>
                  <Text style={styles.infoVal}>15</Text>
                </View>
                <Feather name="phone-forwarded" size={15} color={Brand.navy[400]} />
              </Pressable>

              <Pressable onPress={() => dialNumber('17')} style={[styles.infoRow, styles.borderTop]}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Feather name="shield" size={16} color="#15803D" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.infoLabel}>Police & Gendarmerie</Text>
                  <Text style={styles.infoVal}>17</Text>
                </View>
                <Feather name="phone-forwarded" size={15} color={Brand.navy[400]} />
              </Pressable>
            </View>
          </View>
        )}

        {/* CONTENU ONGLET 4 : MES SIGNALEMENTS */}
        {activeTab === 'signalements' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="layers" size={17} color={Brand.navy.DEFAULT} />
                <Text style={styles.cardTitle}>Historique de mes signalements</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Retrouvez tous les signalements de montée des eaux ou de dégâts que vous avez partagés.
              </Text>

              {signalements.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Feather name="info" size={16} color={Brand.navy[400]} />
                  <Text style={styles.emptyText}>Vous n'avez pas encore envoyé de signalement.</Text>
                </View>
              ) : (
                signalements.map((s) => (
                  <View key={s.id} style={styles.sigItem}>
                    <View style={styles.sigHeader}>
                      <Text style={styles.sigCat}>{s.categorie_display || s.categorie}</Text>
                      <View
                        style={[
                          styles.sigStatusBadge,
                          { backgroundColor: s.valide ? '#DCFCE7' : '#FEF3C7' },
                        ]}>
                        <Text
                          style={[
                            styles.sigStatusText,
                            { color: s.valide ? '#166534' : '#92400E' },
                          ]}>
                          {s.valide ? '✓ Validé' : '⏳ En attente'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sigDesc}>{s.description}</Text>
                    <View style={styles.sigMetaRow}>
                      <Text style={styles.sigDate}>
                        🕒 {formatDateHeureSignalement(s.date_creation)}
                      </Text>
                      {s.niveau_eau_display || s.niveau_eau ? (
                        <Text style={styles.sigWater}>
                          💧 Niveau : {s.niveau_eau_display || s.niveau_eau}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}

              <Pressable
                onPress={() => router.push('/(app)/signaler' as any)}
                style={styles.btnNouveauSignalement}>
                <Feather name="plus-circle" size={16} color="#ffffff" />
                <Text style={styles.btnNouveauSignalementText}>Envoyer un nouveau signalement</Text>
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 50 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 13, color: colors.textMuted },

    headerCard: {
      backgroundColor: colors.card,
      borderRadius: Radius.xl,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      ...Shadow.card,
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 22, fontWeight: '800', color: isDark ? Brand.navy.DEFAULT : '#FFFFFF' },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 17, fontWeight: '800', color: colors.text },
    logoutIconBtn: { padding: 6 },
    themeToggleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    badgeRole: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.pill,
    },
    badgeRoleText: { fontSize: 11, fontWeight: '700', color: isDark ? '#FFFFFF' : Brand.navy[600] },
    badgeRelais: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.pill,
    },
    badgeRelaisText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
    zoneText: { fontSize: 11.5, color: colors.textMuted, marginTop: 4 },

    // Emplacement des 4 carrés de navigation sur la même ligne
    gridTabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: Radius.xl,
      padding: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      ...Shadow.card,
    },
    gridTabSquare: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Brand.navy[900] : Brand.background,
      borderRadius: Radius.md,
      paddingVertical: 10,
      paddingHorizontal: 2,
      borderWidth: 1.2,
      borderColor: colors.border,
      minHeight: 74,
    },
    gridTabSquareActive: {
      backgroundColor: Brand.red.DEFAULT,
      borderColor: Brand.red.DEFAULT,
    },
    tabIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? Brand.navy.DEFAULT : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    tabIconCircleActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    iconWithBadgeWrapper: {
      position: 'relative',
      alignItems: 'center',
    },
    tabSquareBadge: {
      position: 'absolute',
      top: -3,
      right: -6,
      backgroundColor: Brand.red.DEFAULT,
      borderRadius: Radius.pill,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#ffffff',
    },
    tabSquareBadgeActive: {
      backgroundColor: '#ffffff',
      borderColor: Brand.red.DEFAULT,
    },
    tabSquareBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#ffffff',
    },
    tabSquareBadgeTextActive: {
      color: Brand.red.DEFAULT,
    },
    gridTabLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : Brand.navy[700],
      textAlign: 'center',
      letterSpacing: -0.2,
    },
    gridTabLabelActive: {
      color: '#ffffff',
      fontWeight: '800',
    },

    // Cartes
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.xl,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      ...Shadow.card,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 16 },

    subSectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 14, marginBottom: 10 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 10, marginBottom: 6 },

    chipsScroll: { marginBottom: 12 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: Radius.pill,
      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: Brand.red.DEFAULT,
      borderColor: Brand.red.DEFAULT,
    },
    chipText: { fontSize: 12, fontWeight: '600', color: isDark ? '#FFFFFF' : Brand.navy[700] },
    chipTextActive: { color: '#ffffff', fontWeight: '800' },

    counterRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 12 },
    counterBox: {
      flex: 1,
      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
      padding: 12,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    counterLabel: { fontSize: 11.5, fontWeight: '700', color: colors.text },
    recomText: { fontSize: 10, color: colors.textMuted, marginTop: 1, marginBottom: 6 },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    stepperBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? Brand.navy[800] : '#ffffff',
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperVal: { fontSize: 15, fontWeight: '800', color: colors.text },

    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    borderTop: { borderTopWidth: 1, borderTopColor: colors.border },
    switchTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
    switchSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

    input: {
      height: 44,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.text,
      backgroundColor: isDark ? Brand.navy[900] : '#ffffff',
      marginBottom: 8,
    },
    textArea: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: 12,
      fontSize: 13,
      color: colors.text,
      backgroundColor: isDark ? Brand.navy[900] : '#ffffff',
      textAlignVertical: 'top',
      minHeight: 70,
      marginBottom: 12,
    },

    btnAction: { marginTop: 10 },
    successMsg: {
      color: '#15803D',
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 8,
    },

    // Relais
    relaisActiveBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? Brand.navy[900] : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDark ? Brand.navy[700] : '#BBF7D0',
      borderRadius: Radius.lg,
      padding: 12,
      marginTop: 6,
    },
    relaisQuartierNom: { fontSize: 13, fontWeight: '700', color: colors.text },
    relaisStatusText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    btnDesinscription: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Brand.red.DEFAULT,
    },
    btnDesinscriptionText: { fontSize: 11, fontWeight: '700', color: Brand.red.DEFAULT },
    btnRelais: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT,
      paddingVertical: 12,
      borderRadius: Radius.md,
      marginTop: 8,
    },
    btnRelaisText: { color: isDark ? Brand.navy.DEFAULT : '#ffffff', fontSize: 13, fontWeight: '700' },

    // Jauge Kit
    jaugeBox: {
      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
      padding: 14,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    jaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    jaugeTitre: { fontSize: 13, fontWeight: '800', color: colors.text },
    jaugeValeur: { fontSize: 18, fontWeight: '900' },
    jaugeTrack: {
      height: 9,
      backgroundColor: isDark ? Brand.navy[800] : Brand.navy[100],
      borderRadius: Radius.pill,
      marginVertical: 8,
      overflow: 'hidden',
    },
    jaugeFill: { height: '100%', borderRadius: Radius.pill },
    jaugeConseil: { fontSize: 11.5, color: colors.textMuted, fontStyle: 'italic' },

    // Check items
    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Brand.navy[900] : '#ffffff',
    },
    checkCircleActive: {
      backgroundColor: Brand.red.DEFAULT,
      borderColor: Brand.red.DEFAULT,
    },
    checkLabel: { fontSize: 12.5, color: colors.text, flex: 1 },
    checkLabelActive: { fontWeight: '700', color: colors.text },

    // Contact d'urgence
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    iconCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 12, fontWeight: '700', color: colors.text },
    infoVal: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 8, marginTop: 4 },

    // Signalements
    emptyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
    emptyText: { fontSize: 12, color: colors.textMuted },
    sigItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sigHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    sigCat: { fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
    sigStatusBadge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: Radius.pill },
    sigStatusText: { fontSize: 10.5, fontWeight: '800' },
    sigDesc: { fontSize: 12.5, color: isDark ? Brand.navy[100] : Brand.navy[600], lineHeight: 17 },
    sigMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    sigDate: { fontSize: 10.5, color: colors.textMuted },
    sigWater: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
    btnNouveauSignalement: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Brand.red.DEFAULT,
      paddingVertical: 12,
      borderRadius: Radius.lg,
      marginTop: 16,
    },
    btnNouveauSignalementText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  });
}
