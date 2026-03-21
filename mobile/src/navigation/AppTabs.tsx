import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNav } from '../components/layout/BottomNav';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import RecurringScreen from '../screens/RecurringScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
      
      {/* Screens hidden from bottom bar but accessible via navigation (More menu) */}
      <Tab.Screen name="Recurring" component={RecurringScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
