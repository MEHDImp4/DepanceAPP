import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  // Add an option to change server
  const setServerUrl = useAppStore((state) => state.setServerUrl);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill everything');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // In real scenario:
      // const res = await apiClient.post('/auth/login', { email, password });
      // await setToken(res.data.token);
      
      // Simulate login for frontend demo
      setTimeout(async () => {
        await setToken('simulated_jwt_token_123');
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#141414', padding: 24, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Lock size={64} color="#4ade80" />
        <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: 'bold', marginTop: 16 }}>Welcome Back</Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
          Connected to: {serverUrl?.replace('https://', '')}
        </Text>
      </View>

      <Text style={{ color: '#f8fafc', marginBottom: 8, fontWeight: '500' }}>Email</Text>
      <TextInput
        style={{ backgroundColor: '#2A2A2A', color: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 }}
        placeholder="hello@example.com"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <Text style={{ color: '#f8fafc', marginBottom: 8, fontWeight: '500' }}>Password</Text>
      <TextInput
        style={{ backgroundColor: '#2A2A2A', color: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 }}
        placeholder="••••••••"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={{ color: '#ef4444', marginBottom: 16 }}>{error}</Text> : null}

      <TouchableOpacity 
        style={{ backgroundColor: '#4ade80', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#141414" />
        ) : (
          <Text style={{ color: '#141414', fontWeight: 'bold', fontSize: 16 }}>Log In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ padding: 16, alignItems: 'center', marginTop: 16 }}
        onPress={() => setServerUrl('')} // clear server URL to go back
      >
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Change Server</Text>
      </TouchableOpacity>
    </View>
  );
}
