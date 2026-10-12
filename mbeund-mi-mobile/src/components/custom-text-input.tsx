import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Radius } from '@/constants/brand';
import { useTheme } from '@/context/ThemeContext';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  /** Préfixe affiché à gauche (ex. « +221 ») : utile pour un numéro de téléphone. */
  prefix?: string;
};

export function CustomTextInput({ label, error, prefix, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBg,
            borderColor: focused ? Brand.red.DEFAULT : colors.inputBorder,
          },
          !!error && styles.errored,
        ]}
      >
        {prefix ? (
          <View
            style={[
              styles.prefixBox,
              {
                backgroundColor: isDark ? Brand.navy[800] : Brand.navy[50],
                borderRightColor: colors.inputBorder,
              },
            ]}
          >
            <Text style={[styles.prefix, { color: colors.text }]}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          {...props}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.placeholder}
          selectionColor={Brand.red.DEFAULT}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: Brand.navy[700], marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1.2,
    borderColor: Brand.navy[200],
    overflow: 'hidden',
  },
  focused: { borderColor: Brand.red.DEFAULT, backgroundColor: '#ffffff' },
  errored: { borderColor: Brand.red.DEFAULT },
  prefixBox: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: Brand.navy[50],
    borderRightWidth: 1,
    borderRightColor: Brand.navy[100],
  },
  prefix: { fontSize: 14, fontWeight: '600', color: Brand.navy.DEFAULT },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '400',
    color: Brand.navy.DEFAULT,
  },
  error: { marginTop: 4, fontSize: 12, color: Brand.red.DEFAULT },
});
