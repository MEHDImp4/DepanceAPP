import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, PieChart, Settings } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
// import TransactionsScreen from '../screens/TransactionsScreen';
// import BudgetScreen from '../screens/BudgetScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Temporary Stubs
function TransactionsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}><Text style={{color: '#fff'}}>Transactions</Text></View>;
}
function BudgetScreen() {
  return <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}><Text style={{color: '#fff'}}>Budget</Text></View>;
}
function SettingsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}><Text style={{color: '#fff'}}>Settings</Text></View>;
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#09090B', borderTopColor: '#27272A' },
        tabBarActiveTintColor: '#FAFAFA',
        tabBarInactiveTintColor: '#A1A1AA',
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <Home color={color} size={size} />;
          if (route.name === 'Transactions') return <List color={color} size={size} />;
          if (route.name === 'Budget') return <PieChart color={color} size={size} />;
          if (route.name === 'Settings') return <Settings color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
