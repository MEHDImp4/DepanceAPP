import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoals } from '../hooks/use-api';
import { Target, Plus, CheckCircle2 } from 'lucide-react-native';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useGoals();
  const goals = Array.isArray(data) ? data : [];


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
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Plus size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Financial Ambitions</Text>
        
        <View style={styles.goalsList}>
          {goals.map((goal) => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            return (
              <TouchableOpacity key={goal.id} style={styles.goalCard} activeOpacity={0.7}>
                <View style={styles.goalInfo}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color || '#2563EB' }]}>
                      <Target size={20} color="white" />
                    </View>
                    <View>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalPath}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.current_amount)} of {' '}
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(goal.target_amount)}
                      </Text>
                    </View>
                  </View>
                  {progress === 100 && <CheckCircle2 size={24} color="#10B981" />}
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: goal.color || '#2563EB' }]} />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {goals.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Set goals to stay focused</Text>
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
  goalsList: { gap: 20 },
  goalCard: { backgroundColor: '#18181B', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#27272A' },
  goalInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  goalIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalName: { color: '#FAFAFA', fontSize: 18, fontWeight: 'bold' },
  goalPath: { color: '#71717A', fontSize: 13, marginTop: 2, fontWeight: '500' },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#27272A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPercent: { color: '#FAFAFA', fontSize: 13, fontWeight: 'bold', width: 40, textAlign: 'right' },
  emptyCard: { padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272A', borderRadius: 28 },
  emptyText: { color: '#71717A', fontWeight: '500' },
});
