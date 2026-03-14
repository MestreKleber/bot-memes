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

  try {
    await command(msg, args);
  } catch (err) {
    console.error(`[${commandName}]`, err);
    await msg.reply('Ocorreu um erro ao executar o comando.');
  }
};
