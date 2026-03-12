const { getPlayer, getPlayerByAlias, updateBalance, setAlias, listGroupPlayers } = require('./db');
const { isOnCooldown, setCooldown, getRemainingTime } = require('./cooldown');
const config = require('./config');

function displayName(player) {
  return player.alias || player.id.replace('@c.us', '');
}

const commands = {
  async registrar(msg, args) {
    const alias = args[0];
    if (!alias) return msg.reply('Uso: !registrar <nome>');
    if (alias.length > 20) return msg.reply('Nome muito longo, máximo 20 caracteres.');

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');

    if (player.alias) return msg.reply(`Você já tem o nome *${player.alias}*. Use !trocar para mudar.`);

    const result = setAlias(msg.author, msg.from, alias);
    if (result.error === 'alias_taken') return msg.reply(`O nome *${alias}* já está em uso neste grupo.`);

    return msg.reply(`Pronto! Agora você é *${alias}*.`);
  },

  async trocar(msg, args) {
    const alias = args[0];
    if (!alias) return msg.reply('Uso: !trocar <novo nome>');
    if (alias.length > 20) return msg.reply('Nome muito longo, máximo 20 caracteres.');

    const contact = await msg.getContact();
    getPlayer(msg.author, msg.from, contact.pushname || '');

    const result = setAlias(msg.author, msg.from, alias);
    if (result.error === 'alias_taken') return msg.reply(`O nome *${alias}* já está em uso neste grupo.`);

    return msg.reply(`Nome alterado para *${alias}*.`);
  },

  async trabalhar(msg) {
    const cd = config.cooldowns.trabalhar;
    if (isOnCooldown(msg.author, 'trabalhar', cd))
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'trabalhar', cd)}s para trabalhar de novo.`);

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const earned = Math.floor(Math.random() * 151) + 50;

    updateBalance(msg.author, msg.from, earned);
    setCooldown(msg.author, 'trabalhar');

    return msg.reply(`*${displayName(player)}* trabalhou e ganhou R$${earned}.`);
  },

  async saldo(msg) {
    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    return msg.reply(`Saldo de *${displayName(player)}*: R$${player.balance}`);
  },

  async lutar(msg, args) {
    const cd = config.cooldowns.lutar;
    if (isOnCooldown(msg.author, 'lutar', cd))
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'lutar', cd)}s para lutar de novo.`);

    const targetAlias = args[0];
    if (!targetAlias) return msg.reply('Uso: !lutar <nome>');

    const contact = await msg.getContact();
    const attacker = getPlayer(msg.author, msg.from, contact.pushname || '');
    const defender = getPlayerByAlias(msg.from, targetAlias);

    if (!defender) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
    if (defender.player_id === msg.author) return msg.reply('Você não pode lutar contra si mesmo.');

    const attackerWins = Math.random() < 0.5;
    const prize = Math.floor(Math.random() * 101) + 50;

    if (attackerWins) {
      updateBalance(msg.author, msg.from, prize);
      updateBalance(defender.player_id, msg.from, -prize);
      setCooldown(msg.author, 'lutar');
      return msg.reply(`*${displayName(attacker)}* venceu *${displayName(defender)}* e ganhou R$${prize}!`);
    } else {
      updateBalance(msg.author, msg.from, -prize);
      updateBalance(defender.player_id, msg.from, prize);
      setCooldown(msg.author, 'lutar');
      return msg.reply(`*${displayName(attacker)}* perdeu para *${displayName(defender)}* e pagou R$${prize}.`);
    }
  },

  async roubar(msg, args) {
    const cd = config.cooldowns.roubar;
    if (isOnCooldown(msg.author, 'roubar', cd))
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'roubar', cd)}s para roubar de novo.`);

    const targetAlias = args[0];
    if (!targetAlias) return msg.reply('Uso: !roubar <nome>');

    const contact = await msg.getContact();
    const thief = getPlayer(msg.author, msg.from, contact.pushname || '');
    const target = getPlayerByAlias(msg.from, targetAlias);

    if (!target) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
    if (target.player_id === msg.author) return msg.reply('Você não pode roubar a si mesmo.');
    if (target.balance <= 0) return msg.reply(`*${displayName(target)}* não tem dinheiro para roubar.`);

    const success = Math.random() < 0.4;
    const amount = Math.floor(Math.random() * 101) + 20;

    if (success) {
      const stolen = Math.min(amount, target.balance);
      updateBalance(msg.author, msg.from, stolen);
      updateBalance(target.player_id, msg.from, -stolen);
      setCooldown(msg.author, 'roubar');
      return msg.reply(`*${displayName(thief)}* roubou R$${stolen} de *${displayName(target)}*!`);
    } else {
      const fine = Math.floor(amount / 2);
      updateBalance(msg.author, msg.from, -fine);
      setCooldown(msg.author, 'roubar');
      return msg.reply(`*${displayName(thief)}* tentou roubar *${displayName(target)}* e foi pego! Multa de R$${fine}.`);
    }
  },

  async usuarios(msg) {
    const players = listGroupPlayers(msg.from);
    if (!players.length) return msg.reply('Nenhum jogador registrado neste grupo ainda.');

    const lines = players.map((p, i) => {
      const name = p.alias || p.id.replace('@c.us', '');
      return `${i + 1}. *${name}* — R$${p.balance}`;
    });

    return msg.reply(`*Jogadores do grupo:*\n${lines.join('\n')}`);
  },

  async ajuda(msg) {
    const p = config.prefix;
    return msg.reply(
      `*Comandos disponíveis:*\n` +
      `${p}registrar <nome> - Registra seu nome\n` +
      `${p}trocar <nome> - Muda seu nome\n` +
      `${p}trabalhar - Ganhe dinheiro (cooldown: 1h)\n` +
      `${p}lutar <nome> - Lute contra alguém\n` +
      `${p}roubar <nome> - Tente roubar alguém\n` +
      `${p}saldo - Veja seu saldo\n` +
      `${p}usuarios - Lista jogadores do grupo\n` +
      `${p}ajuda - Esta mensagem`
    );
  },
};

commands.comandos = commands.ajuda;

module.exports = commands;
