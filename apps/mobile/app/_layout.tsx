import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '../theme';
import { runMigrations } from '../db/schema';
import { useAuthStore } from '../stores/authStore';
import { requestNotificationPermissions, addNotificationResponseListener } from '../services/notifications';
import { router } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    async function init() {
      await runMigrations();
      await restoreSession();
      await requestNotificationPermissions();
    }
    init();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((taskId) => {
      router.push(`/task/${taskId}`);
    });
    return () => sub?.remove();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </PaperProvider>
  );
}

function RootNavigator() {
  const { isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="task/[id]"
        options={{ presentation: 'modal', headerShown: true, title: 'Task Details' }}
      />
    </Stack>
  );
}
