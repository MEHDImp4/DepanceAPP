import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Server, Globe, ShieldCheck } from 'lucide-react-native';
import axios from 'axios';

export default function ServerSelectionScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setServerUrl = useAppStore((state) => state.setServerUrl);

  const handleConnect = async () => {
    if (!url) {
      setError('Please enter your backend URL');
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setLoading(true);
    setError('');
    
    try {
      // Attempt to ping the health endpoint
      const res = await axios.get(`${finalUrl}/api/health`, { timeout: 8000 });
      if (res.status === 200) {
        await setServerUrl(finalUrl);
      } else {
        throw new Error('Server returned unhealthy status');
      }
    } catch (err: any) {
      console.log('Connect error:', err.message);
      setError('Backend unreachable. Make sure the URL is correct and includes /api/health endpoint.');
      
      // Let user proceed anyway if they insist (e.g. for development)
      Alert.alert(
        'Connection Issue',
        'Could not verify backend health. Proceed anyway?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          { text: 'Proceed', onPress: () => setServerUrl(finalUrl) }
        ]
      );
    } finally {
      if (!error) setLoading(false);
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
            <Globe size={32} color="#2563EB" />
          </View>
          <Text style={styles.title}>Depance<Text style={{color: '#2563EB'}}>APP</Text></Text>
          <Text style={styles.subtitle}>Unified Self-Hosted Finance Management</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.infoText}>Connect to your private instances</Text>
          </View>

          <Text style={styles.label}>Backend Server URL</Text>
          <TextInput
            style={styles.input}
            placeholder="finance.yourdomain.com"
            placeholderTextColor="#71717A"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Establish Connection</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerNote}>
          Your data never leaves your infrastructure.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  iconContainer: { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(37, 99, 235, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: '#FAFAFA', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#A1A1AA', fontSize: 14, marginTop: 8, opacity: 0.8, textAlign: 'center' },
  card: { width: '100%', maxWidth: 400, alignSelf: 'center', backgroundColor: '#18181B', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#27272A' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 12 },
  infoText: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  label: { color: '#A1A1AA', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 24, fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  button: { backgroundColor: '#2563EB', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  footerNote: { color: '#3F3F46', fontSize: 12, textAlign: 'center', marginTop: 32, fontWeight: '500' },
});

