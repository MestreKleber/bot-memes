const { getPlayer, getPlayerByAlias, updateBalance, setAlias, listGroupPlayers, addFrase, getRandomFrase, listFrases } = require('./db');
const { isOnCooldown, setCooldown, getRemainingTime } = require('./cooldown');
const config = require('./config');

function displayName(player) {
  return player.alias || (player.id || player.player_id).replace('@c.us', '');
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

    if (Math.random() < 0.1) {
      const frase = getRandomFrase(msg.from);
      if (frase) {
        const delay = Math.floor(Math.random() * (30 - 3 + 1) + 3) * 60 * 1000;
        setTimeout(async () => {
          try {
            const chat = await msg.getChat();
            await chat.sendMessage(`_"${frase.texto}"_\n— *${frase.alias}*`);
          } catch (err) {
            console.error('[frase_agendada]', err);
          }
        }, delay);
      }
    }

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

    async frase(msg, args) {
    if (!args.length) return msg.reply('Uso: !frase <texto>');
    const texto = args.join(' ');
    if (texto.length > 300) return msg.reply('Frase muito longa, máximo 300 caracteres.');

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    addFrase(msg.from, msg.author, player.alias, texto);

    return msg.reply(`Frase adicionada ao livro do grupo!`);
  },

  async frases(msg) {
    const lista = listFrases(msg.from);
    if (!lista.length) return msg.reply('Nenhuma frase registrada neste grupo ainda.');

    const lines = lista.map(f => `"${f.texto}" — *${f.alias}*`);
    return msg.reply(`*Frases do grupo:*\n\n${lines.join('\n\n')}`);
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
      `*Comandos disponíveis:*\n\n` +
      `*Perfil*\n` +
      `${p}registrar <nome> - Registra seu nome\n` +
      `${p}trocar <nome> - Muda seu nome\n\n` +
      `*Economia*\n` +
      `${p}trabalhar - Ganhe dinheiro (cooldown: 10min)\n` +
      `${p}lutar <nome> - Lute contra alguém (cooldown: 1min)\n` +
      `${p}roubar <nome> - Tente roubar alguém (cooldown: 2min)\n` +
      `${p}pix <nome> <valor> - Transfere dinheiro para alguém\n` +
      `${p}saldo - Veja seu saldo\n\n` +
      `*Grupo*\n` +
      `${p}usuarios - Lista jogadores e saldos do grupo\n` +
      `${p}frase <texto> - Adiciona uma frase ao livro do grupo\n` +
      `${p}frases - Veja todas as frases do grupo\n\n` +
      `${p}ajuda - Esta mensagem`
    );
  },

  async pix(msg, args) {
    if (args.length < 2) return msg.reply('Uso: !pix <nome> <valor>');

    const targetAlias = args[0];
    const valor = parseInt(args[1]);

    if (isNaN(valor) || valor <= 0) return msg.reply('Valor inválido.');

    const contact = await msg.getContact();
    const sender = getPlayer(msg.author, msg.from, contact.pushname || '');
    const target = getPlayerByAlias(msg.from, targetAlias);

    if (!target) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
    if (target.player_id === msg.author) return msg.reply('Você não pode transferir para si mesmo.');
    if (sender.balance < valor) return msg.reply(`Você não tem saldo suficiente. Saldo atual: R$${sender.balance}`);

    updateBalance(msg.author, msg.from, -valor);
    updateBalance(target.player_id, msg.from, valor);

    return msg.reply(`*${displayName(sender)}* transferiu R$${valor} para *${displayName(target)}*.`);
  },
};

commands.usuários = commands.usuarios;
commands.ranking = commands.usuarios;
commands.transferir = commands.pix;
commands.doar = commands.pix;
commands.comandos = commands.ajuda;
commands.help = commands.ajuda;


module.exports = commands;
