import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { START_BALANCE } from './db.js';
import { userFinance, availableCash } from './finance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'worldcup-rugen-secret-2026';
const INVITE_CODE = 'rugen';

app.use(cors());
app.use(express.json());

/* ----------------------------- helpers ----------------------------- */
function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, JWT_SECRET, {
    expiresIn: '60d',
  });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: '账号不存在' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: '登录已失效，请重新登录' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: '需要管理员权限' });
  next();
}

function publicUser(u) {
  const fin = userFinance(u);
  return {
    id: u.id,
    username: u.username,
    is_admin: !!u.is_admin,
    ...fin,
  };
}

function getBetWithLegs(id) {
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(id);
  if (!bet) return null;
  const legs = db
    .prepare('SELECT * FROM bet_legs WHERE bet_id = ? ORDER BY sort_order, id')
    .all(id)
    .map((l) => ({ ...l, plays: JSON.parse(l.plays || '[]') }));
  return { ...bet, legs };
}

const VALID_PLAYS = ['胜', '平', '负', '让胜', '让平', '让负', '其他'];

function validateLegs(legs) {
  if (!Array.isArray(legs) || legs.length === 0) return '至少需要添加一场比赛';
  for (const leg of legs) {
    if (!leg.home_team || !leg.away_team) return '每场比赛都要选择主队和客队';
    if (!Array.isArray(leg.plays) || leg.plays.length === 0) return '每场比赛至少选择一个玩法';
    if (leg.plays.some((p) => !VALID_PLAYS.includes(p))) return '玩法不合法';
    if (leg.plays.includes('其他') && !String(leg.other_text || '').trim())
      return '选择「其他」时请填写具体玩法';
  }
  return null;
}

