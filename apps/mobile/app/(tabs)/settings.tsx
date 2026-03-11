import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  MD3Theme,
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { Category, CATEGORY_COLORS } from '@dayframe/shared';
import { spacing, radius } from '../../theme';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { user, logout } = useAuthStore();
  const { categories, loadCategories, createCategory, deleteCategory } = useCategoryStore();

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (user) loadCategories(user.id);
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) return;
    await createCategory(user.id, {
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });
    setNewCategoryName('');
    setShowCategoryDialog(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Tasks in this category will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(cat.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            Account
          </Text>
          <View style={styles.card}>
            <View style={styles.accountRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text variant="titleMedium" style={styles.accountEmail}>
                  {user?.email}
                </Text>
                <Text variant="bodySmall" style={styles.accountSubtext}>
                  Signed in
                </Text>
              </View>
            </View>
            <Divider style={styles.cardDivider} />
            <Pressable style={styles.cardRow} onPress={handleLogout}>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={theme.colors.error}
              />
              <Text style={[styles.cardRowText, { color: theme.colors.error }]}>
                Sign Out
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Categories
            </Text>
            <Pressable
              onPress={() => setShowCategoryDialog(true)}
              style={styles.addButton}
            >
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {categories.length === 0 ? (
              <Text style={styles.emptyCategories}>
                No categories yet. Add one to organize your tasks.
              </Text>
            ) : (
              categories.map((cat, i) => (
                <React.Fragment key={cat.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.categoryRow}>
                    <View
                      style={[
                        styles.categoryColorDot,
                        { backgroundColor: cat.color },
                      ]}
                    />
                    <Text style={styles.categoryName} variant="bodyMedium">
                      {cat.name}
                    </Text>
                    <Pressable
                      onPress={() => handleDeleteCategory(cat)}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </Pressable>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            About
          </Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.cardRowText}>DayFrame</Text>
              <Text style={styles.cardRowValue}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Category Dialog */}
      <Portal>
        <Dialog
          visible={showCategoryDialog}
          onDismiss={() => setShowCategoryDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>New Category</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={styles.dialogInput}
              autoFocus
            />
            <Text variant="labelMedium" style={styles.colorLabel}>
              Color
            </Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewCategoryColor(color)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    newCategoryColor === color && styles.colorSwatchSelected,
                  ]}
                >
                  {newCategoryColor === color ? (
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button
              onPress={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerTitle: { fontWeight: '700', color: theme.colors.onBackground },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    section: { marginBottom: spacing.lg },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    cardDivider: { marginHorizontal: spacing.md },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    cardRowText: {
      flex: 1,
      color: theme.colors.onSurface,
      fontSize: 15,
    },
    cardRowValue: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    accountInfo: { flex: 1 },
    accountEmail: { color: theme.colors.onSurface, fontWeight: '600' },
    accountSubtext: { color: theme.colors.onSurfaceVariant },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    categoryColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    categoryName: { flex: 1, color: theme.colors.onSurface },
    emptyCategories: {
      color: theme.colors.onSurfaceVariant,
      padding: spacing.md,
      textAlign: 'center',
    },
    dialog: { backgroundColor: theme.colors.surface },
    dialogInput: { backgroundColor: theme.colors.surface, marginBottom: spacing.md },
    colorLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSwatchSelected: {
      borderWidth: 2,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
  });
}
