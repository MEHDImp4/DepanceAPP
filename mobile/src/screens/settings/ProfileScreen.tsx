import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, User, Mail, ShieldAlert } from 'lucide-react-native';
import { useProfile } from '../../hooks/use-api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data: profile, isLoading } = useProfile();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {isLoading && !profile ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.username?.substring(0, 2).toUpperCase() || 'ME'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#9CA3AF" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Username</Text>
                  <Text style={styles.value}>{profile?.username}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color="#9CA3AF" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.value}>{profile?.email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.alertCard}>
              <ShieldAlert size={20} color="#F59E0B" />
              <Text style={styles.alertText}>
                Username and email updates are currently disabled for security reasons. Contact support if you need to change them.
              </Text>
            </View>
          </>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#18181B',
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
  },
  card: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertText: {
    color: '#FDE68A',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  }
});
