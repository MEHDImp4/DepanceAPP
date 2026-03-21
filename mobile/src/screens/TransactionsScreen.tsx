import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactions, useCategories } from '../hooks/use-api';
import { Search, Filter, Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Transaction } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data, isLoading } = useTransactions();
  const { data: catData } = useCategories();
  
  const transactions = Array.isArray(data) ? data : [];
  const categories = Array.isArray(catData) ? catData : [];
  
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      const dateStr = new Date(t.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Transactions</Text>
          <TouchableOpacity 
            style={[styles.filterButton, isFilterOpen && styles.filterButtonActive]}
            onPress={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={20} color={isFilterOpen ? '#FFFFFF' : '#A1A1AA'} />
          </TouchableOpacity>
        </View>

        {isFilterOpen && (
          <View style={styles.filterCard}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#71717A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor="#71717A"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([dateLabel, items]) => (
            <View key={dateLabel} style={styles.groupContainer}>
              <Text style={styles.dateHeader}>{dateLabel}</Text>
              <View style={styles.listCard}>
                {items.map((t, idx) => {
                  const isIncome = t.type === 'income';
                  const category = categories.find(c => c.id === t.category_id);
                  const amountStr = `$${Number(t.amount).toFixed(2)}`;
                  
                  return (
                    <TouchableOpacity 
                      key={t.id} 
                      style={[styles.transactionItem, idx !== items.length - 1 && styles.borderBottom]}
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate('TransactionDetails', { id: String(t.id) })}
                    >
                      <View style={styles.leftSide}>
                        <View style={[styles.iconBox, isIncome ? styles.iconIncome : styles.iconExpense]}>
                          {isIncome ? <TrendingUp size={18} color="white" /> : <TrendingDown size={18} color="white" />}
                        </View>
                        <View>
                          <Text style={styles.description}>{t.description}</Text>
                          <Text style={styles.categoryName}>{category?.name || 'Uncategorized'}</Text>
                        </View>
                      </View>
                      <View style={styles.rightSide}>
                        <Text style={[styles.amount, isIncome ? styles.amountIncome : styles.amountExpense]}>
                          {isIncome ? `+${amountStr}` : `-${amountStr}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: 100 + insets.bottom }]}>
        <Plus size={28} color="white" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  loadingContainer: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  filterButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterCard: { marginTop: 16, padding: 4, backgroundColor: '#18181B', borderRadius: 16, borderWidth: 1, borderColor: '#27272A' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#FAFAFA', fontSize: 15 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  groupContainer: { marginBottom: 32 },
  dateHeader: { fontSize: 11, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  listCard: { backgroundColor: '#18181B', borderRadius: 24, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  leftSide: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconIncome: { backgroundColor: '#10B981' },
  iconExpense: { backgroundColor: '#EF4444' },
  description: { fontSize: 15, fontWeight: '600', color: '#FAFAFA' },
  categoryName: { fontSize: 11, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', marginTop: 2 },
  rightSide: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: 'bold' },
  amountIncome: { color: '#10B981' },
  amountExpense: { color: '#FAFAFA' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: '#71717A', fontSize: 15, fontWeight: '500' },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
