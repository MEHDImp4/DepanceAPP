import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category_id?: string;
  created_at: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onPressTransaction?: (id: string) => void;
  onPressSeeAll?: () => void;
}

export function RecentTransactions({ transactions, onPressTransaction, onPressSeeAll }: RecentTransactionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          Recent Transactions
        </Text>
        <TouchableOpacity onPress={onPressSeeAll}>
          <Text style={styles.seeAllText}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {transactions.map((transaction, index) => {
          const isIncome = transaction.type === 'income';
          const isLast = index === transactions.length - 1;
          const date = new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount);

          return (
            <TouchableOpacity
              key={transaction.id}
              activeOpacity={0.7}
              onPress={() => onPressTransaction?.(transaction.id)}
              style={[styles.transactionItem, !isLast && styles.transactionItemBorder]}
            >
              <View style={styles.leftSection}>
                <View style={[styles.iconContainer, isIncome ? styles.iconIncome : styles.iconExpense]}>
                  {isIncome ? <TrendingUp size={18} color="white" strokeWidth={2.5} /> : <TrendingDown size={18} color="white" strokeWidth={2.5} />}
                </View>
                <View>
                  <Text style={styles.descriptionText}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.categoryText}>
                    {transaction.category_id || 'Uncategorized'}
                  </Text>
                </View>
              </View>

              <View style={styles.rightSection}>
                <Text style={[styles.amountText, isIncome ? styles.amountIncome : styles.amountExpense]}>
                  {isIncome ? `+${amountStr}` : `-${amountStr}`}
                </Text>
                <Text style={styles.dateText}>
                  {date}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {transactions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Transactions
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 16 },
  headerTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 'bold', color: '#A1A1AA' },
  seeAllText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#2563EB' },
  listContainer: { backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1, borderRadius: 32, overflow: 'hidden' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  transactionItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, opacity: 0.9, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  iconIncome: { backgroundColor: '#10B981' },
  iconExpense: { backgroundColor: '#EF4444' },
  descriptionText: { fontWeight: '600', fontSize: 14, color: '#FAFAFA', opacity: 0.9 },
  categoryText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#A1A1AA', marginTop: 4 },
  rightSection: { alignItems: 'flex-end' },
  amountText: { fontWeight: 'bold', fontSize: 14 },
  amountIncome: { color: '#10B981' },
  amountExpense: { color: '#FAFAFA' },
  dateText: { fontSize: 10, fontWeight: '500', color: '#A1A1AA', opacity: 0.5, textTransform: 'uppercase', letterSpacing: -0.5, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(39, 39, 42, 0.2)', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', margin: 16, borderRadius: 24 },
  emptyText: { fontSize: 12, fontWeight: 'bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 2 },
});
