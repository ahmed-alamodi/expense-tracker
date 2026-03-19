import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { isConfigured } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthScreen() {
  const colors = useThemeColor();
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isConfigured) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.setupTitle, { color: colors.text }]}>
          {t('auth.supabaseNotConfigured')}
        </Text>
        <Text style={[styles.setupDesc, { color: colors.textSecondary }]}>
          {t('auth.supabaseSetupGuide')}
        </Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.warning'), t('auth.enterCredentials'));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert(t('common.warning'), t('auth.passwordMismatch'));
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert(t('common.warning'), t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          Alert.alert(t('common.error'), getErrorMessage(error.message));
        }
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          Alert.alert(t('common.error'), getErrorMessage(error.message));
        } else {
          Alert.alert(
            t('auth.registered'),
            t('auth.registeredMsg'),
            [{ text: t('common.ok'), onPress: () => setIsLogin(true) }]
          );
        }
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (msg: string) => {
    if (msg.includes('Invalid login')) return t('auth.invalidLogin');
    if (msg.includes('already registered')) return t('auth.alreadyRegistered');
    if (msg.includes('invalid email')) return t('auth.invalidEmail');
    return msg;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="wallet" size={48} color={colors.tint} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>{t('auth.appName')}</Text>
          <Text style={[styles.appDesc, { color: colors.textSecondary }]}>
            {t('auth.appTagline')}
          </Text>
        </View>

        {/* Toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, isLogin && { backgroundColor: colors.tint }]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, { color: isLogin ? '#FFF' : colors.textSecondary }]}>
              {t('auth.login')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isLogin && { backgroundColor: colors.tint }]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, { color: !isLogin ? '#FFF' : colors.textSecondary }]}>
              {t('auth.signup')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('auth.email')}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('auth.password')}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
            />
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
          </View>

          {!isLogin && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.confirmPassword')}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.tint, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={isLogin ? 'log-in-outline' : 'person-add-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.submitText}>
                  {isLogin ? t('auth.login') : t('auth.createAccount')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  setupDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
  },
  appDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
