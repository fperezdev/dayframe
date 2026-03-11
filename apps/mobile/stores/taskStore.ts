import { create } from 'zustand';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@dayframe/shared';
import {
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  getAllTasks,
  getTasksForDate,
  searchTasks as dbSearchTasks,
  getScheduledDates,
} from '../db/tasks';
import { enqueueSyncItem } from '../db/sync';
import { scheduleTaskReminders, cancelTaskReminders } from '../services/notifications';
import { nowIso } from '../utils/id';

interface TasksState {
  tasks: Task[];
  scheduledDates: string[];
  isLoading: boolean;
  error: string | null;
  // Actions
  loadTasks: (userId: string) => Promise<void>;
  loadScheduledDates: (userId: string) => Promise<void>;
  getTasksForDate: (userId: string, date: string) => Promise<Task[]>;
  createTask: (userId: string, input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  completeTask: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  searchTasks: (userId: string, query: string) => Promise<Task[]>;
  clearError: () => void;
}

export const useTaskStore = create<TasksState>((set, get) => ({
  tasks: [],
  scheduledDates: [],
  isLoading: false,
  error: null,

  loadTasks: async (userId) => {
    set({ isLoading: true });
    try {
      const tasks = await getAllTasks(userId);
      set({ tasks, isLoading: false });
    } catch (err: unknown) {
      set({ error: String(err), isLoading: false });
    }
  },

  loadScheduledDates: async (userId) => {
    const dates = await getScheduledDates(userId);
    set({ scheduledDates: dates });
  },

  getTasksForDate: async (userId, date) => {
    return getTasksForDate(userId, date);
  },

  createTask: async (userId, input) => {
    const task = await dbCreateTask(userId, input);
    await enqueueSyncItem('task', task.id, 'create', task);
    await scheduleTaskReminders(task);
    // Optimistically update store
    set((s) => ({
      tasks: [task, ...s.tasks],
      scheduledDates: task.scheduledDate
        ? Array.from(new Set([...s.scheduledDates, task.scheduledDate]))
        : s.scheduledDates,
    }));
    return task;
  },

  updateTask: async (id, input) => {
    const task = await dbUpdateTask(id, input);
    await enqueueSyncItem('task', task.id, 'update', task);
    await scheduleTaskReminders(task);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
    }));
    return task;
  },

  completeTask: async (id) => {
    const task = await dbUpdateTask(id, {
      status: TaskStatus.COMPLETED,
      completedAt: nowIso(),
    });
    await enqueueSyncItem('task', task.id, 'update', task);
    await cancelTaskReminders(id);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
    }));
    return task;
  },

  deleteTask: async (id) => {
    await dbDeleteTask(id);
    await enqueueSyncItem('task', id, 'delete', { id });
    await cancelTaskReminders(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
    }));
  },

  searchTasks: async (userId, query) => {
    return dbSearchTasks(userId, query);
  },

  clearError: () => set({ error: null }),
}));
