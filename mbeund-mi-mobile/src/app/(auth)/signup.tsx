import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import SignupScreen from '../../screens/SignupScreen';
import { useAuth, RegisterData } from '../../context/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSignupSubmit = async (data: RegisterData) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await register(data);
      const infosOtp = response?.otp || {};

      // Redirection vers l'écran de validation OTP avec les données nécessaires
      router.push({
        pathname: '/(auth)/otp',
        params: {
          username: data.username,
          password: data.password,
          canal: infosOtp.canal || data.canal_otp,
          destination: infosOtp.destination || (data.canal_otp === 'email' ? data.email : data.telephone),
          email_disponible: infosOtp.email_disponible || Boolean(data.email) ? 'true' : 'false',
        },
      });
    } catch (err: any) {
      console.error('Erreur lors de l’inscription:', err);
      const res = err.response?.data;
      if (typeof res === 'object') {
        const firstKey = Object.keys(res)[0];
        const msg = Array.isArray(res[firstKey]) ? res[firstKey][0] : res[firstKey];
        setError(typeof msg === 'string' ? msg : "Erreur lors de l'inscription.");
      } else {
        setError(res?.detail || "Impossible de joindre le serveur. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupScreen
      onSignupSubmit={handleSignupSubmit}
      onGoToLogin={() => router.back()}
      loading={loading}
      error={error}
    />
  );
}
