import { getDb } from './schema';
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  DEFAULT_REMINDER_FREQ_MIN,
  DEFAULT_REMINDER_START,
  DEFAULT_REMINDER_END,
} from '@dayframe/shared';
import { generateId, nowIso } from '../utils/id';

// ─── Row → Domain mapper ───────────────────────────────────────────────────────

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    scheduledDate: (row.scheduled_date as string) ?? undefined,
    dueDate: (row.due_date as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    recurrenceRule: (row.recurrence_rule as string) ?? undefined,
    reminderFreqMin: row.reminder_freq_min as number,
    reminderStart: row.reminder_start as string,
    reminderEnd: row.reminder_end as string,
    completedAt: (row.completed_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: (row.synced_at as string) ?? undefined,
    isDeleted: Boolean(row.is_deleted),
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const db = await getDb();
  const id = generateId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO tasks (
      id, user_id, title, description, priority,
      scheduled_date, due_date, category_id, recurrence_rule,
      reminder_freq_min, reminder_start, reminder_end,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.title,
      input.description ?? null,
      input.priority ?? TaskPriority.MEDIUM,
      input.scheduledDate ?? null,
      input.dueDate ?? null,
      input.categoryId ?? null,
      input.recurrenceRule ?? null,
      input.reminderFreqMin ?? DEFAULT_REMINDER_FREQ_MIN,
      input.reminderStart ?? DEFAULT_REMINDER_START,
      input.reminderEnd ?? DEFAULT_REMINDER_END,
      now,
      now,
    ],
  );

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE id = ?',
    [id],
  );
  return rowToTask(row!);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const db = await getDb();
  const now = nowIso();

  const sets: string[] = ['updated_at = ?'];
  const vals: unknown[] = [now];

  if (input.title !== undefined) { sets.push('title = ?'); vals.push(input.title); }
  if (input.description !== undefined) { sets.push('description = ?'); vals.push(input.description); }
  if (input.priority !== undefined) { sets.push('priority = ?'); vals.push(input.priority); }
  if (input.status !== undefined) { sets.push('status = ?'); vals.push(input.status); }
  if (input.scheduledDate !== undefined) { sets.push('scheduled_date = ?'); vals.push(input.scheduledDate); }
  if (input.dueDate !== undefined) { sets.push('due_date = ?'); vals.push(input.dueDate); }
  if (input.categoryId !== undefined) { sets.push('category_id = ?'); vals.push(input.categoryId); }
  if (input.recurrenceRule !== undefined) { sets.push('recurrence_rule = ?'); vals.push(input.recurrenceRule); }
  if (input.reminderFreqMin !== undefined) { sets.push('reminder_freq_min = ?'); vals.push(input.reminderFreqMin); }
  if (input.reminderStart !== undefined) { sets.push('reminder_start = ?'); vals.push(input.reminderStart); }
  if (input.reminderEnd !== undefined) { sets.push('reminder_end = ?'); vals.push(input.reminderEnd); }
  if (input.completedAt !== undefined) { sets.push('completed_at = ?'); vals.push(input.completedAt); }
  if (input.isDeleted !== undefined) { sets.push('is_deleted = ?'); vals.push(input.isDeleted ? 1 : 0); }

  vals.push(id);
  await db.runAsync(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, vals);

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE id = ?',
    [id],
  );
  return rowToTask(row!);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    'UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ?',
    [now, id],
  );
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE id = ? AND is_deleted = 0',
    [id],
  );
  return row ? rowToTask(row) : null;
}

export async function getTasksForDate(
  userId: string,
  date: string, // YYYY-MM-DD
): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM tasks
     WHERE user_id = ? AND scheduled_date = ? AND is_deleted = 0
     ORDER BY
       CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
       created_at ASC`,
    [userId, date],
  );
  return rows.map(rowToTask);
}

export async function getAllTasks(userId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM tasks
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map(rowToTask);
}

export async function searchTasks(
  userId: string,
  query: string,
): Promise<Task[]> {
  const db = await getDb();
  const like = `%${query}%`;
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM tasks
     WHERE user_id = ? AND is_deleted = 0
       AND (title LIKE ? OR description LIKE ?)
     ORDER BY updated_at DESC`,
    [userId, like, like],
  );
  return rows.map(rowToTask);
}

export async function getScheduledDates(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ scheduled_date: string }>(
    `SELECT DISTINCT scheduled_date FROM tasks
     WHERE user_id = ? AND scheduled_date IS NOT NULL AND is_deleted = 0`,
    [userId],
  );
  return rows.map((r) => r.scheduled_date);
}

/** Upsert a task row directly (used by sync) */
export async function upsertTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tasks (
      id, user_id, title, description, status, priority,
      scheduled_date, due_date, category_id, recurrence_rule,
      reminder_freq_min, reminder_start, reminder_end,
      completed_at, created_at, updated_at, synced_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title              = excluded.title,
      description        = excluded.description,
      status             = excluded.status,
      priority           = excluded.priority,
      scheduled_date     = excluded.scheduled_date,
      due_date           = excluded.due_date,
      category_id        = excluded.category_id,
      recurrence_rule    = excluded.recurrence_rule,
      reminder_freq_min  = excluded.reminder_freq_min,
      reminder_start     = excluded.reminder_start,
      reminder_end       = excluded.reminder_end,
      completed_at       = excluded.completed_at,
      updated_at         = excluded.updated_at,
      synced_at          = excluded.synced_at,
      is_deleted         = excluded.is_deleted`,
    [
      task.id,
      task.userId,
      task.title,
      task.description ?? null,
      task.status,
      task.priority,
      task.scheduledDate ?? null,
      task.dueDate ?? null,
      task.categoryId ?? null,
      task.recurrenceRule ?? null,
      task.reminderFreqMin,
      task.reminderStart,
      task.reminderEnd,
      task.completedAt ?? null,
      task.createdAt,
      task.updatedAt,
      task.syncedAt ?? null,
      task.isDeleted ? 1 : 0,
    ],
  );
}
