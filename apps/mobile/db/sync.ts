import { getDb } from './schema';
import { generateId, nowIso } from '../utils/id';

export interface SyncQueueItem {
  id: string;
  entityType: 'task' | 'category';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: unknown;
  createdAt: string;
}

export async function enqueueSyncItem(
  entityType: 'task' | 'category',
  entityId: string,
  action: 'create' | 'update' | 'delete',
  payload: unknown,
): Promise<void> {
  const db = await getDb();
  // Remove any existing pending item for this entity (deduplicate)
  await db.runAsync(
    'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
    [entityType, entityId],
  );
  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), entityType, entityId, action, JSON.stringify(payload), nowIso()],
  );
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC',
  );
  return rows.map((r) => ({
    id: r.id as string,
    entityType: r.entity_type as 'task' | 'category',
    entityId: r.entity_id as string,
    action: r.action as 'create' | 'update' | 'delete',
    payload: JSON.parse(r.payload as string),
    createdAt: r.created_at as string,
  }));
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
