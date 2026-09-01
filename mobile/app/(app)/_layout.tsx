import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme';

export default function PrivateLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!user) return <Redirect href="/sign-in" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
