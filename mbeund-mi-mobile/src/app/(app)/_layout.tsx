import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { Brand } from '@/constants/brand';
import { useTheme } from '@/context/ThemeContext';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8);
  const barHeight = 56 + bottomPadding;

  const activeColor = isDark ? '#EF4444' : Brand.red.DEFAULT;
  const inactiveColor = isDark ? '#64748B' : Brand.navy[400];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
        },
      }}>
      {/* 1. Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && (isDark ? styles.tabIconWrapperActiveDark : styles.tabIconWrapperActiveLight),
              ]}>
              <Feather
                name="home"
                size={19}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
        }}
      />

      {/* 2. Carte Interactive */}
      <Tabs.Screen
        name="carte"
        options={{
          title: 'Carte',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && (isDark ? styles.tabIconWrapperActiveDark : styles.tabIconWrapperActiveLight),
              ]}>
              <Feather
                name="map"
                size={19}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
        }}
      />

      {/* 3. Signaler - Bouton Central Mis en Avant (Identique au Web Mobile BottomTabBar) */}
      <Tabs.Screen
        name="signaler"
        options={{
          title: 'Signaler',
          tabBarActiveTintColor: Brand.red.DEFAULT,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
              <Feather name="camera" size={20} color="#ffffff" />
            </View>
          ),
        }}
      />

      {/* 4. NDAM - Chatbot IA Citoyen (Identique au Web /citoyen/chat) */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'NDAM',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && (isDark ? styles.tabIconWrapperActiveDark : styles.tabIconWrapperActiveLight),
              ]}>
              <Feather
                name="message-circle"
                size={19}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
        }}
      />

      {/* 5. Profil Citoyen */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabIconWrapper,
                focused && (isDark ? styles.tabIconWrapperActiveDark : styles.tabIconWrapperActiveLight),
              ]}>
              <Feather
                name="user"
                size={19}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          ),
        }}
      />

      {/* Écran Alertes accessible via navigation interne mais masqué de la barre d'onglets principale */}
      <Tabs.Screen
        name="alertes"
        options={{
          href: null,
          title: 'Alertes',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperActiveLight: {
    backgroundColor: 'rgba(192, 24, 42, 0.1)',
  },
  tabIconWrapperActiveDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
  },
  centerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.red.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.red.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
    marginTop: -4,
  },
  centerBtnActive: {
    backgroundColor: '#991B1B',
    transform: [{ scale: 1.05 }],
  },
});
