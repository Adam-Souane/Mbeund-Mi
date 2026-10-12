import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../../screens/LoginScreen';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLoginSubmit = async (data: { username: string; password: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      // Appelle le context qui gère l'API
      await login(data.username, data.password);
      // Redirige vers l'accueil
      router.replace('/(app)' as any);
    } catch (err: any) {
      console.error(err);
      const refus = err.response?.data;
      if (refus?.code === 'compte_non_verifie') {
        // Redirige vers l'écran OTP
        router.push({
          pathname: '/(auth)/otp' as any,
          params: { 
            username: refus.username,
            password: data.password,
            canal: refus.otp?.canal,
            destination: refus.otp?.destination,
            email_disponible: refus.otp?.email_disponible ? 'true' : 'false',
          }
        });
        return;
      }
      const errData = err.response?.data;
      if (errData?.detail) {
        setError(errData.detail);
      } else if (errData?.non_field_errors) {
        setError(Array.isArray(errData.non_field_errors) ? errData.non_field_errors[0] : String(errData.non_field_errors));
      } else if (typeof errData === 'object' && Object.keys(errData).length > 0) {
        const k = Object.keys(errData)[0];
        const val = errData[k];
        setError(`${k}: ${Array.isArray(val) ? val[0] : String(val)}`);
      } else {
        setError("Identifiant ou mot de passe incorrect.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen
      onLoginSubmit={handleLoginSubmit}
      onForgotPassword={() => router.push('/(auth)/forgot-password' as any)}
      onSignup={() => router.push('/(auth)/signup' as any)}
      loading={loading}
      error={error}
    />
  );
}
