import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { PrimaryButton, ScreenWrapper, Logo } from '@/components';
import { Brand, Radius, Shadow } from '@/constants/brand';

const CODE_LENGTH = 6;
const DELAI_RENVOI = 60;

type Props = {
  username: string;
  canal: string;
  destination?: string;
  emailDisponible?: boolean;
  onOtpSubmit: (code: string) => void;
  onResend?: (canalDemande: string) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
};

const LIBELLE_CANAL: Record<string, string> = { telephone: 'par SMS', email: 'par email' };

export default function OtpScreen({
  username,
  canal,
  destination,
  emailDisponible = false,
  onOtpSubmit,
  onResend,
  onBack,
  loading = false,
  error,
}: Props) {
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(DELAI_RENVOI);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const complete = code.length === CODE_LENGTH;

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) onOtpSubmit(next);
  };

  const handleResend = (c: string) => {
    setCode('');
    setResendTimer(DELAI_RENVOI);
    onResend?.(c);
    inputRef.current?.focus();
  };

  const enAttente = resendTimer > 0;
  const autreCanal = canal === 'email' ? 'telephone' : 'email';
  const peutChangerDeCanal = Boolean(emailDisponible);
  
  return (
    <ScreenWrapper scroll contentStyle={styles.content}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
          <Feather name="arrow-left" size={18} color={Brand.navy[600]} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      ) : null}

      <View style={styles.header}>
        <Logo size="lg" />
        <Text style={styles.title}>Vérifier votre identité</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.banner}>
          <Feather name="clock" size={20} color="#2563EB" style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Code envoyé {LIBELLE_CANAL[canal] || canal}</Text>
            {destination ? (
              <Text style={styles.bannerSub}>
                {canal === 'email' ? `Adresse : ${destination} (vérifiez vos spams)` : `Numéro : ${destination}`}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.label}>Code à 6 chiffres</Text>
        <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes}>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const char = code[i];
            const active = i === Math.min(code.length, CODE_LENGTH - 1);
            return (
              <View
                key={i}
                style={[styles.box, char && styles.boxFilled, active && styles.boxActive, !!error && styles.boxError]}>
                <Text style={styles.boxText}>{char ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
            style={styles.hiddenInput}
          />
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title="Vérifier le code"
          onPress={() => onOtpSubmit(code)}
          disabled={!complete}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendHint}>Vous n’avez pas reçu le code ?</Text>
          <Pressable onPress={() => !enAttente && !loading && handleResend(canal)} disabled={enAttente || loading}>
            <Text style={[styles.resendLink, enAttente && styles.resendDisabled]}>
              {enAttente ? `Renvoyer dans ${resendTimer} s` : `Renvoyer le code ${LIBELLE_CANAL[canal] || ''}`}
            </Text>
          </Pressable>
          {peutChangerDeCanal && !enAttente && !loading ? (
            <Pressable onPress={() => handleResend(autreCanal)} style={styles.switchButton}>
              <Text style={styles.switchText}>
                {canal === 'telephone' ? '✉️ Recevoir plutôt par email' : '📱 Recevoir plutôt par SMS'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 16, gap: 6 },
  backText: { fontSize: 13, fontWeight: '600', color: Brand.navy[600] },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: Brand.navy.DEFAULT, marginTop: 10 },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.navy[50],
    ...Shadow.card,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 18,
  },
  bannerIcon: { marginRight: 10, marginTop: 2 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
  bannerSub: { fontSize: 12, color: '#1D4ED8', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '700', color: Brand.navy[700], marginBottom: 8 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  box: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1.2,
    borderColor: Brand.navy[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: Brand.navy.DEFAULT, backgroundColor: Brand.navy[50] },
  boxActive: { borderColor: Brand.red.DEFAULT, backgroundColor: '#ffffff' },
  boxError: { borderColor: Brand.red.DEFAULT, backgroundColor: Brand.red[50] },
  boxText: { fontSize: 22, fontWeight: '700', color: Brand.navy.DEFAULT },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  error: { marginTop: 10, fontSize: 12, color: Brand.red.DEFAULT, textAlign: 'center' },
  button: { marginTop: 20 },
  resendContainer: { alignItems: 'center', marginTop: 20, gap: 8 },
  resendHint: { fontSize: 12, color: Brand.navy[400] },
  resendLink: { fontSize: 13, fontWeight: '700', color: Brand.red.DEFAULT },
  resendDisabled: { color: Brand.navy[300] },
  switchButton: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 10 },
  switchText: { fontSize: 12, fontWeight: '600', color: Brand.navy[600], textDecorationLine: 'underline' },
});
