import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CapitalCard } from '../components/dashboard/CapitalCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { useSummary, useAccounts, useTransactions, useCategories } from '../hooks/use-api';
import { Wallet, LogOut } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAppStore((state) => state.logout);
  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useSummary();
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useTransactions();
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useCategories();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchAccounts(),
      refetchTransactions(),
      refetchCategories()
    ]);
    setRefreshing(false);
  }, [refetchSummary, refetchAccounts, refetchTransactions, refetchCategories]);

  if (isLoadingSummary || isLoadingAccounts || isLoadingTransactions || isLoadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const totalCapital = safeAccounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerLogout}>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogOut size={16} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          <View style={styles.walletIconContainer}>
            <Wallet color="#2563EB" size={32} strokeWidth={1.5} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerDate}>{todayDate}</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
        </View>

        <CapitalCard amount={totalCapital} currency="USD" />
        
        <RecentTransactions 
          transactions={safeTransactions.slice(0, 5)} 
          categories={safeCategories}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  loadingContainer: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  headerContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, position: 'relative', width: '100%', marginBottom: 12 },
  headerLogout: { position: 'absolute', top: 0, right: 0, zIndex: 10 },
  logoutButton: { padding: 8, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 20, borderColor: '#27272A', borderWidth: 1 },
  walletIconContainer: { width: 56, height: 56, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTextContainer: { alignItems: 'center', marginTop: 16 },
  headerDate: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 3, color: '#A1A1AA' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FAFAFA', marginTop: 4, letterSpacing: -0.5 },
});
