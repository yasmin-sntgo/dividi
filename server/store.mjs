import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function openStore(
  filename = process.env.DIVIDI_DATABASE_PATH ||
    fileURLToPath(new URL('../data/dividi.sqlite', import.meta.url)),
) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS account_data (owner TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0);`);
  return {
    db,
    userByEmail(email) {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },
    createUser(user) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO users (id,email,name,password_hash) VALUES (?,?,?,?)').run(
          user.id,
          user.email,
          user.name,
          user.hash,
        );
        db.prepare('INSERT INTO account_data (owner,data,version) VALUES (?,?,0)').run(
          user.id,
          JSON.stringify({ name: user.name, groups: [] }),
        );
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    createSession(hash, id, expires) {
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
      db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(
        hash,
        id,
        expires,
      );
    },
    sessionUser(hash) {
      return db
        .prepare(
          'SELECT users.id,users.email,users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?',
        )
        .get(hash, Date.now());
    },
    deleteSession(hash) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash);
    },
    getData(id) {
      const row = db.prepare('SELECT data,version FROM account_data WHERE owner = ?').get(id);
      return { data: JSON.parse(row.data), version: row.version };
    },
    saveData(id, data, version) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = db
          .prepare('UPDATE account_data SET data=?,version=version+1 WHERE owner=? AND version=?')
          .run(JSON.stringify(data), id, version);
        if (!result.changes) {
          db.exec('ROLLBACK');
          return false;
        }
        db.prepare('UPDATE users SET name=? WHERE id=?').run(data.name, id);
        db.exec('COMMIT');
        return true;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    close() {
      db.close();
    },
  };
}
