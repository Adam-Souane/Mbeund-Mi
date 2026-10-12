import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = {
  onFinish?: () => void;
};

export function SplashScreenView({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(0.92)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. Fondu d'apparition initial
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // 2. Animation continue de zoom avant / zoom arrière (respiration du logo)
    Animated.loop(
      Animated.sequence([
        Animated.timing(zoomAnim, {
          toValue: 1.05,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(zoomAnim, {
          toValue: 0.96,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Animation des 3 points de chargement
    const createDotPulse = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createDotPulse(dot1, 0),
      createDotPulse(dot2, 180),
      createDotPulse(dot3, 360),
    ]).start();

    // 4. Transition après 2.5 secondes
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: zoomAnim }],
          },
        ]}>
        {/* Logo réel officiel de Mbeund-Mi */}
        <Image
          source={require('../../assets/images/logo-light.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Slogan officiel avec séparateurs latéraux */}
        <View style={styles.sloganRow}>
          <View style={styles.line} />
          <Text style={styles.sloganText}>Bul Xaar, Waajal Ko.</Text>
          <View style={styles.line} />
        </View>

        {/* Sous-titre officiel identique au Web */}
        <Text style={styles.subTitle}>
          Plateforme de prévention des inondations
        </Text>
      </Animated.View>

      {/* 3 points de chargement synchronisés en bas */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Mode clair / fond blanc selon demande
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 250,
    height: 60,
    marginBottom: 16,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  line: {
    width: 24,
    height: 1.5,
    backgroundColor: Brand.navy[200],
  },
  sloganText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Brand.navy.DEFAULT,
  },
  subTitle: {
    marginTop: 12,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Brand.navy[400],
    textAlign: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.red.DEFAULT,
  },
});
