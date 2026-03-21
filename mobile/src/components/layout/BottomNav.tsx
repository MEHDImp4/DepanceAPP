import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Modal, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, ArrowRightLeft, Wallet, LayoutGrid, Menu, Settings, Target, Repeat, X } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

interface NavItemProps {
  icon: any;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const NavItem = ({ icon: Icon, label, isActive, onPress }: NavItemProps) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={styles.navItem}
  >
    <View style={styles.iconContainer}>
      {isActive && <View style={styles.activeBackground} />}
      <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
        <Icon
          size={22}
          color={isActive ? '#2563EB' : '#A1A1AA'}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </View>
    </View>
  </TouchableOpacity>
);

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  const currentRouteIndex = state.index;
  const currentRouteName = state.routes[currentRouteIndex].name;

  const toggleMore = (open: boolean) => {
    if (open) {
      setIsMoreOpen(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsMoreOpen(false));
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, label: 'Home' },
    { name: 'Transactions', icon: ArrowRightLeft, label: 'Transact' },
    { name: 'Accounts', icon: Wallet, label: 'Accounts' },
    { name: 'Templates', icon: LayoutGrid, label: 'Templates' },
  ];

  const handleNavigate = (name: string) => {
    navigation.navigate(name);
  };

  const moreItems = [
    { name: 'Recurring', icon: Repeat, label: 'Recurring' },
    { name: 'Goals', icon: Target, label: 'Goals' },
    { name: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const moreActive = moreItems.some(item => item.name === currentRouteName);

  return (
    <>
      <View style={[styles.container, { marginBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navBar}>
          {navItems.map((item) => (
            <NavItem
              key={item.name}
              icon={item.icon}
              label={item.label}
              isActive={currentRouteName === item.name}
              onPress={() => handleNavigate(item.name)}
            />
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleMore(true)}
            style={styles.navItem}
          >
            <View style={styles.iconContainer}>
              {moreActive && <View style={styles.activeBackground} />}
              <View style={[styles.iconWrapper, moreActive && styles.activeIconWrapper]}>
                <Menu size={22} color={moreActive ? '#2563EB' : '#A1A1AA'} strokeWidth={moreActive ? 2.5 : 2} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isMoreOpen}
        transparent
        animationType="fade"
        onRequestClose={() => toggleMore(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => toggleMore(false)}>
          <Animated.View
            style={[
              styles.sheetContainer,
              { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Explore</Text>
              <TouchableOpacity onPress={() => toggleMore(false)} style={styles.closeButton}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {moreItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.gridItem}
                  onPress={() => {
                    toggleMore(false);
                    handleNavigate(item.name);
                  }}
                >
                  <View style={styles.gridIconBackground}>
                    <item.icon size={26} color="#FAFAFA" strokeWidth={2} />
                  </View>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  navBar: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBackground: {
    position: 'absolute',
    width: 48,
    height: 48,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 16,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 16,
  },
  activeIconWrapper: {
    transform: [{ scale: 1.1 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: (width - 64 - 32) / 3, // 3 columns
    alignItems: 'center',
    gap: 8,
  },
  gridIconBackground: {
    width: 60,
    height: 60,
    backgroundColor: '#27272A',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
});
