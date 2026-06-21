import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const START_BALANCE = 50;

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  start_balance REAL NOT NULL DEFAULT 50,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bets (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stake             REAL NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',   -- pending | won | lost
  payout            REAL NOT NULL DEFAULT 0,
  note              TEXT NOT NULL DEFAULT '',
  simple            INTEGER NOT NULL DEFAULT 0,        -- 1 = 简易投注（只记日期+金额）
  bet_date          TEXT NOT NULL DEFAULT '',          -- 简易投注的比赛日
  agent_buy         INTEGER NOT NULL DEFAULT 0,        -- 1 = 高哥代买（买入提成 1 元）
  settle_commission REAL NOT NULL DEFAULT 0,           -- 结算时高哥提成金额
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  settled_at        TEXT
);

CREATE TABLE IF NOT EXISTS bet_legs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  bet_id     INTEGER NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  home_team  TEXT NOT NULL,
  away_team  TEXT NOT NULL,
  match_date TEXT NOT NULL DEFAULT '',
  plays      TEXT NOT NULL DEFAULT '[]',        -- JSON array of selected play types
  handicap   TEXT NOT NULL DEFAULT '',          -- 让球个数 (主队)
  other_text TEXT NOT NULL DEFAULT '',          -- 其他玩法自由文本
  sort_order INTEGER NOT NULL DEFAULT 0
);
`);

// --- 迁移：给已存在的数据库补上新列（保留线上玩家数据，不会清空） ---
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    console.log(`迁移：已为 ${table} 添加列 ${column}`);
  }
}
ensureColumn('bets', 'simple', 'simple INTEGER NOT NULL DEFAULT 0');
ensureColumn('bets', 'bet_date', "bet_date TEXT NOT NULL DEFAULT ''");
ensureColumn('bets', 'agent_buy', 'agent_buy INTEGER NOT NULL DEFAULT 0');
ensureColumn('bets', 'settle_commission', 'settle_commission REAL NOT NULL DEFAULT 0');

// Seed admin account
const adminUser = '老朴';
const adminPass = 'songhaofeng';
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUser);
if (!existing) {
  db.prepare(
    'INSERT INTO users (username, password_hash, is_admin, start_balance) VALUES (?, ?, 1, ?)'
  ).run(adminUser, bcrypt.hashSync(adminPass, 10), START_BALANCE);
  console.log(`已创建管理员账号: ${adminUser}`);
}

export default db;
