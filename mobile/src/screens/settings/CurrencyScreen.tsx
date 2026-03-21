import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useProfile, useUpdateProfile } from '../../hooks/use-api';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
];

export default function CurrencyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  // Local state for optimistic UI updates
  const [optimisticCurrency, setOptimisticCurrency] = useState<string | null>(null);

  const currentCurrency = optimisticCurrency || profile?.currency || 'USD';

  const handleSelectCurrency = (code: string) => {
    setOptimisticCurrency(code);
    updateProfile.mutate({ currency: code }, {
      onError: () => {
        // Revert on error
        setOptimisticCurrency(null);
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.title}>Currency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Select your primary currency. This will update how all balances and transactions are displayed throughout the app.
        </Text>
        
        {isLoading && !profile ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {currencies.map((currency, index) => {
              const isSelected = currentCurrency === currency.code;
              return (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    index !== currencies.length - 1 && styles.borderBottom,
                    isSelected && styles.selectedItem
                  ]}
                  onPress={() => handleSelectCurrency(currency.code)}
                  activeOpacity={0.7}
                  disabled={updateProfile.isPending}
                >
                  <View style={styles.currencyLeft}>
                    <View style={[styles.symbolBadge, isSelected && styles.selectedBadge]}>
                      <Text style={[styles.symbolText, isSelected && styles.selectedSymbolText]}>{currency.symbol}</Text>
                    </View>
                    <View>
                      <Text style={[styles.currencyCode, isSelected && styles.selectedText]}>
                        {currency.code}
                      </Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </View>
                  {isSelected && (
                     updateProfile.isPending ? (
                       <ActivityIndicator size="small" color="#10B981" />
                     ) : (
                       <Check size={20} color="#10B981" />
                     )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  listContainer: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  symbolBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    backgroundColor: '#10B981',
  },
  symbolText: {
    color: '#A1A1AA',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedSymbolText: {
    color: '#FFF',
  },
  currencyCode: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  currencyName: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedText: {
    color: '#10B981',
  },
});
