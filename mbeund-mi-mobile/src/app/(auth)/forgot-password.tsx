import React from 'react';
import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';

export default function ForgotPassword() {
  const router = useRouter();

  return (
    <ForgotPasswordScreen
      onBackToLogin={() => router.replace('/(auth)/login')}
    />
  );
}
