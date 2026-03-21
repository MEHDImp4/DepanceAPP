import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecurring } from '../hooks/use-api';
import { Repeat, Plus, Calendar, Clock } from 'lucide-react-native';

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useRecurring();
  const recurring = Array.isArray(data) ? data : [];


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
        <Text style={styles.title}>Recurring</Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Plus size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Automated Tasks</Text>
        
        <View style={styles.recurringList}>
          {recurring.map((item) => {
            const isIncome = item.type === 'income';
            return (
              <TouchableOpacity key={item.id} style={styles.recurringCard} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <View style={styles.leftInfo}>
                    <View style={styles.iconCircle}>
                      <Repeat size={20} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.desc}>{item.description}</Text>
                      <Text style={styles.interval}>{item.interval} Cycle</Text>
                    </View>
                  </View>
                  <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
                    {isIncome ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Calendar size={14} color="#71717A" />
                    <Text style={styles.footerText}>Next: {new Date(item.next_run_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                    <View style={[styles.dot, { backgroundColor: item.active ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: item.active ? '#10B981' : '#EF4444' }]}>
                      {item.active ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {recurring.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No automated transactions found</Text>
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
  primaryButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20, marginLeft: 4 },
  recurringList: { gap: 16 },
  recurringCard: { backgroundColor: '#18181B', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  leftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(37, 99, 235, 0.1)', alignItems: 'center', justifyContent: 'center' },
  desc: { color: '#FAFAFA', fontSize: 16, fontWeight: 'bold' },
  interval: { color: '#71717A', fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold' },
  income: { color: '#10B981' },
  expense: { color: '#FAFAFA' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#71717A', fontSize: 12, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyCard: { padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272A', borderRadius: 28 },
  emptyText: { color: '#71717A', fontWeight: '500' },
});
