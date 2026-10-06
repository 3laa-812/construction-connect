import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, I18nManager } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { GlassView } from '../ui/GlassView';
import { Colors, Fonts } from '../../constants/theme';
import { AmberGlow } from '../../constants/glass';
import { api } from '../../lib/api';

const TABS = [
  { name: 'index', label: { en: 'Home', ar: 'الرئيسية' }, icon: { active: 'home', inactive: 'home-outline' } },
  { name: 'work', label: { en: 'Work', ar: 'العمل' }, icon: { active: 'briefcase', inactive: 'briefcase-outline' } },
  { name: 'daily-logs', label: { en: 'Logs', ar: 'السجلات' }, icon: { active: 'clipboard', inactive: 'clipboard-outline' } },
  { name: 'commerce', label: { en: 'Commerce', ar: 'التجارة' }, icon: { active: 'storefront', inactive: 'storefront-outline' } },
  { name: 'profile', label: { en: 'Profile', ar: 'الملف' }, icon: { active: 'person-circle', inactive: 'person-circle-outline' } },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const lang = I18nManager.isRTL ? 'ar' : 'en';
  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications?unread=true').then((res) => res.data),
  });
  const unreadCount = Number(notifications?.total ?? 0);

  return (
    <GlassView
      variant="nav"
      style={[
        styles.container,
        { paddingBottom: insets.bottom || 20 }
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          // Only render the 4 main tabs defined in TABS
          const tabConfig = TABS.find(t => t.name === route.name);
          if (!tabConfig) return null;

          const isFocused = state.index === index;
          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              label={tabConfig.label[lang]}
              icon={tabConfig.icon}
              onPress={onPress}
              badgeCount={tabConfig.name === 'commerce' ? unreadCount : 0}
            />
          );
        })}
      </View>
    </GlassView>
  );
}

function TabItem({ isFocused, label, icon, onPress, badgeCount }: { 
  isFocused: boolean; 
  label: string; 
  icon: { active: any; inactive: any }; 
  onPress: () => void;
  badgeCount?: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(isFocused ? 20 : 0, { damping: 15, stiffness: 300 }),
    opacity: withSpring(isFocused ? 1 : 0),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const displayBadge = badgeCount && badgeCount > 0 ? (badgeCount > 99 ? '99+' : String(badgeCount)) : null;
  const badgeSizeStyle = displayBadge && displayBadge.length > 1 ? styles.badgeLarge : styles.badgeSmall;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <Animated.View style={[styles.content, animatedStyle]}>
        <View>
          <Ionicons
            name={isFocused ? icon.active : icon.inactive}
            size={24}
            color={isFocused ? Colors.amber : Colors.text3}
            style={isFocused && Platform.OS === 'ios' ? AmberGlow.soft : undefined}
          />
          {displayBadge ? (
            <View style={[styles.badge, badgeSizeStyle]}>
              <Text style={styles.badgeText}>{displayBadge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[
          styles.label,
          { color: isFocused ? Colors.text1 : Colors.text3, fontWeight: isFocused ? '600' : '400' }
        ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 46, 43, 0.6)',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    height: 2,
    backgroundColor: Colors.amber,
    borderRadius: 1,
    marginBottom: 6,
    position: 'absolute',
    top: 0,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeSmall: {
    minWidth: 16,
    height: 16,
  },
  badgeLarge: {
    minWidth: 20,
    height: 20,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontWeight: '700',
    fontSize: 9,
    color: Colors.text1,
  },
});
