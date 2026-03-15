const config = require('./config');
const commands = require('./commands');
const { verificarResposta } = require('./events');
const { getPlayer, updateBalance } = require('./db');

module.exports = async (client, msg) => {
  if (!msg.from.endsWith('@g.us')) return;

  // checa evento ativo antes dos comandos
  if (!msg.body.startsWith(config.prefix)) {
    const prize = verificarResposta(msg.from, msg.body);
    if (prize !== null) {
      const contact = await msg.getContact();
      const player = getPlayer(msg.author, msg.from, contact.pushname || '');
      updateBalance(msg.author, msg.from, prize);
      const name = player.alias || msg.author.replace('@c.us', '');
      await msg.reply(`✅ *${name}* acertou e ganhou R$${prize}!`);
    }
    return;
  }

  const args = msg.body.slice(config.prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands[commandName];
  if (!command) return;

  const contact = await msg.getContact();
  const player = getPlayer(msg.author, msg.from, contact.pushname || '');
  const classe = player.classe || 'trabalhador';
  const now = Math.floor(Date.now() / 1000);

  const mortoAte = Number(player.morto_ate ?? 0);
  if (mortoAte > now) {
    const minutos = Math.max(1, Math.ceil((mortoAte - now) / 60));
    return msg.reply(`Você está morto. Aguarde ${minutos} minutos.`);
  }

  const presoAte = Number(player.preso_ate ?? 0);
  if (presoAte > now && commandName !== 'pagar_multa') {
    const minutos = Math.max(1, Math.ceil((presoAte - now) / 60));
    return msg.reply(
      `Você está preso. Pague R$200 com !pagar_multa ou aguarde ${minutos} minutos.`
    );
  }

  const restricoes = {
    trabalhador: new Set(['roubar', 'matar']),
    ladrao: new Set(['trabalhar']),
    assassino: new Set(['trabalhar', 'roubar']),
  };

  if (restricoes[classe] && restricoes[classe].has(commandName)) {
    return msg.reply(`A classe *${classe}* não pode usar !${commandName}.`);
  }

  try {
    await command(msg, args);
  } catch (err) {
    console.error(`[${commandName}]`, err);
    await msg.reply('Ocorreu um erro ao executar o comando.');
  }
};
