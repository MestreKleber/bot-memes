const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/bot.db'));

db.exec(`
  -- tabelas existentes...

  CREATE TABLE IF NOT EXISTS frases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    alias TEXT,
    texto TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function addFrase(groupId, playerId, alias, texto) {
  db.prepare(
    'INSERT INTO frases (group_id, player_id, alias, texto) VALUES (?, ?, ?, ?)'
  ).run(groupId, playerId, alias || playerId.replace('@c.us', ''), texto);
}

function getRandomFrase(groupId) {
  return db.prepare(
    'SELECT * FROM frases WHERE group_id = ? ORDER BY RANDOM() LIMIT 1'
  ).get(groupId);
}

function listFrases(groupId) {
  return db.prepare(
    'SELECT * FROM frases WHERE group_id = ? ORDER BY created_at DESC'
  ).all(groupId);
}


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
module.exports = { getPlayer, getPlayerByAlias, updateBalance, setAlias, listGroupPlayers, addFrase, getRandomFrase, listFrases };
