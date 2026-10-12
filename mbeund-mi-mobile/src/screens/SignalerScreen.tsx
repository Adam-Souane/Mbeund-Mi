import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const CATEGORIES = [
  { id: 'inondation', label: 'Inondation', icon: 'droplet' as const },
  { id: 'egouts', label: 'Égouts', icon: 'alert-triangle' as const },
  { id: 'autre', label: 'Autre', icon: 'info' as const },
];

const THIAROYE_COORDS = { lat: 14.75, lon: -17.38 };

type Props = {
  onSuccess?: () => void;
};

export default function SignalerScreen({ onSuccess }: Props) {
  const { token } = useAuth();
  const { colors, isDark } = useTheme();
  const [categorie, setCategorie] = useState('inondation');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const prendrePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à l'appareil photo est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const choisirDepuisGalerie = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Champ requis', 'Veuillez décrire brièvement la situation observée.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('categorie', categorie);
      formData.append('description', description.trim());
      formData.append('localisation', `${THIAROYE_COORDS.lon},${THIAROYE_COORDS.lat}`);

      if (imageUri) {
        const nomFichier = imageUri.split('/').pop() || 'signalement.jpg';
        const type = nomFichier.endsWith('.png') ? 'image/png' : 'image/jpeg';
        formData.append('photo', {
          uri: imageUri,
          name: nomFichier,
          type,
        } as any);
      }

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(`${API_URL}/signalements/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders,
        },
      });

      setSuccess(true);
      setDescription('');
      setImageUri(null);
    } catch (error: any) {
      console.error('Erreur signalement:', error);
      const detail = error.response?.data?.detail || error.response?.data?.localisation || "Impossible d'enregistrer le signalement.";
      Alert.alert('Erreur', typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Feather name="check-circle" size={48} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Signalement envoyé</Text>
          <Text style={[styles.successText, { color: colors.textMuted }]}>
            Merci pour votre contribution citoyenne. Une autorité va examiner et valider votre signalement prochainement.
          </Text>
          <Pressable
            onPress={() => {
              setSuccess(false);
              onSuccess?.();
            }}
            style={[
              styles.btnPrimary,
              { backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT },
            ]}
          >
            <Text
              style={[
                styles.btnPrimaryText,
                { color: isDark ? Brand.navy.DEFAULT : '#ffffff' },
              ]}
            >
              Retour à l'accueil
            </Text>
          </Pressable>
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
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
        {/* En-tête (Identique au Web SignalerPageBody) */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Nouveau signalement</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Décrivez ce que vous observez — une autorité le validera avant publication.
          </Text>
        </View>

        {/* Position GPS */}
        <View style={[styles.zoneBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={14} color={Brand.red.DEFAULT} />
          <Text style={[styles.zoneBadgeText, { color: colors.text }]}>
            Position : Thiaroye-sur-Mer ({THIAROYE_COORDS.lat}, {THIAROYE_COORDS.lon})
          </Text>
        </View>

        {/* Catégorie */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Catégorie</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map((c) => {
            const active = categorie === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategorie(c.id)}
                style={[
                  styles.catCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && (isDark ? { backgroundColor: Brand.navy[800], borderColor: Brand.red.DEFAULT } : styles.catCardActive),
                ]}
              >
                <Feather
                  name={c.icon}
                  size={18}
                  color={active ? Brand.red.DEFAULT : colors.textMuted}
                />
                <Text
                  style={[
                    styles.catLabel,
                    { color: colors.textMuted },
                    active && styles.catLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Ex : Eau stagnante devant l'école primaire, environ 30 cm."
          placeholderTextColor={colors.placeholder}
          multiline
          blurOnSubmit={false}
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        {/* Photo du problème - Section aérée, pleine largeur, aucun chevauchement de texte */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Photo (optionnelle)</Text>
        {imageUri ? (
          <View style={[styles.imagePreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={[styles.previewActions, { borderTopColor: colors.border }]}>
              <Pressable onPress={choisirDepuisGalerie} style={styles.previewBtnChange}>
                <Feather name="refresh-cw" size={14} color={colors.text} />
                <Text style={[styles.previewBtnText, { color: colors.text }]}>Changer</Text>
              </Pressable>
              <Pressable onPress={() => setImageUri(null)} style={styles.previewBtnDelete}>
                <Feather name="trash-2" size={14} color="#DC2626" />
                <Text style={[styles.previewBtnText, { color: '#DC2626' }]}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.photoContainer}>
            {/* Option 1: Prendre une photo */}
            <Pressable
              onPress={prendrePhoto}
              style={[styles.photoOptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.photoIconCircle, { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] }]}>
                <Feather name="camera" size={20} color={colors.text} />
              </View>
              <View style={styles.photoTextCol}>
                <Text style={[styles.photoTitle, { color: colors.text }]}>Prendre une photo</Text>
                <Text style={[styles.photoSubtitle, { color: colors.textMuted }]}>Utiliser l'appareil photo du téléphone</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Option 2: Choisir dans la galerie */}
            <Pressable
              onPress={choisirDepuisGalerie}
              style={[styles.photoOptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.photoIconCircle, { backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50] }]}>
                <Feather name="image" size={20} color={colors.text} />
              </View>
              <View style={styles.photoTextCol}>
                <Text style={[styles.photoTitle, { color: colors.text }]}>Choisir dans la galerie</Text>
                <Text style={[styles.photoSubtitle, { color: colors.textMuted }]}>Sélectionner un fichier de votre appareil</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Bouton de soumission */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Feather name="send" size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>Envoyer le signalement</Text>
            </>
          )}
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  header: { marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT },
  subtitle: { fontSize: 12, color: Brand.navy[500], marginTop: 2, lineHeight: 17 },

  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  zoneBadgeText: { fontSize: 11, fontWeight: '700', color: Brand.red.DEFAULT },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: Brand.navy.DEFAULT, marginBottom: 8 },

  catRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderColor: Brand.navy[100],
    gap: 6,
    ...Shadow.card,
  },
  catCardActive: {
    borderColor: Brand.red.DEFAULT,
    backgroundColor: Brand.red[50],
  },
  catLabel: { fontSize: 12, fontWeight: '600', color: Brand.navy[600], textAlign: 'center' },
  catLabelActive: { color: Brand.red.DEFAULT, fontWeight: '700' },

  textArea: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    padding: 12,
    fontSize: 13,
    color: Brand.navy.DEFAULT,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 18,
    ...Shadow.card,
  },

  // Conteneur Photo entièrement revu : 2 cartes empilées spacieuses
  photoContainer: {
    gap: 10,
    marginBottom: 24,
  },
  photoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Shadow.card,
  },
  photoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Brand.navy[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  photoTextCol: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.navy.DEFAULT,
  },
  photoSubtitle: {
    fontSize: 11,
    color: Brand.navy[400],
    marginTop: 1,
  },

  imagePreviewCard: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    padding: 10,
    marginBottom: 24,
    ...Shadow.card,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.navy[100],
  },
  previewBtnChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.navy.DEFAULT,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.red.DEFAULT,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: Brand.navy.DEFAULT, marginBottom: 8 },
  successText: { fontSize: 13, color: Brand.navy[500], textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  btnPrimary: {
    backgroundColor: Brand.navy.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
  },
  btnPrimaryText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});
