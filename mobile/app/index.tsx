import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme';

export default function EntryScreen() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  return <Redirect href={user ? '/(app)' : '/sign-in'} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
