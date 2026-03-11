import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, useTheme, MD3Theme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Task } from '@dayframe/shared';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { TaskCard } from '../../components/TaskCard';
import { TaskForm } from '../../components/TaskForm';
import { spacing, radius } from '../../theme';
import { todayDateString } from '../../utils/id';

export default function CalendarScreen() {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const { user } = useAuthStore();
  const { scheduledDates, createTask, completeTask, deleteTask, getTasksForDate, loadScheduledDates } = useTaskStore();
  const { categories, loadCategories } = useCategoryStore();

  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);

  const loadDay = useCallback(async (date: string) => {
    if (!user) return;
    const tasks = await getTasksForDate(user.id, date);
    setDayTasks(tasks);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadScheduledDates(user.id);
    loadCategories(user.id);
    loadDay(selectedDate);
  }, [user]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    loadDay(day.dateString);
  };

  // Build marked dates for calendar
  const markedDates: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string; dots?: Array<{ color: string }> }> = {};

  for (const d of scheduledDates) {
    markedDates[d] = { marked: true, dots: [{ color: theme.colors.primary }] };
  }
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: theme.colors.primary,
  };

  const getCategoryInfo = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name, color: cat?.color };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Calendar
        </Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurfaceVariant,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.onSurfaceDisabled,
          dotColor: theme.colors.primary,
          selectedDotColor: '#ffffff',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* Day label */}
      <View style={styles.dayHeader}>
        <Text variant="titleMedium" style={styles.dayLabel}>
          {selectedDate === todayDateString()
            ? 'Today'
            : format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d')}
        </Text>
        <Text variant="bodySmall" style={styles.taskCount}>
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={dayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No tasks on this day
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
                loadDay(selectedDate);
              }}
              onDelete={async () => {
                await deleteTask(item.id);
                setDayTasks((prev) => prev.filter((t) => t.id !== item.id));
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
        initialDate={selectedDate}
        categories={categories}
        onDismiss={() => setShowForm(false)}
        onSubmit={async (input) => {
          if (!user) return;
          await createTask(user.id, { ...input, scheduledDate: selectedDate });
          setShowForm(false);
          loadDay(selectedDate);
          loadScheduledDates(user.id);
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
    calendar: {
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      overflow: 'hidden',
      elevation: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    dayLabel: { fontWeight: '600', color: theme.colors.onBackground },
    taskCount: { color: theme.colors.onSurfaceVariant },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },
    emptyState: {
      alignItems: 'center',
      paddingTop: spacing.xl,
    },
    emptyText: { color: theme.colors.onSurfaceVariant },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.xl,
      backgroundColor: theme.colors.primary,
    },
  });
}
