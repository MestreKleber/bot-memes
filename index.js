const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const messageHandler = require('./src/messageHandler');
const { agendarEventos, iniciarEvento } = require('./src/events');

const CMD_FILE = '/tmp/bot-cmd';
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './data' }),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    headless: true,
  },
});

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', async () => {
  console.log('Client ready');
  const chats = await client.getChats();
  const groupIds = chats.filter(c => c.isGroup).map(c => c.id._serialized);
  agendarEventos(client, groupIds);
});
client.on('auth_failure', (msg) => console.error('Auth failure:', msg));
client.on('disconnected', (reason) => console.warn('Disconnected:', reason));
client.on('message', (msg) => messageHandler(client, msg));

// garante que o arquivo existe
if (!fs.existsSync(CMD_FILE)) fs.writeFileSync(CMD_FILE, '');

fs.watchFile(CMD_FILE, { interval: 500 }, () => {
  try {
    const line = fs.readFileSync(CMD_FILE, 'utf8').trim();
    if (!line) return;
    fs.writeFileSync(CMD_FILE, '');

    const [cmd, ...rest] = line.split(' ');

    if (cmd === 'evento') {
      const groupId = rest[0];
      if (!groupId) {
        console.log('Uso: evento <groupId>');
        return;
      }
      iniciarEvento(client, groupId);
      console.log(`Evento disparado em ${groupId}`);
    }

    if (cmd === 'grupos') {
      client.getChats().then(chats => {
        chats.filter(c => c.isGroup).forEach(c => {
          console.log(`${c.name} => ${c.id._serialized}`);
        });
      });
    }
  } catch (e) {
    console.error('[watchdog]', e.message);
  }
});

client.initialize();
