// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date string (YYYY-MM-DD) — the day this task is assigned to */
  scheduledDate?: string;
  /** ISO datetime string — when the task is due */
  dueDate?: string;
  categoryId?: string;
  /** RRULE string (RFC 5545) for recurring tasks */
  recurrenceRule?: string;
  /** Minutes between reminders (default: 60) */
  reminderFreqMin: number;
  /** HH:mm — start of reminder window (default: "08:00") */
  reminderStart: string;
  /** HH:mm — end of reminder window (default: "23:00") */
  reminderEnd: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export type CreateTaskInput = Pick<
  Task,
  | 'title'
  | 'description'
  | 'priority'
  | 'scheduledDate'
  | 'dueDate'
  | 'categoryId'
  | 'recurrenceRule'
  | 'reminderFreqMin'
  | 'reminderStart'
  | 'reminderEnd'
>;

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
  completedAt?: string;
  isDeleted?: boolean;
};

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type CreateCategoryInput = Pick<Category, 'name' | 'color' | 'icon'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncPayload {
  tasks: Task[];
  categories: Category[];
  /** ISO datetime — client's last sync timestamp */
  lastSyncedAt?: string;
}

export interface SyncResponse {
  tasks: Task[];
  categories: Category[];
  serverTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_REMINDER_FREQ_MIN = 60;
export const DEFAULT_REMINDER_START = '08:00';
export const DEFAULT_REMINDER_END = '23:00';

export const CATEGORY_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#64748B', // slate
];

