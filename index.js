const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const messageHandler = require('./src/messageHandler');
const { agendarEventos, iniciarEvento } = require('./src/events'); // ✅ junto

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

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  const [cmd, ...rest] = line.trim().split(' ');

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
    const chats = await client.getChats();
    chats.filter(c => c.isGroup).forEach(c => {
      console.log(`${c.name} => ${c.id._serialized}`);
    });
  }
});

client.initialize();
