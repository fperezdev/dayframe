import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Task } from '@dayframe/shared';
import { format, parse, addMinutes, isAfter, startOfDay } from 'date-fns';

// ─── Configuration ────────────────────────────────────────────────────────────

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Scheduling helpers ───────────────────────────────────────────────────────

/**
 * Given a task, compute all notification trigger times for its scheduled_date.
 * Slots are every reminderFreqMin minutes within [reminderStart, reminderEnd].
 */
function computeReminderSlots(task: Task): Date[] {
  if (!task.scheduledDate) return [];

  const base = startOfDay(parse(task.scheduledDate, 'yyyy-MM-dd', new Date()));

  const [startH, startM] = task.reminderStart.split(':').map(Number);
  const [endH, endM] = task.reminderEnd.split(':').map(Number);

  let cursor = new Date(base);
  cursor.setHours(startH, startM, 0, 0);

  const endTime = new Date(base);
  endTime.setHours(endH, endM, 0, 0);

  const now = new Date();
  const slots: Date[] = [];

  while (!isAfter(cursor, endTime)) {
    if (isAfter(cursor, now)) {
      slots.push(new Date(cursor));
    }
    cursor = addMinutes(cursor, task.reminderFreqMin);
  }

  return slots;
}

/** Notification identifier prefix for a task */
function notifIdForTask(taskId: string, slot: number): string {
  return `task_${taskId}_${slot}`;
}

/**
 * Schedule all reminder notifications for a task.
 * Cancels any previously scheduled notifications for this task first.
 */
export async function scheduleTaskReminders(task: Task): Promise<void> {
  if (Platform.OS === 'web') return;
  // Cancel existing reminders for this task
  await cancelTaskReminders(task.id);

  if (
    task.status === 'completed' ||
    task.isDeleted ||
    !task.scheduledDate
  ) {
    return;
  }

  const slots = computeReminderSlots(task);

  for (let i = 0; i < slots.length; i++) {
    const triggerDate = slots[i];
    await Notifications.scheduleNotificationAsync({
      identifier: notifIdForTask(task.id, i),
      content: {
        title: task.title,
        body:
          task.description
            ? task.description.slice(0, 100)
            : `Reminder: ${format(triggerDate, 'HH:mm')}`,
        data: { taskId: task.id },
        categoryIdentifier: 'reminders',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

/**
 * Cancel all scheduled notifications for a task.
 */
export async function cancelTaskReminders(taskId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled
    .filter((n) => n.identifier.startsWith(`task_${taskId}_`))
    .map((n) => n.identifier);

  await Promise.all(toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// ─── Notification response handler ───────────────────────────────────────────

export function addNotificationResponseListener(
  handler: (taskId: string) => void,
): Notifications.Subscription | null {
  if (Platform.OS === 'web') return null;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const taskId = response.notification.request.content.data?.taskId as
      | string
      | undefined;
    if (taskId) handler(taskId);
  });
}
