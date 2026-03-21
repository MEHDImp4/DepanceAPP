import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

  return (
    <View style={styles.card}>
      <View style={styles.bgGlow} />

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
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            Live Balance
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'relative', overflow: 'hidden', backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1, borderRadius: 32, padding: 32, marginBottom: 24 },
  bgGlow: { position: 'absolute', top: -100, right: -100, width: 256, height: 256, backgroundColor: '#2563EB', borderRadius: 128, opacity: 0.1 },
  contentContainer: {},
  title: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#A1A1AA', marginBottom: 12 },
  amountContainer: { flexDirection: 'row', alignItems: 'center' },
  amountText: { fontSize: 36, fontWeight: 'bold', color: '#FAFAFA' },
  currencyBadge: { backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  currencyText: { fontSize: 13, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 1 },
  liveBalanceContainer: { paddingTop: 8, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2 },
});
