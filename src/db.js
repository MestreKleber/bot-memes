const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/bot.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS group_players (
    player_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    alias TEXT,
    balance INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, group_id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_alias_group
    ON group_players(group_id, alias);
`);

function getPlayer(playerId, groupId, name) {
  let player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) {
    db.prepare('INSERT INTO players (id, name) VALUES (?, ?)').run(playerId, name);
  }

  let gp = db.prepare(
    'SELECT * FROM group_players WHERE player_id = ? AND group_id = ?'
  ).get(playerId, groupId);

  if (!gp) {
    db.prepare(
      'INSERT INTO group_players (player_id, group_id) VALUES (?, ?)'
    ).run(playerId, groupId);
    gp = db.prepare(
      'SELECT * FROM group_players WHERE player_id = ? AND group_id = ?'
    ).get(playerId, groupId);
  }

  return { ...player, ...gp };
}

function getPlayerByAlias(groupId, alias) {
  return db.prepare(`
    SELECT p.*, gp.*
    FROM group_players gp
    JOIN players p ON p.id = gp.player_id
    WHERE gp.group_id = ? AND LOWER(gp.alias) = LOWER(?)
  `).get(groupId, alias);
}

function updateBalance(playerId, groupId, amount) {
  db.prepare(
    'UPDATE group_players SET balance = balance + ? WHERE player_id = ? AND group_id = ?'
  ).run(amount, playerId, groupId);
}

function setAlias(playerId, groupId, alias) {
  const existing = db.prepare(
    'SELECT * FROM group_players WHERE group_id = ? AND LOWER(alias) = LOWER(?)'
  ).get(groupId, alias);

  if (existing && existing.player_id !== playerId) return { error: 'alias_taken' };

  db.prepare(
    'UPDATE group_players SET alias = ? WHERE player_id = ? AND group_id = ?'
  ).run(alias, playerId, groupId);

  return { ok: true };
}

function listGroupPlayers(groupId) {
  return db.prepare(`
    SELECT p.id, p.name, gp.alias, gp.balance
    FROM group_players gp
    JOIN players p ON p.id = gp.player_id
    WHERE gp.group_id = ?
    ORDER BY gp.balance DESC
  `).all(groupId);
}

module.exports = { getPlayer, getPlayerByAlias, updateBalance, setAlias, listGroupPlayers };
