import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Lock } from 'lucide-react-native';
import apiClient from '../api/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setToken = useAppStore((state) => state.setToken);
  const serverUrl = useAppStore((state) => state.serverUrl);
  const setServerUrl = useAppStore((state) => state.setServerUrl);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill everything');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { identifier: email, password });
      const { token } = res.data;
      
      if (!token) {
        throw new Error('Server did not return a token. Please update your backend image.');
      }
      
      await setToken(token);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Login failed. Check server/credentials.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lock size={32} color="#2563EB" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Connected to: {serverUrl?.replace('https://', '').replace('http://', '')}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@example.com"
            placeholderTextColor="#71717A"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#71717A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.changeServer}
            onPress={() => setServerUrl('')}
          >
            <Text style={styles.changeServerText}>Change Backend Server</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  iconContainer: { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(37, 99, 235, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: '#FAFAFA', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  subtitle: { color: '#A1A1AA', fontSize: 14, marginTop: 8, opacity: 0.8 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  label: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#18181B', color: '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 24, fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  errorText: { color: '#EF4444', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  button: { backgroundColor: '#2563EB', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  changeServer: { marginTop: 24, alignItems: 'center' },
  changeServerText: { color: '#A1A1AA', fontSize: 14, fontWeight: '500' },
});

