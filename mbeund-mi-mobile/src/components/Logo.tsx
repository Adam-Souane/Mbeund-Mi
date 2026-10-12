import { Image, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  withSlogan?: boolean;
};

export default function Logo({ size = 'md', withSlogan = false }: Props) {
  const heights = { sm: 20, md: 32, lg: 40 };
  const height = heights[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-light.png')}
        style={{ height, resizeMode: 'contain', width: height * 4 }}
      />
      {withSlogan && (
        <View style={styles.sloganRow}>
          <View style={styles.line} />
          <Text style={styles.sloganText}>Bul Xaar, Waajal Ko.</Text>
          <View style={styles.line} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  line: {
    width: 20,
    height: 1,
    backgroundColor: Brand.navy.DEFAULT,
  },
  sloganText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Brand.navy.DEFAULT,
  },
});
