import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useProfile } from '../hooks/use-api';
import { User, Shield, Bell, LogOut, ChevronRight, Moon, Globe, Repeat, Target } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { logout, theme, setTheme, language, notificationsEnabled } = useAppStore();
  const { data: profile } = useProfile();
  
  const isDarkMode = theme === 'dark';

  type SettingItem = {
    icon: any;
    label: string;
    color: string;
    action?: () => void;
    rightText?: string;
    rightContent?: React.ReactNode;
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available in the next major update.`);
  };

  const languageMap: Record<string, string> = {
    'en': 'English', 'fr': 'Français', 'es': 'Español', 'de': 'Deutsch', 'ar': 'العربية'
  };

  const sections: { title: string, items: SettingItem[] }[] = [
    {
      title: 'Tools',
      items: [
        { icon: Repeat, label: 'Recurring Transactions', color: '#F97316', action: () => navigation.navigate('Recurring') },
        { icon: Target, label: 'Goals', color: '#EC4899', action: () => navigation.navigate('Goals') },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { icon: Moon, label: 'Dark Mode', color: '#6366F1', rightContent: <Switch trackColor={{ false: '#3F3F46', true: '#4F46E5' }} thumbColor="#FAFAFA" value={isDarkMode} onValueChange={(val) => {
          setTheme(val ? 'dark' : 'light');
          if (!val) {
            Alert.alert('Light Theme', 'Light mode is currently under development. Reverting to Dark theme.', [{text: 'OK', onPress: () => setTheme('dark')}]);
          }
        }} /> },
        { icon: Globe, label: 'Language', color: '#3B82F6', rightText: languageMap[language] || 'English', action: () => navigation.navigate('LanguageSettings') },
        { icon: Globe, label: 'Currency', color: '#10B981', rightText: profile?.currency || 'USD', action: () => navigation.navigate('CurrencySettings') },
        { icon: Bell, label: 'Notifications', color: '#F87171', rightText: notificationsEnabled ? 'On' : 'Off', action: () => navigation.navigate('NotificationSettings') },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Info', color: '#9CA3AF', action: () => navigation.navigate('ProfileSettings') },
        { icon: Shield, label: 'Security & Privacy', color: '#F59E0B', action: () => navigation.navigate('SecuritySettings') },
      ]
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.username?.substring(0, 2).toUpperCase() || 'ME'}</Text>
            </View>
            <View style={styles.activeBadge} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'Loading...'}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>MEMBER</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileArrow}>
            <ChevronRight size={20} color="#71717A" />
          </TouchableOpacity>
        </View>

        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity key={i} style={[styles.menuItem, i !== section.items.length - 1 && styles.borderBottom]} onPress={item.action} activeOpacity={item.action ? 0.7 : 1}>
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                      <item.icon size={20} color="#FFF" />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.rightText && <Text style={styles.rightText}>{item.rightText}</Text>}
                    {item.rightContent && item.rightContent}
                    {!item.rightContent && <ChevronRight size={18} color="#52525B" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <LogOut size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0 (Build 2025)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#FAFAFA', letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 40, padding: 32, borderWidth: 1, borderColor: '#27272A', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginRight: 24 },
  avatar: { width: 80, height: 80, borderRadius: 32, backgroundColor: '#93C5FD', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '3deg' }], borderWidth: 2, borderColor: '#09090B' },
  avatarText: { color: '#000', fontSize: 28, fontWeight: '900' },
  activeBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, backgroundColor: '#10B981', borderRadius: 12, borderWidth: 4, borderColor: '#18181B' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  userName: { color: '#FAFAFA', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  userEmail: { color: '#A1A1AA', fontSize: 13, marginTop: 4, fontWeight: '500' },
  memberBadge: { alignSelf: 'flex-start', backgroundColor: '#4ADE80', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginTop: 12 },
  memberBadgeText: { color: '#064E3B', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  profileArrow: { padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#52525B', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, marginLeft: 8 },
  menuCard: { backgroundColor: 'rgba(24, 24, 27, 0.5)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: '#FAFAFA', fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rightText: { color: '#A1A1AA', fontSize: 14, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 18, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)' },
  logoutText: { color: '#EF4444', fontSize: 18, fontWeight: '900' },
  versionText: { color: '#52525B', fontSize: 10, textAlign: 'center', marginTop: 32, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
});
