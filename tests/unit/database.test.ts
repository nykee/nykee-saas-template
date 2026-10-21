import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { getAuthTables } from 'better-auth/db';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';
import { afterEach, describe, expect, it } from 'vitest';
import { databaseSchema } from '@/db/schema';
import { createAuthOptions } from '@/lib/server/auth-options';

/**
 * Inspect the production plugins and model options without Cloudflare bindings.
 * Omitting secondary storage deliberately checks the complete persistent
 * schema, including session and verification tables retained by the template.
 */
const authTables = getAuthTables(
  createAuthOptions({
    authUrl: 'https://auth.example.com',
    secret: 'database-contract-test-secret-at-least-32-characters',
    googleClientId: 'database-contract-test',
    googleClientSecret: 'database-contract-test',
  })
);
const schema: Record<string, SQLiteTable> = databaseSchema;
const journal: { entries: { tag: string }[] } = JSON.parse(
  readFileSync('drizzle/meta/_journal.json', 'utf8')
);
const migrations = journal.entries.map(({ tag }) => `${tag}.sql`);
const databases: DatabaseSync[] = [];

/** Each test gets real, isolated SQLite tables with foreign keys enabled. */
function createDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  databases.push(database);
  return database;
}

/**
 * Match Wrangler's per-migration transaction boundary. Failed backfills must
 * preserve the original rows, indexes, and table rather than partially apply.
 */
function applyMigration(database: DatabaseSync, filename: string) {
  database.exec('BEGIN');
  try {
    database.exec(readFileSync(`drizzle/${filename}`, 'utf8'));
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

/** Quote schema-owned SQL identifiers when preparing migration assertions. */
function identifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Seed the pre-upgrade schema to prove populated databases can migrate. */
function createLegacyDatabase(providerId = 'google') {
  const database = createDatabase();
  for (const migration of migrations.slice(0, 2)) {
    applyMigration(database, migration);
  }
  database.exec(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
    VALUES ('user-1', 'Existing user', 'existing@example.com', 1, 1000, 2000);
  `);
  database
    .prepare(`
      INSERT INTO account (
        id, account_id, provider_id, user_id, access_token, refresh_token,
        id_token, access_token_expires_at, refresh_token_expires_at,
        scope, password, created_at, updated_at
      ) VALUES (
        'account-1', 'google-subject', ?, 'user-1', 'access', 'refresh',
        'id-token', 3000, 4000, 'openid,email,profile', NULL, 1000, 2000
      )
    `)
    .run(providerId);
  return database;
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

describe('Better Auth and D1 schema contract', () => {
  it('provides every installed core and plugin field with its required type', () => {
    for (const table of Object.values(authTables)) {
      const model = schema[table.modelName];
      expect(model, `Missing auth model ${table.modelName}`).toBeDefined();
      const columns = getTableColumns(model);
      for (const [field, specification] of Object.entries(table.fields)) {
        const column = columns[specification.fieldName ?? field];
        const label = `${table.modelName}.${field}`;
        expect(column, `Missing Better Auth field ${label}`).toBeDefined();
        expect(column.dataType, label).toBe(specification.type);
        if (specification.required) expect(column.notNull, label).toBe(true);
      }

      // Validate identity constraints as well as columns: issuer/accountId
      // uniqueness is part of the 1.7 contract and prevents duplicate links.
      const uniqueFields = Object.entries(table.fields)
        .filter(([, field]) => field.unique)
        .map(([field]) => [field]);
      const uniqueIndexes = table.indexes
        ?.filter((index) => index.unique)
        .map((index) => index.fields);
      const indexes = getTableConfig(model).indexes;
      for (const fields of [...uniqueFields, ...(uniqueIndexes ?? [])]) {
        const expectedColumns = fields.map(
          (field) => columns[table.fields[field].fieldName ?? field]
        );
        expect(
          indexes.some(
            (index) =>
              index.config.unique &&
              index.config.columns.length === expectedColumns.length &&
              index.config.columns.every(
                (column, position) => column === expectedColumns[position]
              )
          ),
          `Missing unique identity constraint ${table.modelName}(${fields})`
        ).toBe(true);
      }
    }
  });

  it('creates the complete Drizzle schema and indexes from committed migrations', () => {
    expect(
      readdirSync('drizzle')
        .filter((file) => file.endsWith('.sql'))
        .sort()
    ).toEqual([...migrations].sort());
    const database = createDatabase();
    for (const migration of migrations) applyMigration(database, migration);

    for (const table of Object.values(schema)) {
      const configuration = getTableConfig(table);
      const columns = database
        .prepare('SELECT * FROM pragma_table_info(?)')
        .all(configuration.name);
      expect(
        columns.map((column) => column.name).sort(),
        configuration.name
      ).toEqual(configuration.columns.map((column) => column.name).sort());
      for (const column of configuration.columns) {
        const actual = columns.find((item) => item.name === column.name);
        expect(actual?.type, `${configuration.name}.${column.name}`).toBe(
          column.getSQLType().toUpperCase()
        );
        expect(actual?.notnull).toBe(Number(column.notNull));
        expect(actual?.pk).toBe(Number(column.primary));
      }

      const indexes = database
        .prepare('SELECT * FROM pragma_index_list(?)')
        .all(configuration.name);
      for (const index of configuration.indexes) {
        const actual = indexes.find((item) => item.name === index.config.name);
        expect(actual, `Missing index ${index.config.name}`).toBeDefined();
        expect(actual?.unique).toBe(Number(index.config.unique));
        const indexedColumns = database
          .prepare('SELECT name FROM pragma_index_info(?) ORDER BY seqno')
          .all(index.config.name);
        expect(indexedColumns.map((column) => column.name)).toEqual(
          index.config.columns.map((column) =>
            'name' in column ? column.name : undefined
          )
        );
      }
    }
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('preserves existing Google credentials while backfilling the canonical issuer', () => {
    const database = createLegacyDatabase();
    const original = database.prepare('SELECT * FROM account').get();
    for (const migration of migrations.slice(2)) {
      applyMigration(database, migration);
    }
    expect(database.prepare('SELECT * FROM account').get()).toEqual({
      ...original,
      issuer: 'https://accounts.google.com',
    });

    // Duplicate identities must fail even if a second integration uses a
    // different provider ID. Every copied value comes from the actual schema.
    const columns = getTableConfig(databaseSchema.account).columns;
    const names = columns.map((column) => identifier(column.name)).join(', ');
    const values = columns
      .map((column) => {
        if (column.name === 'id') return "'account-2'";
        if (column.name === 'provider_id') return "'another-integration'";
        return identifier(column.name);
      })
      .join(', ');
    expect(() =>
      database.exec(
        `INSERT INTO account (${names}) SELECT ${values} FROM account`
      )
    ).toThrow(/UNIQUE constraint failed/);
    expect(() => database.exec('UPDATE account SET issuer = NULL')).toThrow(
      /NOT NULL constraint failed/
    );
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    database.exec("DELETE FROM user WHERE id = 'user-1'");
    expect(database.prepare('SELECT * FROM account').all()).toEqual([]);
  });

  it('rolls back an unknown provider instead of assigning it a guessed issuer', () => {
    const database = createLegacyDatabase('custom-provider');
    const original = database.prepare('SELECT * FROM account').get();
    expect(() => applyMigration(database, migrations[2])).toThrow(
      /NOT NULL constraint failed/
    );
    expect(database.prepare('SELECT * FROM account').get()).toEqual(original);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = '__new_account'")
        .all()
    ).toEqual([]);
  });
});
