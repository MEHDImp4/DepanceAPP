import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface CapitalCardProps {
  amount: number;
  currency: string;
}

export function CapitalCard({ amount, currency }: CapitalCardProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Total Capital
        </Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountText} numberOfLines={1}>
            {formattedAmount}
          </Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>
              {currency}
            </Text>
          </View>
        </View>

        <View style={styles.liveBalanceContainer}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>
            Live Balance
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1, borderRadius: 36, padding: 32, marginBottom: 24 },
  contentContainer: {},
  title: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 3, color: '#A1A1AA', marginBottom: 12 },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline' },
  amountText: { fontSize: 44, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -1.5 },
  currencyBadge: { backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  currencyText: { fontSize: 13, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 1 },
  liveBalanceContainer: { paddingTop: 6, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 2 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2 },
});
