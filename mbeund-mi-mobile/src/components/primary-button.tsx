import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Brand, Radius } from '@/constants/brand';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
  style,
}: Props) {
  const { isDark } = useTheme();
  const inactive = disabled || loading;
  const outline = variant === 'outline';

  // Inversion Mbeund-Mi pure : bleu en clair, blanc en sombre
  const solidBg = isDark ? '#FFFFFF' : Brand.navy.DEFAULT;
  const solidTextColor = isDark ? Brand.navy.DEFAULT : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        outline ? (isDark ? styles.outlineDark : styles.outline) : { backgroundColor: solidBg },
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ] as any}>
      {loading ? (
        <ActivityIndicator color={outline ? (isDark ? '#FFFFFF' : Brand.navy.DEFAULT) : solidTextColor} />
      ) : (
        <Text
          style={[
            styles.label,
            outline
              ? (isDark ? styles.labelOutlineDark : styles.labelOutline)
              : { color: solidTextColor },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  solid: {
    backgroundColor: Brand.navy.DEFAULT,
    shadowColor: Brand.navy.DEFAULT,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Brand.navy[100],
  },
  outlineDark: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  inactive: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  labelOutline: { color: Brand.navy.DEFAULT },
  labelOutlineDark: { color: '#FFFFFF' },
});
