import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SplashScreenView } from '../components';
import { useEffect, useState } from 'react';

// Ce composant s'occupe du Splash screen initial, de la barre d'état système (heure, batterie, notifications)
// et de la redirection en fonction de l'état d'authentification
function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (showSplash || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Pas connecté, rediriger vers la page de login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Connecté mais essaie d'accéder à l'écran de login, rediriger vers l'accueil
      router.replace('/(app)');
    }
  }, [token, isLoading, showSplash, segments]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} animated />
      {showSplash ? (
        <SplashScreenView onFinish={() => setShowSplash(false)} />
      ) : (
        <Slot />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