function insertLegs(betId, legs) {
  const stmt = db.prepare(
    `INSERT INTO bet_legs (bet_id, home_team, away_team, match_date, plays, handicap, other_text, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  legs.forEach((leg, i) => {
    stmt.run(
      betId,
      leg.home_team,
      leg.away_team,
      leg.match_date || '',
      JSON.stringify(leg.plays || []),
      String(leg.handicap ?? ''),
      String(leg.other_text ?? ''),
      i
    );
  });
}

/* ------------------------------ auth ------------------------------- */
app.post('/api/register', (req, res) => {
  const { username, password, confirmPassword, inviteCode } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });
  if (password !== confirmPassword) return res.status(400).json({ error: '两次输入的密码不一致' });
  if (inviteCode !== INVITE_CODE) return res.status(400).json({ error: '邀请码不正确' });
  if (String(username).length > 20) return res.status(400).json({ error: '用户名太长了' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: '该用户名已被注册' });

  const info = db
    .prepare('INSERT INTO users (username, password_hash, start_balance) VALUES (?, ?, ?)')
    .run(username, bcrypt.hashSync(password, 10), START_BALANCE);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash))
    return res.status(400).json({ error: '用户名或密码错误' });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// reset own password (needs old password)
app.post('/api/me/password', auth, (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body || {};
  if (!bcrypt.compareSync(oldPassword || '', req.user.password_hash))
    return res.status(400).json({ error: '原密码不正确' });
  if (!newPassword || newPassword !== confirmPassword)
    return res.status(400).json({ error: '两次输入的新密码不一致' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(newPassword, 10),
    req.user.id
  );
  res.json({ ok: true });
});

/* --------------------------- leaderboard --------------------------- */
app.get('/api/leaderboard', auth, (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all();
  const board = users
    .map((u) => {
      const fin = userFinance(u);
      return { id: u.id, username: u.username, is_admin: !!u.is_admin, ...fin };
    })
    .sort((a, b) => b.score - a.score);
  res.json({ leaderboard: board });
});

/* ------------------------------ bets ------------------------------- */
// list bets — own by default; admin can pass ?all=1 or ?userId=
app.get('/api/bets', auth, (req, res) => {
  let rows;
  if (req.user.is_admin && (req.query.all === '1' || req.query.userId)) {
    if (req.query.userId)
      rows = db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(req.query.userId);
    else rows = db.prepare('SELECT * FROM bets ORDER BY created_at DESC, id DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(req.user.id);
  }
  const userNames = Object.fromEntries(db.prepare('SELECT id, username FROM users').all().map((u) => [u.id, u.username]));
  const bets = rows.map((b) => ({ ...getBetWithLegs(b.id), username: userNames[b.user_id] }));
  res.json({ bets });
});

app.post('/api/bets', auth, (req, res) => {
  const { stake, note, legs } = req.body || {};
  const amount = Number(stake);
  if (!amount || amount <= 0) return res.status(400).json({ error: '请输入正确的投注金额（本金）' });
  const legErr = validateLegs(legs);
  if (legErr) return res.status(400).json({ error: legErr });

  const cash = availableCash(req.user);
  if (amount > cash + 1e-9)
    return res.status(400).json({ error: `余额不足，当前可用余额 ${cash} 元` });

  const tx = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO bets (user_id, stake, note) VALUES (?, ?, ?)')
      .run(req.user.id, amount, String(note || ''));
    insertLegs(info.lastInsertRowid, legs);
    return info.lastInsertRowid;
  });
  const id = tx();
  res.json({ bet: getBetWithLegs(id) });
});

// edit a bet (owner or admin). Re-validates balance for the stake.
app.put('/api/bets/:id', auth, (req, res) => {
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(req.params.id);
  if (!bet) return res.status(404).json({ error: '投注不存在' });
  if (bet.user_id !== req.user.id && !req.user.is_admin)
    return res.status(403).json({ error: '无权修改' });

  const { stake, note, legs } = req.body || {};
  const amount = Number(stake);
  if (!amount || amount <= 0) return res.status(400).json({ error: '请输入正确的投注金额（本金）' });
  const legErr = validateLegs(legs);
  if (legErr) return res.status(400).json({ error: legErr });

  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(bet.user_id);
  const cash = availableCash(owner, bet.id);
  if (amount > cash + 1e-9)
    return res.status(400).json({ error: `余额不足，可用余额 ${cash} 元` });

  const tx = db.transaction(() => {
    db.prepare('UPDATE bets SET stake = ?, note = ? WHERE id = ?').run(amount, String(note || ''), bet.id);
    db.prepare('DELETE FROM bet_legs WHERE bet_id = ?').run(bet.id);
    insertLegs(bet.id, legs);
  });
  tx();
  res.json({ bet: getBetWithLegs(bet.id) });
});

app.delete('/api/bets/:id', auth, (req, res) => {
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(req.params.id);
  if (!bet) return res.status(404).json({ error: '投注不存在' });
  if (bet.user_id !== req.user.id && !req.user.is_admin)
    return res.status(403).json({ error: '无权删除' });
  db.prepare('DELETE FROM bets WHERE id = ?').run(bet.id);
  res.json({ ok: true });
});

// settle a bet (owner or admin): status pending|won|lost, payout for won
app.post('/api/bets/:id/settle', auth, (req, res) => {
  const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(req.params.id);
  if (!bet) return res.status(404).json({ error: '投注不存在' });
  if (bet.user_id !== req.user.id && !req.user.is_admin)
    return res.status(403).json({ error: '无权结算' });

  const { status } = req.body || {};
  if (!['pending', 'won', 'lost'].includes(status))
    return res.status(400).json({ error: '结算状态不合法' });
  let payout = 0;
  if (status === 'won') {
    payout = Number(req.body.payout);
    if (!(payout >= 0)) return res.status(400).json({ error: '请输入正确的中奖金额' });
  }
  db.prepare('UPDATE bets SET status = ?, payout = ?, settled_at = ? WHERE id = ?').run(
    status,
    payout,
    status === 'pending' ? null : new Date().toISOString(),
    bet.id
  );
  res.json({ bet: getBetWithLegs(bet.id) });
});

/* ------------------------------ admin ------------------------------ */
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all().map(publicUser);
  res.json({ users });
});

app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: '用户不存在' });
  const { username, password } = req.body || {};
  if (username && username !== target.username) {
    const dup = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (dup) return res.status(400).json({ error: '该用户名已被占用' });
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, target.id);
  }
  if (password) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), target.id);
  }
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(target.id);
  res.json({ user: publicUser(updated) });
});

app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (target.id === req.user.id) return res.status(400).json({ error: '不能删除自己' });
  if (target.is_admin) return res.status(400).json({ error: '不能删除管理员账号' });
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ ok: true });
});

/* ------------------------- serve frontend -------------------------- */
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`世界杯彩票排行榜服务已启动: http://localhost:${PORT}`);
});
