import { getDb } from './schema';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@dayframe/shared';
import { generateId, nowIso } from '../utils/id';

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    color: row.color as string,
    icon: (row.icon as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    isDeleted: Boolean(row.is_deleted),
  };
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<Category> {
  const db = await getDb();
  const id = generateId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.color, input.icon ?? null, now, now],
  );

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM categories WHERE id = ?',
    [id],
  );
  return rowToCategory(row!);
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const db = await getDb();
  const now = nowIso();

  const sets: string[] = ['updated_at = ?'];
  const vals: unknown[] = [now];

  if (input.name !== undefined) { sets.push('name = ?'); vals.push(input.name); }
  if (input.color !== undefined) { sets.push('color = ?'); vals.push(input.color); }
  if (input.icon !== undefined) { sets.push('icon = ?'); vals.push(input.icon); }

  vals.push(id);
  await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, vals);

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM categories WHERE id = ?',
    [id],
  );
  return rowToCategory(row!);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    'UPDATE categories SET is_deleted = 1, updated_at = ? WHERE id = ?',
    [now, id],
  );
}

export async function getAllCategories(userId: string): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM categories WHERE user_id = ? AND is_deleted = 0 ORDER BY name ASC',
    [userId],
  );
  return rows.map(rowToCategory);
}

export async function upsertCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, color, icon, created_at, updated_at, synced_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name       = excluded.name,
       color      = excluded.color,
       icon       = excluded.icon,
       updated_at = excluded.updated_at,
       synced_at  = excluded.synced_at,
       is_deleted = excluded.is_deleted`,
    [
      category.id,
      category.userId,
      category.name,
      category.color,
      category.icon ?? null,
      category.createdAt,
      category.updatedAt,
      category.syncedAt ?? null,
      category.isDeleted ? 1 : 0,
    ],
  );
}
