import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'dayframe.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return _db;
}

/**
 * Run all DDL migrations to initialize or upgrade the local database.
 * Each migration is idempotent (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
export async function runMigrations(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ── Users (local cache of the authenticated user) ──────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- ── Categories ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT PRIMARY KEY NOT NULL,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#6366F1',
      icon        TEXT,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      synced_at   TEXT,
      is_deleted  INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

    -- ── Tasks ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tasks (
      id                  TEXT PRIMARY KEY NOT NULL,
      user_id             TEXT NOT NULL,
      title               TEXT NOT NULL,
      description         TEXT,
      status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','in_progress','completed')),
      priority            TEXT NOT NULL DEFAULT 'medium'
                            CHECK(priority IN ('low','medium','high')),
      scheduled_date      TEXT,
      due_date            TEXT,
      category_id         TEXT REFERENCES categories(id) ON DELETE SET NULL,
      recurrence_rule     TEXT,
      reminder_freq_min   INTEGER NOT NULL DEFAULT 60,
      reminder_start      TEXT NOT NULL DEFAULT '08:00',
      reminder_end        TEXT NOT NULL DEFAULT '23:00',
      completed_at        TEXT,
      created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      synced_at           TEXT,
      is_deleted          INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id       ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_category_id   ON tasks(category_id);

    -- ── Sync queue (pending local changes to push to server) ───────────────────
    CREATE TABLE IF NOT EXISTS sync_queue (
      id           TEXT PRIMARY KEY NOT NULL,
      entity_type  TEXT NOT NULL CHECK(entity_type IN ('task','category')),
      entity_id    TEXT NOT NULL,
      action       TEXT NOT NULL CHECK(action IN ('create','update','delete')),
      payload      TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- ── App settings (key-value) ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      key    TEXT PRIMARY KEY NOT NULL,
      value  TEXT NOT NULL
    );
  `);
}
