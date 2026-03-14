const activeEvents = new Map();

const palavras = [
  'cachorro', 'janela', 'telefone', 'cozinha', 'borracha',
  'chapéu', 'gaveta', 'foguete', 'tartaruga', 'geladeira',
  'borboleta', 'chocolate', 'biblioteca', 'computador', 'travesseiro',
  'microfone', 'calendário', 'bicicleta', 'ventilador', 'passarinho',
];

function embaralhar(palavra) {
  const letras = palavra.split('');
  for (let i = letras.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letras[i], letras[j]] = [letras[j], letras[i]];
  }
  const resultado = letras.join('');
  return resultado === palavra ? embaralhar(palavra) : resultado;
}

function gerarAnagrama() {
  const palavra = palavras[Math.floor(Math.random() * palavras.length)];
  return {
    tipo: 'anagrama',
    pergunta: `🔤 *Desembaralhe a palavra:* \`${embaralhar(palavra).toUpperCase()}\``,
    resposta: palavra.toLowerCase(),
    prize: Math.floor(Math.random() * 201) + 100,
  };
}

function gerarMatematica() {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, resposta, simbolo;

  if (op === '+') {
    a = Math.floor(Math.random() * 200) + 10;
    b = Math.floor(Math.random() * 200) + 10;
    resposta = a + b;
    simbolo = '+';
  } else if (op === '-') {
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * (a - 10)) + 1;
    resposta = a - b;
    simbolo = '-';
  } else {
    a = Math.floor(Math.random() * 20) + 2;
    b = Math.floor(Math.random() * 20) + 2;
    resposta = a * b;
    simbolo = '×';
  }

  return {
    tipo: 'matematica',
    pergunta: `🧮 *Quanto é ${a} ${simbolo} ${b}?*`,
    resposta: String(resposta),
    prize: Math.floor(Math.random() * 151) + 150,
  };
}

function gerarDigitacao() {
  const frases = [
    'o rato roeu a roupa do rei de roma',
    'um tigre dois tigres três tigres',
    'o tempo perguntou ao tempo quanto tempo o tempo tem',
    'quem tem medo de quê',
    'sabendo bem saber bem se sabe',
  ];
  const frase = frases[Math.floor(Math.random() * frases.length)];
  return {
    tipo: 'digitacao',
    pergunta: `⌨️ *Digite exatamente:*\n"${frase}"`,
    resposta: frase.toLowerCase(),
    prize: Math.floor(Math.random() * 101) + 200,
  };
}

function gerarEvento() {
  const tipos = [gerarAnagrama, gerarMatematica, gerarDigitacao];
  return tipos[Math.floor(Math.random() * tipos.length)]();
}

function iniciarEvento(client, groupId) {
  if (activeEvents.has(groupId)) return;

  const evento = gerarEvento();
  const mensagem = `${evento.pergunta}\n\n_Prêmio: R$${evento.prize} — Você tem 2 minutos!_`;

  client.sendMessage(groupId, mensagem);

  const timeout = setTimeout(() => {
    if (activeEvents.has(groupId)) {
      activeEvents.delete(groupId);
      client.sendMessage(groupId, '⏰ Tempo esgotado! Ninguém acertou.');
    }
  }, 2 * 60 * 1000);

  activeEvents.set(groupId, { ...evento, timeout });
}

function verificarResposta(groupId, texto) {
  const evento = activeEvents.get(groupId);
  if (!evento) return null;
  if (texto.trim().toLowerCase() === evento.resposta) {
    clearTimeout(evento.timeout);
    activeEvents.delete(groupId);
    return evento.prize;
  }
  return null;
}

function agendarEventos(client, groupIds) {
  groupIds.forEach((groupId) => {
    function agendar() {
      const delay = Math.floor(Math.random() * (120 - 30 + 1) + 30) * 60 * 1000;
      setTimeout(() => {
        iniciarEvento(client, groupId);
        agendar();
      }, delay);
    }
    agendar();
  });
}

module.exports = { iniciarEvento, verificarResposta, agendarEventos };
