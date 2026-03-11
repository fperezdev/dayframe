import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  useTheme,
  MD3Theme,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CreateTaskInput,
  TaskPriority,
  DEFAULT_REMINDER_FREQ_MIN,
  DEFAULT_REMINDER_START,
  DEFAULT_REMINDER_END,
  CATEGORY_COLORS,
} from '@dayframe/shared';
import { Category } from '@dayframe/shared';
import { spacing, radius } from '../theme';
import { format } from 'date-fns';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TaskPriority),
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  recurrenceRule: z.string().optional(),
  reminderFreqMin: z.number().min(5).max(1440),
  reminderStart: z.string().regex(/^\d{2}:\d{2}$/),
  reminderEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

type FormData = z.infer<typeof schema>;

// ─── Recurrence options ───────────────────────────────────────────────────────

const RECURRENCE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekdays', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
];

const FREQ_OPTIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskFormProps {
  visible: boolean;
  initialDate?: string;
  categories: Category[];
  onSubmit: (input: CreateTaskInput) => void;
  onDismiss: () => void;
}

export function TaskForm({
  visible,
  initialDate,
  categories,
  onSubmit,
  onDismiss,
}: TaskFormProps) {
  const theme = useTheme() as MD3Theme;
  const styles = makeStyles(theme);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const webTimeStartInputRef = useRef<HTMLInputElement | null>(null);
  const webTimeEndInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      scheduledDate: initialDate ?? '',
      dueDate: '',
      categoryId: '',
      recurrenceRule: '',
      reminderFreqMin: DEFAULT_REMINDER_FREQ_MIN,
      reminderStart: DEFAULT_REMINDER_START,
      reminderEnd: DEFAULT_REMINDER_END,
    },
  });

  const scheduledDate = watch('scheduledDate');
  const reminderStart = watch('reminderStart');
  const reminderEnd = watch('reminderEnd');
  const recurrenceRule = watch('recurrenceRule');
  const selectedCategoryId = watch('categoryId');

  const handleClose = () => {
    reset();
    onDismiss();
  };

  const onValid = (data: FormData) => {
    onSubmit({
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      scheduledDate: data.scheduledDate || undefined,
      dueDate: data.dueDate || undefined,
      categoryId: data.categoryId || undefined,
      recurrenceRule: data.recurrenceRule || undefined,
      reminderFreqMin: data.reminderFreqMin,
      reminderStart: data.reminderStart,
      reminderEnd: data.reminderEnd,
    });
    reset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.onSurface}
            />
          </Pressable>
          <Text variant="titleLarge" style={styles.headerTitle}>
            New Task
          </Text>
          <Button
            mode="contained"
            onPress={handleSubmit(onValid)}
            style={styles.saveBtn}
            labelStyle={styles.saveBtnLabel}
          >
            Save
          </Button>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Task title *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.title}
                style={styles.input}
                autoFocus
              />
            )}
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title.message}</Text>
          ) : null}

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description (optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            )}
          />

          <Divider style={styles.divider} />

          {/* Priority */}
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Priority
          </Text>
          <Controller
            control={control}
            name="priority"
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  {
                    value: TaskPriority.LOW,
                    label: 'Low',
                    icon: 'arrow-down',
                    style: value === TaskPriority.LOW ? { backgroundColor: theme.colors.secondaryContainer } : undefined,
                  },
                  {
                    value: TaskPriority.MEDIUM,
                    label: 'Medium',
                    icon: 'minus',
                    style: value === TaskPriority.MEDIUM ? { backgroundColor: theme.colors.tertiaryContainer } : undefined,
                  },
                  {
                    value: TaskPriority.HIGH,
                    label: 'High',
                    icon: 'arrow-up',
                    style: value === TaskPriority.HIGH ? { backgroundColor: theme.colors.errorContainer } : undefined,
                  },
                ]}
              />
            )}
          />

          <Divider style={styles.divider} />

          {/* Scheduled Date */}
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Scheduled for
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS === 'web') {
                webDateInputRef.current?.showPicker?.();
                webDateInputRef.current?.click();
              } else {
                setShowDatePicker(true);
              }
            }}
            style={styles.dateButton}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.dateButtonText}>
              {scheduledDate
                ? format(new Date(scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
                : 'Set date'}
            </Text>
            {scheduledDate ? (
              <Pressable
                onPress={() => setValue('scheduledDate', '')}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ) : null}
            {Platform.OS === 'web' ? (
              <input
                ref={webDateInputRef}
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={scheduledDate ?? ''}
                onChange={(e) => setValue('scheduledDate', e.target.value)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
            ) : null}
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={scheduledDate ? new Date(scheduledDate + 'T00:00:00') : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) {
                  setValue('scheduledDate', date.toISOString().slice(0, 10));
                }
              }}
            />
          ) : null}

          <Divider style={styles.divider} />

          {/* Reminder settings (only if date is set) */}
          {scheduledDate ? (
            <>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                Reminders
              </Text>

              {/* Frequency */}
              <Text variant="bodySmall" style={styles.subLabel}>
                Remind every
              </Text>
              <Controller
                control={control}
                name="reminderFreqMin"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.freqRow}>
                    {FREQ_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={[
                          styles.freqChip,
                          value === opt.value && styles.freqChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.freqChipText,
                            value === opt.value && styles.freqChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              />

              {/* Time range */}
              <Text variant="bodySmall" style={styles.subLabel}>
                Active hours
              </Text>
              <View style={styles.timeRangeRow}>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      webTimeStartInputRef.current?.showPicker?.();
                      webTimeStartInputRef.current?.click();
                    } else {
                      setShowTimePicker('start');
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="clock-start"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.timeButtonText}>{reminderStart}</Text>
                </Pressable>
                <Text style={styles.timeRangeSeparator}>—</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      webTimeEndInputRef.current?.showPicker?.();
                      webTimeEndInputRef.current?.click();
                    } else {
                      setShowTimePicker('end');
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="clock-end"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.timeButtonText}>{reminderEnd}</Text>
                </Pressable>
                {Platform.OS === 'web' ? (
                  <>
                    <input
                      ref={webTimeStartInputRef}
                      type="time"
                      value={reminderStart}
                      onChange={(e) => setValue('reminderStart', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                    />
                    <input
                      ref={webTimeEndInputRef}
                      type="time"
                      value={reminderEnd}
                      onChange={(e) => setValue('reminderEnd', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                    />
                  </>
                ) : null}
              </View>

              {showTimePicker ? (
                <DateTimePicker
                  value={(() => {
                    const t = showTimePicker === 'start' ? reminderStart : reminderEnd;
                    const [h, m] = t.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, 0, 0);
                    return d;
                  })()}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    const which = showTimePicker;
                    setShowTimePicker(null);
                    if (date) {
                      const hh = String(date.getHours()).padStart(2, '0');
                      const mm = String(date.getMinutes()).padStart(2, '0');
                      setValue(which === 'start' ? 'reminderStart' : 'reminderEnd', `${hh}:${mm}`);
                    }
                  }}
                />
              ) : null}

              <Divider style={styles.divider} />
            </>
          ) : null}

          {/* Recurrence */}
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Repeat
          </Text>
          <Controller
            control={control}
            name="recurrenceRule"
            render={({ field: { onChange, value } }) => (
              <View style={styles.recurrenceRow}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={[
                      styles.recurrenceChip,
                      value === opt.value && styles.recurrenceChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.recurrenceText,
                        value === opt.value && styles.recurrenceTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <Divider style={styles.divider} />

          {/* Category */}
          {categories.length > 0 ? (
            <>
              <Text variant="labelMedium" style={styles.sectionLabel}>
                Category
              </Text>
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() =>
                          onChange(value === cat.id ? '' : cat.id)
                        }
                        style={[
                          styles.categoryOption,
                          value === cat.id && {
                            backgroundColor: `${cat.color}22`,
                            borderColor: cat.color,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.categoryOptionDot,
                            { backgroundColor: cat.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.categoryOptionText,
                            value === cat.id && { color: cat.color },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              />
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    closeBtn: { padding: 4 },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
    },
    saveBtn: { borderRadius: radius.full },
    saveBtnLabel: { fontSize: 14 },
    scroll: { flex: 1 },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: spacing.xs,
    },
    textArea: { minHeight: 80 },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginBottom: spacing.xs,
    },
    divider: { marginVertical: spacing.md },
    sectionLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    subLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      position: 'relative',
    },
    dateButtonText: {
      flex: 1,
      color: theme.colors.onSurface,
    },
    freqRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    freqChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    freqChipActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    freqChipText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    freqChipTextActive: {
      color: theme.colors.primary,
    },
    timeRangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
      position: 'relative',
    },
    timeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    timeButtonText: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontSize: 16,
    },
    timeRangeSeparator: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 18,
    },
    recurrenceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    recurrenceChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
      borderRadius: radius.full,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    recurrenceChipActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    recurrenceText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    recurrenceTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    categoryScroll: { marginBottom: spacing.sm },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: 'transparent',
      marginRight: spacing.xs,
    },
    categoryOptionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    categoryOptionText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
}
