import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { CustomTextInput, PrimaryButton, ScreenWrapper, Logo } from '@/components';
import { Brand, Radius, Shadow } from '@/constants/brand';
import { RegisterData } from '@/context/AuthContext';

type Props = {
  onSignupSubmit: (data: RegisterData) => void;
  onGoToLogin: () => void;
  loading?: boolean;
  error?: string;
};

export default function SignupScreen({ onSignupSubmit, onGoToLogin, loading = false, error }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [canalOtp, setCanalOtp] = useState<'telephone' | 'email'>('telephone');
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto-génération de suggestion d'identifiant quand prénom et nom sont saisis
  const handleNameChange = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    if (!username && first.trim() && last.trim()) {
      const cleanFirst = first.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = last.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(`${cleanFirst}${cleanLast}`);
    }
  };

  const handleSubmit = () => {
    setLocalError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError('Prénom et nom requis.');
      return;
    }
    if (!username.trim()) {
      setLocalError('Identifiant requis.');
      return;
    }
    if (!telephone.trim()) {
      setLocalError('Numéro de téléphone requis.');
      return;
    }
    if (canalOtp === 'email' && !email.trim()) {
      setLocalError('Renseignez un email pour recevoir le code par email.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirm) {
      setLocalError('Les mots de passe ne correspondent pas.');
      return;
    }

    onSignupSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim().toLowerCase(),
      telephone: telephone.trim(),
      email: email.trim() || undefined,
      password,
      canal_otp: canalOtp,
    });
  };

  const displayedError = error || localError;

  return (
    <ScreenWrapper scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Logo size="md" withSlogan />
        <Text style={styles.title}>Inscription Citoyen</Text>
        <Text style={styles.subtitle}>Créez votre compte pour être alerté et signaler les inondations</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.formGroup, styles.col]}>
            <CustomTextInput
              label="Prénom"
              placeholder="Ex : Fatou"
              value={firstName}
              onChangeText={(val) => handleNameChange(val, lastName)}
              editable={!loading}
            />
          </View>
          <View style={[styles.formGroup, styles.col]}>
            <CustomTextInput
              label="Nom"
              placeholder="Ex : Diop"
              value={lastName}
              onChangeText={(val) => handleNameChange(firstName, val)}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Identifiant de connexion"
            placeholder="Ex : fatoudiop"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
          <Text style={styles.helperText}>Votre nom d'utilisateur unique sur Mbeund-Mi</Text>
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Numéro de téléphone (+221)"
            placeholder="77 123 45 67"
            keyboardType="phone-pad"
            value={telephone}
            onChangeText={setTelephone}
            editable={!loading}
          />
          <Text style={styles.helperText}>Nécessaire pour recevoir les alertes inondation</Text>
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Email (facultatif)"
            placeholder="exemple@domaine.sn"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.sectionLabel}>Canal de réception du code de vérification :</Text>
          <View style={styles.canalRow}>
            <Pressable
              onPress={() => setCanalOtp('telephone')}
              style={[styles.canalCard, canalOtp === 'telephone' && styles.canalCardActive]}>
              <Feather
                name="message-square"
                size={20}
                color={canalOtp === 'telephone' ? Brand.navy.DEFAULT : Brand.navy[400]}
              />
              <Text style={[styles.canalText, canalOtp === 'telephone' && styles.canalTextActive]}>
                Par SMS
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCanalOtp('email')}
              style={[styles.canalCard, canalOtp === 'email' && styles.canalCardActive]}>
              <Feather
                name="mail"
                size={20}
                color={canalOtp === 'email' ? Brand.navy.DEFAULT : Brand.navy[400]}
              />
              <Text style={[styles.canalText, canalOtp === 'email' && styles.canalTextActive]}>
                Par Email
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Mot de passe"
            placeholder="Min. 8 caractères"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Confirmer le mot de passe"
            placeholder="Répétez le mot de passe"
            secureTextEntry
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            editable={!loading}
          />
        </View>

        {displayedError ? (
          <View style={styles.errorBox}>
            <Feather name="alert-triangle" size={16} color={Brand.red.DEFAULT} />
            <Text style={styles.errorText}>{displayedError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Créer mon compte citoyen"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footer}>Déjà inscrit ? </Text>
          <Pressable onPress={onGoToLogin} hitSlop={8}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.copyright}>MBEUND MI - Thiaroye-sur-Mer</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 16, paddingBottom: 80 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT, marginTop: 10 },
  subtitle: {
    fontSize: 12,
    color: Brand.navy[500],
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.navy[50],
    ...Shadow.card,
  },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  formGroup: { marginBottom: 12 },
  helperText: { fontSize: 11, color: Brand.navy[400], marginTop: 2, marginLeft: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Brand.navy.DEFAULT, marginBottom: 6 },
  canalRow: { flexDirection: 'row', gap: 10 },
  canalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: Brand.navy[100],
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
  },
  canalCardActive: {
    borderColor: Brand.navy.DEFAULT,
    backgroundColor: Brand.navy[50],
  },
  canalText: { fontSize: 12, fontWeight: '600', color: Brand.navy[400] },
  canalTextActive: { color: Brand.navy.DEFAULT, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.red[50],
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12, color: Brand.red.DEFAULT },
  button: { marginBottom: 14, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footer: { fontSize: 12, color: Brand.navy[500] },
  loginLink: { fontSize: 12, fontWeight: '700', color: Brand.red.DEFAULT },
  copyright: {
    textAlign: 'center',
    fontSize: 11,
    color: Brand.navy[400],
    marginTop: 16,
    marginBottom: 20,
  },
});
