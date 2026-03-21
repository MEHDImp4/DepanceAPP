import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccounts } from '../hooks/use-api';
import { Wallet, Plus, ArrowRightLeft, CreditCard, Landmark } from 'lucide-react-native';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useAccounts();
  const accounts = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  }, [accounts]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton}>
            <ArrowRightLeft size={20} color="#A1A1AA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton}>
            <Plus size={20} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.glowEffect} />
          <Text style={styles.summaryLabel}>Total Net Worth</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
            </Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>USD</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>My Accounts</Text>
        <View style={styles.accountsList}>
          {accounts.map((account) => (
            <TouchableOpacity key={account.id} style={styles.accountCard} activeOpacity={0.7}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: account.color || '#27272A' }]}>
                  {account.type === 'Bank' ? <Landmark size={20} color="white" /> : <CreditCard size={20} color="white" />}
                </View>
                <View>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>{account.type}</Text>
                </View>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountBalance}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency || 'USD' }).format(account.balance || 0)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {accounts.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No accounts added yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  loadingContainer: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  actionRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  summaryCard: { backgroundColor: '#18181B', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#27272A', marginBottom: 40, overflow: 'hidden' },
  glowEffect: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 60 },
  summaryLabel: { fontSize: 11, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceText: { fontSize: 32, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -1 },
  currencyBadge: { backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  currencyText: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  accountsList: { gap: 16 },
  accountCard: { backgroundColor: '#18181B', borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  accountIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  accountName: { fontSize: 16, fontWeight: 'bold', color: '#FAFAFA' },
  accountType: { fontSize: 12, color: '#71717A', marginTop: 2 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance: { fontSize: 16, fontWeight: 'bold', color: '#FAFAFA' },
  emptyCard: { padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272A', borderRadius: 24 },
  emptyText: { color: '#71717A', fontWeight: '500' },
});
