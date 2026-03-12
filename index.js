const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./src/messageHandler');

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
client.on('ready', () => console.log('Client ready'));
client.on('auth_failure', (msg) => console.error('Auth failure:', msg));
client.on('disconnected', (reason) => console.warn('Disconnected:', reason));
client.on('message', (msg) => messageHandler(client, msg));

client.initialize();
