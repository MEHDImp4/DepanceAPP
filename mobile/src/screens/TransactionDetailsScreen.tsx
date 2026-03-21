import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Trash2, Edit3, Calendar, Tag, Wallet, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useTransactions, useCategories, useAccounts } from '../hooks/use-api';
import apiClient from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

type ParamList = {
  TransactionDetails: { id: string };
};

export default function TransactionDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'TransactionDetails'>>();
  const transactionId = parseInt(route.params.id, 10);

  const queryClient = useQueryClient();
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const transaction = Array.isArray(transactions) ? transactions.find(t => t.id === transactionId) : null;
  const category = Array.isArray(categories) ? categories.find(c => c.id === transaction?.category_id) : null;
  const account = Array.isArray(accounts) ? accounts.find(a => a.id === transaction?.account_id) : null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/transactions/${transactionId}`);
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['summary'] });
              queryClient.invalidateQueries({ queryKey: ['accounts'] });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          }
        }
      ]
    );
  };

  if (!transaction) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3B82F6' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const amountStr = `$${Number(transaction.amount).toFixed(2)}`;
  const dateStr = new Date(transaction.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.title}>Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Edit transaction feature is coming in the next update.')} style={styles.actionButton}>
            <Edit3 size={20} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.amountCard}>
          <View style={[styles.iconCircle, isIncome ? styles.iconIncome : styles.iconExpense]}>
            {isIncome ? <TrendingUp size={32} color="#FAFAFA" /> : <TrendingDown size={32} color="#FAFAFA" />}
          </View>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={[styles.amount, isIncome ? styles.amountIncome : styles.amountExpense]}>
            {isIncome ? `+${amountStr}` : `-${amountStr}`}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#9CA3AF" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{dateStr}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Wallet size={20} color="#9CA3AF" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Account</Text>
              <Text style={styles.detailValue}>{account?.name || 'Unknown Account'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Tag size={20} color="#9CA3AF" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{category?.name || 'Uncategorized'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <Trash2 size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  amountCard: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  iconIncome: {
    backgroundColor: '#10B981',
  },
  iconExpense: {
    backgroundColor: '#EF4444',
  },
  description: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  amountIncome: {
    color: '#10B981',
  },
  amountExpense: {
    color: '#FAFAFA',
  },
  detailsCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  }
});
