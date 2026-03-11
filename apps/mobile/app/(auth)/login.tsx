import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  MD3Theme,
  HelperText,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { spacing, radius } from '../../theme';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login(data.email, data.password);
      router.replace('/(tabs)/today');
    } catch (e) {
      console.error('[Login] onSubmit error:', e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Text variant="displaySmall" style={styles.brandName}>
            DayFrame
          </Text>
          <Text variant="bodyLarge" style={styles.brandTagline}>
            Your day, structured.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text variant="headlineSmall" style={styles.formTitle}>
            Welcome back
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                style={styles.input}
                left={<TextInput.Icon icon="email-outline" />}
              />
            )}
          />
          {errors.email ? (
            <HelperText type="error">{errors.email.message}</HelperText>
          ) : null}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                error={!!errors.password}
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword((p) => !p)}
                  />
                }
              />
            )}
          />
          {errors.password ? (
            <HelperText type="error">{errors.password.message}</HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Sign In
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/register" style={styles.footerLink}>
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    brand: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    brandName: {
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: -1,
    },
    brandTagline: {
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing.xs,
    },
    form: {
      backgroundColor: theme.colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    formTitle: {
      fontWeight: '700',
      marginBottom: spacing.lg,
      color: theme.colors.onSurface,
    },
    errorBanner: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorBannerText: {
      color: theme.colors.onErrorContainer,
      fontSize: 14,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: spacing.xs,
    },
    submitButton: {
      marginTop: spacing.md,
      borderRadius: radius.md,
    },
    submitButtonContent: { height: 50 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: { color: theme.colors.onSurfaceVariant },
    footerLink: {
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
