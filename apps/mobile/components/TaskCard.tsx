import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Chip, useTheme, MD3Theme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task, TaskStatus, TaskPriority } from '@dayframe/shared';
import { priorityColors, priorityBgColors, spacing, radius } from '../theme';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  categoryName?: string;
  categoryColor?: string;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  isSelecting?: boolean;
}

const PRIORITY_ICONS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'arrow-down',
  [TaskPriority.MEDIUM]: 'minus',
  [TaskPriority.HIGH]: 'arrow-up',
};

export function TaskCard({
  task,
  categoryName,
  categoryColor,
  onPress,
  onComplete,
  onDelete,
  selected = false,
  isSelecting = false,
}: TaskCardProps) {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);
  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Completion toggle / selection indicator */}
      <Pressable
        onPress={onComplete}
        style={styles.checkboxArea}
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name={
            selected
              ? 'check-circle'
              : isSelecting
              ? 'circle-outline'
              : isCompleted
              ? 'check-circle'
              : 'circle-outline'
          }
          size={24}
          color={
            selected
              ? theme.colors.primary
              : isSelecting
              ? theme.colors.outline
              : isCompleted
              ? theme.colors.primary
              : theme.colors.outlineVariant
          }
        />
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <Text
          variant="bodyLarge"
          style={[styles.title, isCompleted && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text
            variant="bodySmall"
            style={styles.description}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {/* Priority badge */}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityBgColors[task.priority] },
            ]}
          >
            <MaterialCommunityIcons
              name={PRIORITY_ICONS[task.priority] as any}
              size={10}
              color={priorityColors[task.priority]}
            />
            <Text
              style={[styles.priorityText, { color: priorityColors[task.priority] }]}
            >
              {task.priority}
            </Text>
          </View>

          {/* Category chip */}
          {categoryName ? (
            <View
              style={[
                styles.categoryChip,
                { backgroundColor: `${categoryColor ?? '#6366F1'}22` },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryColor ?? '#6366F1' },
                ]}
              />
              <Text
                style={[styles.categoryText, { color: categoryColor ?? '#6366F1' }]}
                numberOfLines={1}
              >
                {categoryName}
              </Text>
            </View>
          ) : null}

          {/* Due time */}
          {task.dueDate ? (
            <View style={styles.timeChip}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={10}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.timeText}>
                {format(new Date(task.dueDate), 'HH:mm')}
              </Text>
            </View>
          ) : null}

          {/* Recurring icon */}
          {task.recurrenceRule ? (
            <MaterialCommunityIcons
              name="repeat"
              size={12}
              color={theme.colors.onSurfaceVariant}
              style={styles.recurIcon}
            />
          ) : null}
        </View>
      </View>

      {/* Delete button */}
      {onDelete ? (
        <Pressable onPress={onDelete} style={styles.deleteArea} hitSlop={8}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    cardPressed: {
      opacity: 0.85,
    },
    cardSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    checkboxArea: {
      marginRight: spacing.sm,
      paddingTop: 1,
    },
    content: {
      flex: 1,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      lineHeight: 22,
    },
    titleCompleted: {
      textDecorationLine: 'line-through',
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      marginBottom: spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '500',
    },
    timeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    timeText: {
      fontSize: 10,
      color: '#64748B',
    },
    recurIcon: {
      marginLeft: 2,
    },
    deleteArea: {
      marginLeft: spacing.sm,
      paddingTop: 2,
    },
  });
}
