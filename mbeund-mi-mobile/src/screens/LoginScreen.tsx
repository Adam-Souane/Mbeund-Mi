import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { CustomTextInput, PrimaryButton, ScreenWrapper, Logo } from '@/components';
import { Brand, Radius, Shadow } from '@/constants/brand';

type Props = {
  onLoginSubmit: (data: { username: string; password: string }) => void;
  onForgotPassword?: () => void;
  onSignup?: () => void;
  loading?: boolean;
  error?: string;
};

const CITOYEN_ROLE = { id: 'citoyen', label: 'Citoyen', fieldLabel: 'Identifiant', placeholder: 'Ex : fatoudiop' };

export default function LoginScreen({ onLoginSubmit, onForgotPassword, onSignup, loading = false, error }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const valid = username.trim().length > 0 && password.length > 0;

  return (
    <ScreenWrapper scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Logo size="md" withSlogan />
        <Text style={styles.title}>Connexion Citoyen</Text>
        <Text style={styles.subtitle}>Connectez-vous pour signaler et suivre les inondations</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.formGroup}>
          <CustomTextInput
            label={CITOYEN_ROLE.fieldLabel}
            placeholder={CITOYEN_ROLE.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <CustomTextInput
            label="Mot de passe"
            placeholder="Votre mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        <View style={styles.forgotRow}>
          <Pressable onPress={onForgotPassword} hitSlop={8}>
            <Text style={styles.forgotRed}>Mot de passe oublié ?</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Se connecter"
          onPress={() => onLoginSubmit({ username: username.trim(), password })}
          disabled={!valid}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footer}>Pas encore de compte ? </Text>
          <Pressable onPress={onSignup} hitSlop={8}>
            <Text style={styles.signupText}>Créer un compte</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.copyright}>MBEUND MI - Thiaroye-sur-Mer</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingVertical: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 20 },
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
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.navy[50],
    ...Shadow.card,
  },
  formGroup: { marginBottom: 14 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 18 },
  forgotRed: { fontSize: 12, fontWeight: '600', color: Brand.red.DEFAULT },
  forgotGray: { fontSize: 12, color: Brand.navy[500] },
  errorBox: {
    backgroundColor: Brand.red[50],
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, color: Brand.red.DEFAULT },
  button: { marginBottom: 16 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: Brand.navy[500],
  },
  signupText: {
    fontWeight: '700',
    color: Brand.red.DEFAULT,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 11,
    color: Brand.navy[400],
    marginTop: 20,
  },
});
