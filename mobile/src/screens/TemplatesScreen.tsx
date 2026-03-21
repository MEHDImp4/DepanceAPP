import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTemplates, useCategories } from '../hooks/use-api';
import { Plus, LayoutGrid, Box, ShoppingCart, Coffee, Car, Home as HomeIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useTemplates();
  const { data: catData = [] } = useCategories();

  const templates = Array.isArray(data) ? data : [];
  const categories = Array.isArray(catData) ? catData : [];


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
        <Text style={styles.title}>Templates</Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Plus size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>My Templates</Text>
        
        <View style={styles.templatesGrid}>
          {templates.map((template) => {
            const isIncome = template.type === 'income';
            return (
              <TouchableOpacity key={template.id} style={styles.templateCard} activeOpacity={0.7}>
                <View style={[styles.iconCircle, { backgroundColor: template.color || '#27272A' }]}>
                  <Box size={24} color="white" />
                </View>
                <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
                <Text style={[styles.templateAmount, isIncome ? styles.income : styles.expense]}>
                  {isIncome ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(template.amount)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {templates.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Create templates for quick entry</Text>
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
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  templateCard: { width: (width - 40 - 16) / 2, backgroundColor: '#18181B', borderRadius: 28, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#27272A', gap: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  templateName: { color: '#FAFAFA', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  templateAmount: { fontSize: 13, fontWeight: '700' },
  income: { color: '#10B981' },
  expense: { color: '#FAFAFA' },
  emptyContainer: { width: '100%', padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272A', borderRadius: 32 },
  emptyText: { color: '#71717A', fontWeight: '500' },
});
