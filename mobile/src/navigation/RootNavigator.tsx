import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

import ServerSelectionScreen from '../screens/ServerSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import AppTabs from './AppTabs';

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
        <Stack.Screen 
          name="AppTabs" 
          component={AppTabs} 
          options={{ animation: 'fade' }}
        />
      )}
    </Stack.Navigator>
  );
}
