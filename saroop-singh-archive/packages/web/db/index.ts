import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

type ArchiveDatabase = BetterSQLite3Database<typeof schema>;

type DatabaseState = {
  database: ArchiveDatabase;
  sqlite: Database.Database;
};

const globalDatabase = globalThis as typeof globalThis & {
  __saroopArchiveDatabase?: DatabaseState;
};

const configuredArchiveDataDir = process.env.ARCHIVE_DATA_DIR?.trim();

export const ARCHIVE_DATA_DIR =
  configuredArchiveDataDir ||
  join(/* turbopackIgnore: true */ process.cwd(), "archive-data");

export const ARCHIVE_DATABASE_PATH = join(
  /* turbopackIgnore: true */ ARCHIVE_DATA_DIR,
  "archive.sqlite",
);

function openDatabase(): DatabaseState {
  mkdirSync(ARCHIVE_DATA_DIR, { recursive: true });

  const sqlite = new Database(ARCHIVE_DATABASE_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = FULL");

  const database = drizzle(sqlite, { schema });
  migrate(database, {
    migrationsFolder:
      process.env.ARCHIVE_MIGRATIONS_DIR?.trim() || "drizzle",
  });

  return { database, sqlite };
}

function databaseState(): DatabaseState {
  globalDatabase.__saroopArchiveDatabase ??= openDatabase();
  return globalDatabase.__saroopArchiveDatabase;
}

export function getDb(): ArchiveDatabase {
  return databaseState().database;
}

export function verifyDatabaseWritable(): boolean {
  const sqlite = databaseState().sqlite;
  const marker = `health-${crypto.randomUUID()}`;
  sqlite.exec("CREATE TABLE IF NOT EXISTS archive_healthcheck (id TEXT PRIMARY KEY, created_at TEXT NOT NULL)");
  sqlite.prepare("INSERT INTO archive_healthcheck (id, created_at) VALUES (?, ?)").run(marker, new Date().toISOString());
  sqlite.prepare("DELETE FROM archive_healthcheck WHERE id = ?").run(marker);
  return true;
}
