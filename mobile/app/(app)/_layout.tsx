import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Glass, AmberGlow } from '../../constants/glass';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from '../../components/ui/GlassView';

export default function AppLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerStyle: { backgroundColor: Colors.ground },
        headerTintColor: Colors.text1,
        // Tab bar styling matching Forge Glass Spec
        tabBarBackground: () => (
          <GlassView variant="nav" style={StyleSheet.absoluteFill} />
        ),
        tabBarStyle: { 
          position: 'absolute',
          borderTopColor: Glass.nav.borderTopColor,
          borderTopWidth: 1,
          height: 64,
          elevation: 0, 
        },
        tabBarActiveTintColor: Colors.amber,
        tabBarInactiveTintColor: Colors.text3,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Geist',
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? AmberGlow.soft : undefined}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: [{ translateX: -10 }],
                  width: 20,
                  height: 2,
                  backgroundColor: Colors.amber,
                  borderRadius: 1
                }} />
              )}
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="work" 
        options={{ 
          title: 'Work',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? AmberGlow.soft : undefined}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: [{ translateX: -10 }],
                  width: 20,
                  height: 2,
                  backgroundColor: Colors.amber,
                  borderRadius: 1
                }} />
              )}
              <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />
            </View>
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="commerce" 
        options={{ 
          title: 'Commerce',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? AmberGlow.soft : undefined}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: [{ translateX: -10 }],
                  width: 20,
                  height: 2,
                  backgroundColor: Colors.amber,
                  borderRadius: 1
                }} />
              )}
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />
            </View>
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? AmberGlow.soft : undefined}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: [{ translateX: -10 }],
                  width: 20,
                  height: 2,
                  backgroundColor: Colors.amber,
                  borderRadius: 1
                }} />
              )}
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
            </View>
          ) 
        }} 
      />

      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="daily-logs" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="invoices" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="marketplace" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="orders" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="projects" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="rfqs" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="wallet" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
