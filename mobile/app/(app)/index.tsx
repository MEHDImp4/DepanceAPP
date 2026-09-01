import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>SESSION SÉCURISÉE</Text>
        <Text style={styles.title}>Bonjour {user?.username}</Text>
        <Text style={styles.subtitle}>Le socle mobile est connecté à l’API v1. Les comptes et transactions arriveront dans la prochaine phase.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Compte</Text>
          <Text style={styles.panelValue}>{user?.email}</Text>
          <Text style={styles.panelLabel}>Devise</Text>
          <Text style={styles.panelValue}>{user?.currency}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.outlineButton}>
          <Text style={styles.outlineText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, padding: 24, justifyContent: 'center', gap: 14 },
  eyebrow: { color: colors.primary, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 }, panel: { marginTop: 12, padding: 20, borderRadius: 18, backgroundColor: colors.surface, gap: 6 },
  panelLabel: { color: colors.muted, fontSize: 13, marginTop: 6 }, panelValue: { color: colors.text, fontSize: 17, fontWeight: '600' },
  outlineButton: { minHeight: 52, marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontWeight: '700' }
});
