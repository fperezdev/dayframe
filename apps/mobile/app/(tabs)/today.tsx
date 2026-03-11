import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import {
  Text,
  FAB,
  useTheme,
  MD3Theme,
  Appbar,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Task, TaskStatus } from '@dayframe/shared';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { TaskCard } from '../../components/TaskCard';
import { TaskForm } from '../../components/TaskForm';
import { syncWithServer } from '../../services/sync';
import { spacing, radius } from '../../theme';
import { todayDateString } from '../../utils/id';

export default function TodayScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { user } = useAuthStore();
  const {
    createTask,
    completeTask,
    deleteTask,
    getTasksForDate,
    loadScheduledDates,
  } = useTaskStore();
  const { categories, loadCategories } = useCategoryStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelecting = selectedIds.size > 0;

  const today = todayDateString();
  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  const loadData = useCallback(async () => {
    if (!user) return;
    const [ts] = await Promise.all([
      getTasksForDate(user.id, today),
      loadCategories(user.id),
      loadScheduledDates(user.id),
    ]);
    setTasks(ts);
  }, [user, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncWithServer(user!.id);
    } catch {}
    await loadData();
    setRefreshing(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status !== TaskStatus.COMPLETED;
    if (filter === 'completed') return t.status === TaskStatus.COMPLETED;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

  const getCategoryInfo = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name, color: cat?.color };
  };

  const handleComplete = async (task: Task) => {
    if (task.status === TaskStatus.COMPLETED) return;
    await completeTask(task.id);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: TaskStatus.COMPLETED, completedAt: new Date().toISOString() }
          : t,
      ),
    );
  };

  const handleCirclePress = (task: Task) => {
    if (isSelecting || task.status !== TaskStatus.COMPLETED) {
      // Toggle selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(task.id)) {
          next.delete(task.id);
        } else {
          next.add(task.id);
        }
        return next;
      });
    }
  };

  const handleCompleteSelected = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    await Promise.all(
      ids.map(async (id) => {
        const task = tasks.find((t) => t.id === id);
        if (task && task.status !== TaskStatus.COMPLETED) {
          await completeTask(id);
        }
      }),
    );
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, status: TaskStatus.COMPLETED, completedAt: new Date().toISOString() }
          : t,
      ),
    );
  };

  const handleCancelSelection = () => setSelectedIds(new Set());

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) => deleteTask(id)));
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.dateLabel}>
            {dateLabel}
          </Text>
          <Text variant="bodySmall" style={styles.statsLabel}>
            {pendingCount} pending · {completedCount} done
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          style={styles.searchButton}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={theme.colors.onSurface}
          />
        </Pressable>
      </View>

      {/* Progress bar */}
      {tasks.length > 0 ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round((completedCount / tasks.length) * 100)}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text variant="labelSmall" style={styles.progressLabel}>
            {Math.round((completedCount / tasks.length) * 100)}% complete
          </Text>
        </View>
      ) : null}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
            ]}
            textStyle={filter === f ? styles.filterChipTextActive : styles.filterChipText}
            compact
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {filter === 'completed'
                ? 'No completed tasks yet'
                : 'No tasks for today'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {filter !== 'completed'
                ? 'Tap + to add a task for today'
                : 'Complete a task to see it here'}
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
              onPress={isSelecting ? () => handleCirclePress(item) : () => router.push(`/task/${item.id}`)}
              onComplete={() => handleCirclePress(item)}
              onDelete={isSelecting ? undefined : () => handleDelete(item.id)}
              selected={selectedIds.has(item.id)}
              isSelecting={isSelecting}
            />
          );
        }}
      />

      {/* Selection action bar */}
      {isSelecting ? (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>
            {selectedIds.size} selected
          </Text>
          <View style={styles.selectionActions}>
            <Pressable onPress={handleCancelSelection} style={styles.selectionBtn}>
              <Text style={styles.selectionBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleDeleteSelected} style={[styles.selectionBtn, styles.selectionBtnDanger]}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.onError} />
              <Text style={[styles.selectionBtnText, { color: theme.colors.onError }]}>Delete</Text>
            </Pressable>
            <Pressable onPress={handleCompleteSelected} style={[styles.selectionBtn, styles.selectionBtnPrimary]}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.onPrimary} />
              <Text style={[styles.selectionBtnText, { color: theme.colors.onPrimary }]}>Complete</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* FAB */
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowForm(true)}
          color={theme.colors.onPrimary}
        />
      )}

      {/* Task creation form */}
      <TaskForm
        visible={showForm}
        initialDate={today}
        categories={categories}
        onDismiss={() => setShowForm(false)}
        onSubmit={async (input) => {
          if (!user) return;
          const task = await createTask(user.id, input);
          setShowForm(false);
          await loadData();
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    dateLabel: {
      fontWeight: '700',
      color: theme.colors.onBackground,
      letterSpacing: -0.5,
    },
    statsLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    searchButton: { padding: spacing.xs },
    progressContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    progressLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'right',
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    filterChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primaryContainer,
    },
    filterChipText: { color: theme.colors.onSurfaceVariant },
    filterChipTextActive: { color: theme.colors.primary },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: 100,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xxl * 2,
      gap: spacing.sm,
    },
    emptyTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
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
    selectionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      paddingBottom: spacing.xl,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    selectionCount: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: 15,
    },
    selectionActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    selectionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    selectionBtnPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    selectionBtnDanger: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
    },
    selectionBtnText: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontSize: 14,
    },
  });
}
