const config = require('./config');
const commands = require('./commands');

module.exports = async (client, msg) => {
  if (!msg.from.endsWith('@g.us')) return;
  if (!msg.body.startsWith(config.prefix)) return;

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
