require('dotenv').config();

module.exports = {
  prefix: '!',
  cooldowns: {
    trabalhar: 600,  // 10 minutos
    passear: 60,     // 1 minuto
    lutar: 60,       // 1 minuto
    roubar: 120,     // 2 minutos
    estudar: 300,    // 5 minutos
    trocarCargo: 3600,   // 1 hora
    rumorEnviou: 1800,   // 30 minutos
    rumorRecebeu: 3600,  // 1 hora
    contrato: 3600,      // 1 hora
    trocarNome: 604800,  // 7 dias
  },
};
