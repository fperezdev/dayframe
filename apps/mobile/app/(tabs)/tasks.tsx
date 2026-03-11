import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  FAB,
  useTheme,
  MD3Theme,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Task, TaskPriority, TaskStatus } from '@dayframe/shared';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { TaskCard } from '../../components/TaskCard';
import { TaskForm } from '../../components/TaskForm';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../../theme';

type FilterStatus = 'all' | TaskStatus;
type FilterPriority = 'all' | TaskPriority;

export default function TasksScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { user } = useAuthStore();
  const { tasks, loadTasks, createTask, completeTask, deleteTask, searchTasks } = useTaskStore();
  const { categories, loadCategories } = useCategoryStore();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Task[] | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTasks(user.id);
    loadCategories(user.id);
  }, [user]);

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (!user) return;
      if (text.trim().length === 0) {
        setSearchResults(null);
        return;
      }
      const results = await searchTasks(user.id, text.trim());
      setSearchResults(results);
    },
    [user],
  );

  const displayedTasks = (searchResults ?? tasks).filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory && t.categoryId !== filterCategory) return false;
    return true;
  });

  const getCategoryInfo = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name, color: cat?.color };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          All Tasks
        </Text>
      </View>

      {/* Search bar */}
      <Searchbar
        placeholder="Search tasks..."
        value={query}
        onChangeText={handleSearch}
        style={styles.searchbar}
        iconColor={theme.colors.onSurfaceVariant}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Status filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'All', value: 'all' as FilterStatus },
            { label: 'Pending', value: TaskStatus.PENDING },
            { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
            { label: 'Done', value: TaskStatus.COMPLETED },
          ]}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Chip
              selected={filterStatus === item.value}
              onPress={() => setFilterStatus(item.value)}
              style={[
                styles.filterChip,
                filterStatus === item.value && styles.filterChipActive,
              ]}
              textStyle={
                filterStatus === item.value
                  ? styles.filterChipTextActive
                  : styles.filterChipText
              }
              compact
            >
              {item.label}
            </Chip>
          )}
        />

        {/* Priority filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'Any Priority', value: 'all' as FilterPriority },
            { label: 'High', value: TaskPriority.HIGH },
            { label: 'Medium', value: TaskPriority.MEDIUM },
            { label: 'Low', value: TaskPriority.LOW },
          ]}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Chip
              selected={filterPriority === item.value}
              onPress={() => setFilterPriority(item.value)}
              style={[
                styles.filterChip,
                filterPriority === item.value && styles.filterChipActive,
              ]}
              textStyle={
                filterPriority === item.value
                  ? styles.filterChipTextActive
                  : styles.filterChipText
              }
              compact
            >
              {item.label}
            </Chip>
          )}
        />

        {/* Category filter */}
        {categories.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: '', name: 'All Categories', color: theme.colors.primary },
              ...categories,
            ]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <Chip
                selected={filterCategory === item.id}
                onPress={() => setFilterCategory(filterCategory === item.id ? '' : item.id)}
                style={[
                  styles.filterChip,
                  filterCategory === item.id && {
                    backgroundColor: `${item.color}22`,
                  },
                ]}
                textStyle={
                  filterCategory === item.id
                    ? { color: item.color, fontWeight: '600' }
                    : styles.filterChipText
                }
                compact
              >
                {item.name}
              </Chip>
            )}
          />
        ) : null}
      </View>

      {/* Results count */}
      <View style={styles.resultHeader}>
        <Text variant="bodySmall" style={styles.resultCount}>
          {displayedTasks.length} task{displayedTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Task list */}
      <FlatList
        data={displayedTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-text-off-outline"
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No tasks found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {query ? 'Try a different search term' : 'Tap + to add your first task'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { name, color } = getCategoryInfo(item.categoryId);
          return (
            <TaskCard
              task={item}
              categoryName={name}
              categoryColor={color}
              onPress={() => router.push(`/task/${item.id}`)}
              onComplete={async () => {
                await completeTask(item.id);
                if (user) loadTasks(user.id);
              }}
              onDelete={async () => {
                await deleteTask(item.id);
              }}
            />
          );
        }}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowForm(true)}
        color={theme.colors.onPrimary}
      />

      <TaskForm
        visible={showForm}
        categories={categories}
        onDismiss={() => setShowForm(false)}
        onSubmit={async (input) => {
          if (!user) return;
          await createTask(user.id, input);
          setShowForm(false);
          loadTasks(user.id);
        }}
      />
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
    searchbar: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.surface,
      elevation: 0,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    filtersContainer: { gap: 4 },
    filterRow: { paddingHorizontal: spacing.md, gap: 6, paddingBottom: 4 },
    filterChip: { backgroundColor: theme.colors.surfaceVariant },
    filterChipActive: { backgroundColor: theme.colors.primaryContainer },
    filterChipText: { color: theme.colors.onSurfaceVariant },
    filterChipTextActive: { color: theme.colors.primary, fontWeight: '600' },
    resultHeader: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    resultCount: { color: theme.colors.onSurfaceVariant },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },
    emptyState: {
      alignItems: 'center',
      paddingTop: spacing.xxl * 2,
      gap: spacing.sm,
    },
    emptyTitle: { color: theme.colors.onSurface, fontWeight: '600' },
    emptySubtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.xl,
      backgroundColor: theme.colors.primary,
    },
  });
}
