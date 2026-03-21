import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { LogOut, Wallet } from 'lucide-react-native';
import { CapitalCard } from '../components/dashboard/CapitalCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';

export default function DashboardScreen() {
  const logout = useAppStore((state) => state.logout);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCloseModal = useCallback(() => setIsModalVisible(false), []);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const mockTransactions = [
    {
      id: '1',
      amount: 1250.0,
      type: 'income' as const,
      description: 'Monthly Salary',
      category_id: 'Salary',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      amount: 84.2,
      type: 'expense' as const,
      description: 'Groceries',
      category_id: 'Food',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      amount: 15.5,
      type: 'expense' as const,
      description: 'Netflix Subscription',
      category_id: 'Entertainment',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header section matching Web UI */}
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

        <CapitalCard amount={42500.00} currency="USD" />
        <RecentTransactions transactions={mockTransactions} />

      </ScrollView>

      {/* Transaction Modal Stub */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <Text style={styles.modalSubtitle}>Coming Soon via Context API mutation</Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#09090B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  headerContainer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, position: 'relative', width: '100%', marginBottom: 8 },
  headerLogout: { position: 'absolute', top: 16, right: 0, zIndex: 10 },
  logoutButton: { padding: 8, backgroundColor: 'rgba(39, 39, 42, 0.5)', borderRadius: 20, borderColor: '#27272A', borderWidth: 1 },
  walletIconContainer: { width: 56, height: 56, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(37, 99, 235, 0.2)', borderWidth: 1 },
  headerTextContainer: { alignItems: 'center', marginTop: 12 },
  headerDate: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#A1A1AA' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FAFAFA', marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
  modalTitle: { color: '#FAFAFA', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalSubtitle: { color: '#A1A1AA', marginBottom: 32 },
  modalCloseButton: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  modalCloseButtonText: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 16 },
});
