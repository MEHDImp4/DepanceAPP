import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

import ServerSelectionScreen from '../screens/ServerSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import AppTabs from './AppTabs';

// Settings Screens
import ProfileScreen from '../screens/settings/ProfileScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import CurrencyScreen from '../screens/settings/CurrencyScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';

// Detail Screens
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Read state from Zustand
  const serverUrl = useAppStore((state) => state.serverUrl);
  const token = useAppStore((state) => state.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!serverUrl ? (
        <Stack.Screen 
          name="ServerSelection" 
          component={ServerSelectionScreen} 
          options={{ animation: 'fade' }}
        />
      ) : !token ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ animation: 'slide_from_right' }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="AppTabs" 
            component={AppTabs} 
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="ProfileSettings" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SecuritySettings" component={SecurityScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="LanguageSettings" component={LanguageScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="CurrencySettings" component={CurrencyScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="NotificationSettings" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
