import React, { useState, useRef, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { AmberGlow } from '../../constants/glass';
import { GlassView } from '../../components/ui/GlassView';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';

const CODE_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (fullCode: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify', { userId, code: fullCode });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
      setLoading(false);
    }
  };

  const handleTextChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Paste
      const chars = text.split('').slice(0, CODE_LENGTH);
      const newCode = [...code];
      chars.forEach((c, i) => newCode[i] = c);
      setCode(newCode);
      const nextIndex = Math.min(chars.length, CODE_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      
      if (chars.length === CODE_LENGTH) {
        handleVerify(chars.join(''));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    
    if (newCode.join('').length === CODE_LENGTH) {
      Keyboard.dismiss();
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.post('/auth/resend-code', { userId });
      setCountdown(60);
    } catch (err) {
      // ignore or show toast
    }
  };

  return (
    <ScreenBackground style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text1} />
          </TouchableOpacity>
          <Text style={styles.title}>Verify your account</Text>
          <Text style={styles.subtitle}>Code sent to {userId}</Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((char, index) => {
            const isFocused = focusedIndex === index;
            return (
              <GlassView 
                key={index} 
                variant="input" 
                style={[
                  styles.codeInputWrapper, 
                  isFocused && styles.codeInputFocused,
                  isFocused && Platform.OS === 'ios' && AmberGlow.soft
                ]}
              >
                <TextInput
                  ref={ref => inputs.current[index] = ref}
                  style={styles.codeInput}
                  value={char}
                  onChangeText={(t) => handleTextChange(t, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  keyboardType="number-pad"
                  maxLength={6} // allow paste
                  selectTextOnFocus
                />
              </GlassView>
            );
          })}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.resendRow}>
          <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              Resend code
            </Text>
          </TouchableOpacity>
          {countdown > 0 && (
            <Text style={styles.timerText}>
              00:{countdown.toString().padStart(2, '0')}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 48,
  },
  backButton: {
    marginBottom: 24,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInputWrapper: {
    width: 52,
    height: 64,
    borderRadius: Radius.md,
  },
  codeInputFocused: {
    borderColor: Colors.amber,
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    fontSize: 28,
    color: Colors.text1,
  },
  errorText: {
    color: Colors.error,
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Colors.text3,
    fontWeight: '400',
  },
  timerText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.amber,
  }
});
