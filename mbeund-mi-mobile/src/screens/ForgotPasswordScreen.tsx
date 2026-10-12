import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';

import { CustomTextInput, PrimaryButton, ScreenWrapper, Logo } from '@/components';
import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL } from '@/context/AuthContext';

type Props = {
  onBackToLogin: () => void;
};

export default function ForgotPasswordScreen({ onBackToLogin }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifiant, setIdentifiant] = useState('');
  const [canal, setCanal] = useState<'telephone' | 'email'>('telephone');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleDemanderCode = async () => {
    setError(null);
    if (!identifiant.trim()) {
      setError('Veuillez saisir votre identifiant, téléphone ou email.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/password-reset/`, {
        identifiant: identifiant.trim(),
        canal,
      });
      setMessage(res.data.detail || 'Code envoyé.');
      setStep(2);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmer = async () => {
    setError(null);
    if (code.trim().length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/users/confirm-password-reset/`, {
        identifiant: identifiant.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll contentStyle={styles.content}>
      <Pressable onPress={onBackToLogin} style={styles.backBtn} hitSlop={12}>
        <Feather name="arrow-left" size={18} color={Brand.navy.DEFAULT} />
        <Text style={styles.backText}>Retour à la connexion</Text>
      </Pressable>

      <View style={styles.header}>
        <Logo size="md" withSlogan />
        <Text style={styles.title}>
          {step === 1 && 'Mot de passe oublié ?'}
          {step === 2 && 'Nouveau mot de passe'}
          {step === 3 && 'Mot de passe modifié'}
        </Text>
      </View>

      <View style={styles.card}>
        {step === 1 && (
          <>
            <Text style={styles.instruction}>
              Entrez votre identifiant, numéro de téléphone ou email pour recevoir un code de vérification.
            </Text>

            <View style={styles.formGroup}>
              <CustomTextInput
                label="Identifiant, téléphone ou email"
                placeholder="Ex : 77 123 45 67 ou fatoudiop"
                value={identifiant}
                onChangeText={setIdentifiant}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.sectionLabel}>Recevoir le code :</Text>
              <View style={styles.canalRow}>
                <Pressable
                  onPress={() => setCanal('telephone')}
                  style={[styles.canalCard, canal === 'telephone' && styles.canalCardActive]}>
                  <Feather
                    name="message-square"
                    size={18}
                    color={canal === 'telephone' ? Brand.navy.DEFAULT : Brand.navy[400]}
                  />
                  <Text style={[styles.canalText, canal === 'telephone' && styles.canalTextActive]}>
                    Par SMS
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCanal('email')}
                  style={[styles.canalCard, canal === 'email' && styles.canalCardActive]}>
                  <Feather
                    name="mail"
                    size={18}
                    color={canal === 'email' ? Brand.navy.DEFAULT : Brand.navy[400]}
                  />
                  <Text style={[styles.canalText, canal === 'email' && styles.canalTextActive]}>
                    Par Email
                  </Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={Brand.red.DEFAULT} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Envoyer le code"
              onPress={handleDemanderCode}
              loading={loading}
              style={styles.btn}
            />
          </>
        )}

        {step === 2 && (
          <>
            {message ? <Text style={styles.successNotice}>{message}</Text> : null}

            <View style={styles.formGroup}>
              <CustomTextInput
                label="Code à 6 chiffres"
                placeholder="Ex : 123456"
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <CustomTextInput
                label="Nouveau mot de passe"
                placeholder="8 caractères minimum"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <CustomTextInput
                label="Confirmer le nouveau mot de passe"
                placeholder="Confirmez le mot de passe"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={Brand.red.DEFAULT} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Enregistrer le mot de passe"
              onPress={handleConfirmer}
              loading={loading}
              style={styles.btn}
            />

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>Renvoyer le code dans {resendTimer}s</Text>
              ) : (
                <Pressable onPress={handleDemanderCode}>
                  <Text style={styles.resendLink}>Renvoyer un nouveau code</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {step === 3 && (
          <View style={styles.step3}>
            <View style={styles.iconCircle}>
              <Feather name="check" size={32} color="#16A34A" />
            </View>
            <Text style={styles.step3Title}>Mot de passe réinitialisé !</Text>
            <Text style={styles.step3Sub}>
              Votre mot de passe a bien été mis à jour. Vous pouvez maintenant vous connecter à votre compte citoyen.
            </Text>
            <PrimaryButton
              title="Se connecter"
              onPress={onBackToLogin}
              style={styles.btn}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 13, fontWeight: '600', color: Brand.navy.DEFAULT },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT, marginTop: 10 },
  instruction: { fontSize: 13, color: Brand.navy[600], marginBottom: 16, lineHeight: 18 },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.navy[50],
    ...Shadow.card,
  },
  formGroup: { marginBottom: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Brand.navy.DEFAULT, marginBottom: 8 },
  canalRow: { flexDirection: 'row', gap: 12 },
  canalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Brand.navy[100],
    borderRadius: Radius.lg,
    backgroundColor: Brand.surface,
  },
  canalCardActive: { borderColor: Brand.navy.DEFAULT, backgroundColor: Brand.navy[50] },
  canalText: { fontSize: 13, fontWeight: '600', color: Brand.navy[400] },
  canalTextActive: { color: Brand.navy.DEFAULT, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.red[50],
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: Brand.red.DEFAULT },
  successNotice: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: 12,
    borderRadius: Radius.md,
    fontSize: 13,
    marginBottom: 16,
  },
  btn: { marginTop: 6, marginBottom: 12 },
  resendRow: { alignItems: 'center', marginTop: 10 },
  timerText: { fontSize: 12, color: Brand.navy[400] },
  resendLink: { fontSize: 13, fontWeight: '700', color: Brand.navy.DEFAULT },
  step3: { alignItems: 'center', paddingVertical: 16 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  step3Title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT, marginBottom: 8 },
  step3Sub: { fontSize: 13, color: Brand.navy[500], textAlign: 'center', marginBottom: 24, lineHeight: 18 },
});
