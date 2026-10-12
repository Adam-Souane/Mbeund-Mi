import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

import { Brand } from '@/constants/brand';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  placeholder: string;
  border: string;
  iconBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  inputBg: string;
  inputBorder: string;
}

const LightColors: ThemeColors = {
  background: '#F6F8FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: Brand.navy.DEFAULT, // Bleu officiel Mbeund-Mi (#1B2A40)
  textMuted: Brand.navy[500],
  placeholder: 'rgba(27, 42, 64, 0.40)', // Estompé et indicatif en clair
  border: Brand.navy[100],
  iconBg: Brand.navy[50],
  tabBarBg: '#FFFFFF',
  tabBarBorder: Brand.navy[100],
  inputBg: '#FFFFFF',
  inputBorder: Brand.navy[200],
};

const DarkColors: ThemeColors = {
  background: Brand.navy[950], // Fond bleu nuit profond (#0D1520)
  surface: Brand.navy.DEFAULT, // Bleu officiel Mbeund-Mi (#1B2A40) (ce qui était blanc devient bleu)
  card: Brand.navy.DEFAULT, // Cartes en bleu Mbeund-Mi (#1B2A40)
  text: '#FFFFFF', // Blanc pur (ce qui était bleu devient blanc)
  textMuted: Brand.navy[200], // Blanc bleuté clair et lisible
  placeholder: 'rgba(255, 255, 255, 0.38)', // Estompé et translucide : montre clairement que c'est un placeholder et non un texte saisi
  border: Brand.navy[700], // Bordure nette de séparation
  iconBg: Brand.navy[800],
  tabBarBg: Brand.navy.DEFAULT, // Barre du bas en bleu Mbeund-Mi
  tabBarBorder: Brand.navy[800],
  inputBg: Brand.navy[900],
  inputBorder: Brand.navy[600],
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await SecureStore.getItemAsync('userTheme');
        if (saved === 'dark' || saved === 'light') {
          setTheme(saved);
        }
      } catch (e) {
        console.error('Erreur chargement thème:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      await SecureStore.setItemAsync('userTheme', next);
    } catch (e) {
      console.error('Erreur sauvegarde thème:', e);
    }
  };

  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l’intérieur d’un ThemeProvider');
  }
  return context;
}
