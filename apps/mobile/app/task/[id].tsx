import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  MD3Theme,
  Appbar,
  Chip,
  Button,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Task, TaskStatus } from '@dayframe/shared';
import { getTaskById } from '../../db/tasks';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { priorityColors, priorityBgColors, spacing, radius } from '../../theme';
import { useAuthStore } from '../../stores/authStore';

const RECURRENCE_LABELS: Record<string, string> = {
  'FREQ=DAILY': 'Daily',
  'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR': 'Weekdays',
  'FREQ=WEEKLY': 'Weekly',
  'FREQ=MONTHLY': 'Monthly',
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { completeTask, deleteTask, updateTask } = useTaskStore();
  const { categories } = useCategoryStore();
  const { user } = useAuthStore();

  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    if (id) {
      getTaskById(id).then(setTask);
    }
  }, [id]);

  if (!task) return null;

  const category = categories.find((c) => c.id === task.categoryId);

  const handleComplete = async () => {
    if (task.status === TaskStatus.COMPLETED) return;
    const updated = await completeTask(task.id);
    setTask(updated);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'This will permanently delete this task.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Appbar.Action
              icon="trash-can-outline"
              color={theme.colors.error}
              onPress={handleDelete}
            />
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Status + Title */}
          <View style={styles.titleSection}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priorityBgColors[task.priority] },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: priorityColors[task.priority] },
                  ]}
                >
                  {task.priority.toUpperCase()} PRIORITY
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <MaterialCommunityIcons
                    name="check"
                    size={12}
                    color="#22C55E"
                  />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>
            <Text
              variant="headlineSmall"
              style={[styles.title, isCompleted && styles.titleCompleted]}
            >
              {task.title}
            </Text>
            {task.description ? (
              <Text variant="bodyLarge" style={styles.description}>
                {task.description}
              </Text>
            ) : null}
          </View>

          <Divider style={styles.divider} />

          {/* Details */}
          <View style={styles.detailsSection}>
            {/* Scheduled date */}
            {task.scheduledDate ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Scheduled for</Text>
                  <Text style={styles.detailValue}>
                    {format(
                      new Date(task.scheduledDate + 'T00:00:00'),
                      'EEEE, MMMM d, yyyy',
                    )}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Due date */}
            {task.dueDate ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(task.dueDate), 'MMM d, yyyy HH:mm')}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Reminder */}
            {task.scheduledDate ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reminders</Text>
                  <Text style={styles.detailValue}>
                    Every {task.reminderFreqMin >= 60
                      ? `${task.reminderFreqMin / 60}h`
                      : `${task.reminderFreqMin}m`}{' '}
                    · {task.reminderStart} – {task.reminderEnd}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Recurrence */}
            {task.recurrenceRule ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="repeat"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Repeats</Text>
                  <Text style={styles.detailValue}>
                    {RECURRENCE_LABELS[task.recurrenceRule] ?? task.recurrenceRule}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Category */}
            {category ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.categoryChip}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text style={[styles.detailValue, { color: category.color }]}>
                      {category.name}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Completed at */}
            {task.completedAt ? (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color="#22C55E"
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Completed</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(task.completedAt), 'MMM d, yyyy HH:mm')}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Created */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="calendar-plus"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(task.createdAt), 'MMM d, yyyy HH:mm')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action button */}
        {!isCompleted ? (
          <View style={styles.actionBar}>
            <Button
              mode="contained"
              icon="check"
              onPress={handleComplete}
              style={styles.completeButton}
              contentStyle={styles.completeButtonContent}
            >
              Mark as Complete
            </Button>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: spacing.md, paddingBottom: 120 },
    titleSection: { paddingBottom: spacing.md },
    statusRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    priorityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    priorityText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    completedText: { fontSize: 11, fontWeight: '700', color: '#22C55E' },
    title: {
      fontWeight: '700',
      color: theme.colors.onSurface,
      letterSpacing: -0.3,
      marginBottom: spacing.sm,
    },
    titleCompleted: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 24,
    },
    divider: { marginVertical: spacing.md },
    detailsSection: { gap: spacing.md },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    detailContent: { flex: 1 },
    detailLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    detailValue: {
      fontSize: 15,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryDot: { width: 8, height: 8, borderRadius: 4 },
    actionBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    completeButton: { borderRadius: radius.md },
    completeButtonContent: { height: 48 },
  });
}
