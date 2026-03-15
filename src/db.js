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

function ensureGroupPlayersColumns() {
  const tableInfo = db.prepare('PRAGMA table_info(group_players)').all();
  if (!tableInfo.length) return;

  const existing = new Set(tableInfo.map((c) => c.name));
  const columnsToAdd = [
    { name: 'cargo', typeAndDefault: "TEXT DEFAULT 'empacotador'" },
    { name: 'trabalhos', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'classe', typeAndDefault: "TEXT DEFAULT 'trabalhador'" },
    { name: 'reputacao', typeAndDefault: 'INTEGER DEFAULT 50' },
    { name: 'cooldown_rumor_enviou', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'cooldown_rumor_recebeu', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'cooldown_classe', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'vitorias_luta', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'morto_ate', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'preso_ate', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'ladrão_desbloqueado', typeAndDefault: 'INTEGER DEFAULT 0' },
    { name: 'assassino_desbloqueado', typeAndDefault: 'INTEGER DEFAULT 0' },
  ];

  for (const column of columnsToAdd) {
    if (!existing.has(column.name)) {
      db.exec(`ALTER TABLE group_players ADD COLUMN "${column.name}" ${column.typeAndDefault}`);
    }
  }
}

ensureGroupPlayersColumns();

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

function incrementarTrabalhos(playerId, groupId) {
  db.prepare(`
    UPDATE group_players
    SET trabalhos = COALESCE(trabalhos, 0) + 1
    WHERE player_id = ? AND group_id = ?
  `).run(playerId, groupId);

  const row = db.prepare(
    'SELECT trabalhos FROM group_players WHERE player_id = ? AND group_id = ?'
  ).get(playerId, groupId);

  return row ? row.trabalhos : 0;
}

function setCargo(playerId, groupId, cargo) {
  db.prepare(
    'UPDATE group_players SET cargo = ? WHERE player_id = ? AND group_id = ?'
  ).run(cargo, playerId, groupId);
}

function resetTrabalhosECargo(playerId, groupId) {
  db.prepare(
    "UPDATE group_players SET trabalhos = 0, cargo = 'empacotador' WHERE player_id = ? AND group_id = ?"
  ).run(playerId, groupId);
}

function setClasse(playerId, groupId, classe) {
  db.prepare(
    'UPDATE group_players SET classe = ? WHERE player_id = ? AND group_id = ?'
  ).run(classe, playerId, groupId);
}

function setCooldownClasse(playerId, groupId, timestamp) {
  db.prepare(
    'UPDATE group_players SET cooldown_classe = ? WHERE player_id = ? AND group_id = ?'
  ).run(timestamp, playerId, groupId);
}

function incrementarVitoriasLuta(playerId, groupId) {
  db.prepare(`
    UPDATE group_players
    SET vitorias_luta = COALESCE(vitorias_luta, 0) + 1
    WHERE player_id = ? AND group_id = ?
  `).run(playerId, groupId);

  const row = db.prepare(
    'SELECT vitorias_luta FROM group_players WHERE player_id = ? AND group_id = ?'
  ).get(playerId, groupId);

  return row ? row.vitorias_luta : 0;
}

function setLadraoDesbloqueado(playerId, groupId, valor) {
  db.prepare(
    'UPDATE group_players SET "ladrão_desbloqueado" = ? WHERE player_id = ? AND group_id = ?'
  ).run(valor, playerId, groupId);
}

function setAssassinoDesbloqueado(playerId, groupId, valor) {
  db.prepare(
    'UPDATE group_players SET assassino_desbloqueado = ? WHERE player_id = ? AND group_id = ?'
  ).run(valor, playerId, groupId);
}

function setCooldownRumorEnviou(playerId, groupId, timestamp) {
  db.prepare(
    'UPDATE group_players SET cooldown_rumor_enviou = ? WHERE player_id = ? AND group_id = ?'
  ).run(timestamp, playerId, groupId);
}

function setCooldownRumorRecebeu(playerId, groupId, timestamp) {
  db.prepare(
    'UPDATE group_players SET cooldown_rumor_recebeu = ? WHERE player_id = ? AND group_id = ?'
  ).run(timestamp, playerId, groupId);
}

function setMortoAte(playerId, groupId, timestamp) {
  db.prepare(
    'UPDATE group_players SET morto_ate = ? WHERE player_id = ? AND group_id = ?'
  ).run(timestamp, playerId, groupId);
}

function setPresoAte(playerId, groupId, timestamp) {
  db.prepare(
    'UPDATE group_players SET preso_ate = ? WHERE player_id = ? AND group_id = ?'
  ).run(timestamp, playerId, groupId);
}

function alterarReputacao(playerId, groupId, valor) {
  db.prepare(`
    UPDATE group_players
    SET reputacao = MIN(100, MAX(0, COALESCE(reputacao, 50) + ?))
    WHERE player_id = ? AND group_id = ?
  `).run(valor, playerId, groupId);

  const row = db.prepare(
    'SELECT reputacao FROM group_players WHERE player_id = ? AND group_id = ?'
  ).get(playerId, groupId);

  return row ? row.reputacao : 50;
}

function getFaixaReputacao(reputacao) {
  if (reputacao <= 20) return 'Suspeito';
  if (reputacao <= 40) return 'Mal visto';
  if (reputacao <= 60) return 'Cidadão';
  if (reputacao <= 80) return 'Respeitado';
  return 'Lendário';
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
module.exports = {
  getPlayer,
  getPlayerByAlias,
  updateBalance,
  incrementarTrabalhos,
  setCargo,
  resetTrabalhosECargo,
  setClasse,
  setCooldownClasse,
  incrementarVitoriasLuta,
  setLadraoDesbloqueado,
  setAssassinoDesbloqueado,
  setCooldownRumorEnviou,
  setCooldownRumorRecebeu,
  setMortoAte,
  setPresoAte,
  alterarReputacao,
  getFaixaReputacao,
  setAlias,
  listGroupPlayers,
  addFrase,
  getRandomFrase,
  listFrases,
};
