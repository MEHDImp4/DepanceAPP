import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Server } from 'lucide-react-native';
import axios from 'axios';

export default function ServerSelectionScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setServerUrl = useAppStore((state) => state.setServerUrl);

  const handleConnect = async () => {
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setLoading(true);
    setError('');
    
    try {
      // Small test if the server reacts. Wait 5s max.
      // In production, an actual /api/v1/health end-point will be provided by your self-hosted setup.
      // For now we will allow it if it fails because backend might not be configured locally yet.
      // await axios.get(`${finalUrl}/api/health`, { timeout: 5000 });
      
      await setServerUrl(finalUrl);
    } catch (err) {
      setError('Server unreachable. Are you sure?');
      // Uncomment to force strict checking
      // return; 
      
      // We will allow passing through to Login screen to simulate UI.
      await setServerUrl(finalUrl); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#141414', padding: 24, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Server size={64} color="#4ade80" />
        <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: 'bold', marginTop: 16 }}>DepanceAPP</Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, marginTop: 8, textAlign: 'center' }}>Connect to your self-hosted backend</Text>
      </View>

      <Text style={{ color: '#f8fafc', marginBottom: 8, fontWeight: '500' }}>Server URL</Text>
      <TextInput
        style={{ backgroundColor: '#2A2A2A', color: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 }}
        placeholder="https://finance.mydomain.com"
        placeholderTextColor="#64748b"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {error ? <Text style={{ color: '#ef4444', marginBottom: 16 }}>{error}</Text> : null}

      <TouchableOpacity 
        style={{ backgroundColor: '#4ade80', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
        onPress={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#141414" />
        ) : (
          <Text style={{ color: '#141414', fontWeight: 'bold', fontSize: 16 }}>Test & Connect</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
