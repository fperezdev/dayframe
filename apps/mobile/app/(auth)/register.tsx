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

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { register, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await register(data.email, data.password);
      router.replace('/(tabs)/today');
    } catch (e) {
      console.error('[Register] onSubmit error:', e);
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
        <View style={styles.brand}>
          <Text variant="displaySmall" style={styles.brandName}>
            DayFrame
          </Text>
          <Text variant="bodyLarge" style={styles.brandTagline}>
            Start organizing your day
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="headlineSmall" style={styles.formTitle}>
            Create account
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
                autoComplete="new-password"
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                error={!!errors.confirmPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-check-outline" />}
              />
            )}
          />
          {errors.confirmPassword ? (
            <HelperText type="error">{errors.confirmPassword.message}</HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Sign In
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
    brand: { alignItems: 'center', marginBottom: spacing.xxl },
    brandName: { fontWeight: '800', color: theme.colors.primary, letterSpacing: -1 },
    brandTagline: { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs },
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
    formTitle: { fontWeight: '700', marginBottom: spacing.lg, color: theme.colors.onSurface },
    errorBanner: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorBannerText: { color: theme.colors.onErrorContainer, fontSize: 14 },
    input: { backgroundColor: theme.colors.surface, marginBottom: spacing.xs },
    submitButton: { marginTop: spacing.md, borderRadius: radius.md },
    submitButtonContent: { height: 50 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: { color: theme.colors.onSurfaceVariant },
    footerLink: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
  });
}
