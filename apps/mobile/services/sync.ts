import { syncApi } from './api';
import { getPendingSyncItems, removeSyncItem, setSetting, getSetting } from '../db/sync';
import { upsertTask } from '../db/tasks';
import { upsertCategory } from '../db/categories';
import { Task, Category } from '@dayframe/shared';

let _isSyncing = false;

/**
 * Push local pending changes and pull server changes.
 * Uses last-write-wins conflict resolution (server wins on conflict).
 */
export async function syncWithServer(userId: string): Promise<void> {
  if (_isSyncing) return;
  _isSyncing = true;

  try {
    const pending = await getPendingSyncItems();
    const lastSyncedAt = await getSetting('last_synced_at');

    // Collect tasks and categories to push
    const tasks: Task[] = pending
      .filter((i) => i.entityType === 'task')
      .map((i) => i.payload as Task);

    const categories: Category[] = pending
      .filter((i) => i.entityType === 'category')
      .map((i) => i.payload as Category);

    const response = await syncApi.sync({
      tasks,
      categories,
      lastSyncedAt: lastSyncedAt ?? undefined,
    });

    // Apply server changes locally
    for (const task of response.tasks) {
      await upsertTask({ ...task, syncedAt: response.serverTime });
    }
    for (const category of response.categories) {
      await upsertCategory({ ...category, syncedAt: response.serverTime });
    }

    // Clear pushed items
    for (const item of pending) {
      await removeSyncItem(item.id);
    }

    await setSetting('last_synced_at', response.serverTime);
  } finally {
    _isSyncing = false;
  }
}
