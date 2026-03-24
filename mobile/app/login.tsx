import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { setItem } from "../services/storage";
import api from "../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, { damping: 10 });
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Login Attempt:", { email, url: api.defaults.baseURL });
      // Real API Call
      const response = await api.post("/auth/login", { email, password });

      console.log("Login Success:", response.status);
      const { access_token, user } = response.data;

      if (access_token) {
        await setItem("user_token", access_token);
        await setItem("auth_token", access_token);
        await setItem("user_id", user.id);

        router.replace("/(tabs)/dashboard");
      } else {
        throw new Error("No token received");
      }
    } catch (error: any) {
      console.error(
        "Login failed Full Error:",
        error.message,
        error.config?.url,
        error.response?.status,
        error.response?.data,
      );
      const message =
        error.response?.data?.message || error.message || "Login failed";

      // Native Alert
      Alert.alert(
        "Login Error",
        `${message}\n\nHint: Check API URL in settings.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-12">
          {/* Animated Logo */}
          <Animated.View
            style={logoStyle}
            className="w-24 h-24 bg-primary rounded-2xl items-center justify-center mb-6 shadow-2xl shadow-primary/40"
          >
            <Text className="text-4xl">🏗️</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(500)}
            className="text-3xl font-bold text-foreground text-center"
          >
            Construction Connect
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(500)}
            className="text-muted-foreground text-center mt-2"
          >
            Site Superintendent Portal
          </Animated.Text>
        </View>

        <Animated.View
          entering={FadeInUp.delay(600).springify().damping(12)}
          className="space-y-4"
        >
          <View>
            <Text className="text-foreground mb-2 font-medium">Email</Text>
            <TextInput
              className="bg-card text-foreground p-4 rounded-xl border border-border focus:border-primary shadow-sm"
              placeholderTextColor="hsl(var(--muted-foreground))"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-foreground mb-2 font-medium">Password</Text>
            <TextInput
              className="bg-card text-foreground p-4 rounded-xl border border-border focus:border-primary shadow-sm"
              placeholderTextColor="hsl(var(--muted-foreground))"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/30 mt-6 active:scale-95 transition-transform"
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="hsl(var(--primary-foreground))" />
            ) : (
              <Text className="text-primary-foreground font-bold text-lg">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(800).duration(500)}
          className="mt-8 items-center"
        >
          <View className="bg-secondary/50 px-4 py-2 rounded-full">
            <Text className="text-muted-foreground text-xs font-medium">
              ⚡ Optimized for Field Use
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
