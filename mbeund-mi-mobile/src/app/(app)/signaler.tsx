import React from 'react';
import { useRouter } from 'expo-router';
import SignalerScreen from '../../screens/SignalerScreen';

export default function Signaler() {
  const router = useRouter();

  return (
    <SignalerScreen
      onSuccess={() => {
        router.push('/(app)' as any);
      }}
    />
  );
}
