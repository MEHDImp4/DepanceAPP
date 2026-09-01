import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme';

export default function SignInScreen() {
  const { user, loading, signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Redirect href="/(app)" />;

  const submit = async () => {
    if (!identifier.trim() || !password) return setError('Renseigne ton identifiant et ton mot de passe.');
    setSubmitting(true);
    setError('');
    try {
      await signIn(identifier.trim(), password);
      router.replace('/(app)');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Connexion impossible. Vérifie le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>DEPANCEAPP</Text>
        <Text style={styles.title}>Bon retour</Text>
        <Text style={styles.subtitle}>Connecte-toi à ton espace financier sécurisé.</Text>

        <Text style={styles.label}>E-mail ou nom d’utilisateur</Text>
        <TextInput accessibilityLabel="E-mail ou nom d’utilisateur" autoCapitalize="none" autoCorrect={false} value={identifier} onChangeText={setIdentifier} style={styles.input} placeholder="mehdi@example.com" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput accessibilityLabel="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} placeholder="••••••••" placeholderTextColor={colors.muted} onSubmitEditing={submit} />

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.disabled]}>
          {submitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Se connecter</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  card: { gap: 12 }, eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 36, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 16, marginBottom: 20 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontSize: 16 },
  error: { color: colors.danger, fontSize: 14 },
  button: { minHeight: 54, marginTop: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonPressed: { backgroundColor: colors.primaryPressed }, disabled: { opacity: 0.65 }, buttonText: { color: colors.text, fontSize: 16, fontWeight: '700' }
});
