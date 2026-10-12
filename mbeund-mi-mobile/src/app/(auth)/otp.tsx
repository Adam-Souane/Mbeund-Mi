import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OtpScreen from '../../screens/OtpScreen';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

export default function Otp() {
  const router = useRouter();
  const { verifyOtp, resendOtp, login } = useAuth();
  
  const params = useLocalSearchParams<{
    username: string;
    password?: string;
    canal?: string;
    destination?: string;
    email_disponible?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [currentCanal, setCurrentCanal] = useState(params.canal || 'telephone');
  const [currentDestination, setCurrentDestination] = useState(params.destination || '');
  const [emailDisponible, setEmailDisponible] = useState(params.email_disponible === 'true');

  const handleOtpSubmit = async (code: string) => {
    if (!params.username) return;
    setLoading(true);
    setError(undefined);
    try {
      await verifyOtp(params.username, code);
      // Une fois vérifié, on doit se connecter avec le password si fourni
      if (params.password) {
        await login(params.username, params.password);
        router.replace('/(app)' as any);
      } else {
        // Redirige vers login s'il manque le mdp
        router.replace('/(auth)/login' as any);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Code OTP invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (canalDemande: string) => {
    if (!params.username) return;
    setLoading(true);
    setError(undefined);
    try {
      const data = await resendOtp(params.username, canalDemande);
      setCurrentCanal(data.canal);
      setCurrentDestination(data.destination);
      if (data.canal === 'email') {
        setEmailDisponible(true);
      }
      Alert.alert("Code envoyé", (data as any).detail || `Un nouveau code a été envoyé par ${data.canal}.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  if (!params.username) {
    return null;
  }

  return (
    <OtpScreen
      username={params.username}
      canal={currentCanal}
      destination={currentDestination}
      emailDisponible={emailDisponible}
      onOtpSubmit={handleOtpSubmit}
      onResend={handleResend}
      onBack={() => router.back()}
      loading={loading}
      error={error}
    />
  );
}
