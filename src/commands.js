const {
  getPlayer,
  getPlayerByAlias,
  updateBalance,
  incrementarTrabalhos,
  setCargo,
  resetTrabalhosECargo,
  setClasse,
  setCooldownClasse,
  incrementarVitoriasLuta,
  setLadraoDesbloqueado,
  setAssassinoDesbloqueado,
  setCooldownRumorEnviou,
  setCooldownRumorRecebeu,
  setMortoAte,
  setPresoAte,
  alterarReputacao,
  getFaixaReputacao,
  setAlias,
  listGroupPlayers,
  addFrase,
  getRandomFrase,
  listFrases,
} = require('./db');
const { isOnCooldown, setCooldown, getRemainingTime } = require('./cooldown');
const config = require('./config');

function displayName(player) {
  return player.alias || (player.id || player.player_id).replace('@c.us', '');
}

const ASSAI_CARGOS = [
  { nome: 'empacotador', trabalhosMin: 0, reputacaoMin: 0, bonus: 0, flavor: 'Você embalou compras de estranhos por horas. Seus dedos doem.' },
  { nome: 'repositor', trabalhosMin: 3, reputacaoMin: 45, bonus: 0.2, flavor: 'Você empilhou caixa de óleo até a coluna reclamar.' },
  { nome: 'caixa', trabalhosMin: 6, reputacaoMin: 50, bonus: 0.4, flavor: 'Você digitou código de banana 38 vezes seguidas.' },
  { nome: 'açougueiro', trabalhosMin: 12, reputacaoMin: 55, bonus: 0.65, flavor: 'Você desossou meia vaca com maestria duvidosa.' },
  { nome: 'supervisor', trabalhosMin: 15, reputacaoMin: 65, bonus: 0.9, flavor: 'Você ficou de braço cruzado supervisionando os outros.' },
  { nome: 'empilhadeira', trabalhosMin: 20, reputacaoMin: 75, bonus: 1.2, flavor: 'Você quase derrubou uma prateleira inteira mas ninguém viu.' },
  { nome: 'gerente', trabalhosMin: 25, reputacaoMin: 85, bonus: 1.6, flavor: 'Você assinou três planilhas sem ler e tomou café o resto do dia.' },
];

function getCargoInfo(cargo) {
  return ASSAI_CARGOS.find((c) => c.nome === cargo) || ASSAI_CARGOS[0];
}

const RUMORES = [
  'Dizem que [pessoa] deve dinheiro pra metade do bairro e some quando cobram',
  'Contam que [pessoa] foi visto saindo pela janela de casa às 3 da manhã',
  'Todo mundo sabe que [pessoa] perdeu o emprego mas ainda faz questão de aparecer',
  'Falaram que [pessoa] pegou dinheiro emprestado e nunca mais atendeu o telefone',
  'Dizem que [pessoa] apanhou numa briga e ainda saiu pedindo desculpa',
  'Vizinhos contam que [pessoa] passa o dia em casa mas diz que tá trabalhando',
  'Comentaram que [pessoa] pediu dinheiro emprestado pro próprio pai e não pagou',
  'Dizem que [pessoa] se meteu numa fria e tá esperando o problema sumir sozinho',
];

const PASSEAR_MSG_NADA = [
  'Você andou, viu uns pombos, voltou pra casa.',
];

const PASSEAR_MSG_ENCONTRO_CUMPRIMENTO = [
  '[X] e [Y] se encontraram na rua. Acenaram com a cabeça sem parar nem falar nada.',
  '[X] viu [Y] de longe e gritou o nome. [Y] acenou. Os dois continuaram andando.',
  "[X] e [Y] se esbarraram, disseram 'oi' ao mesmo tempo e ficaram em silêncio por 3 segundos constrangedores.",
  "[X] perguntou pra [Y] como tava. [Y] disse 'tudo bem e você'. [X] disse 'tudo bem'. Ninguém perguntou nada mais.",
  '[X] e [Y] se encontraram e ficaram 5 minutos falando de clima.',
];

const PASSEAR_MSG_ENCONTRO_EVITAR = [
  '[X] viu [Y] na calçada e de repente ficou muito interessado no próprio celular.',
  '[Y] passou do lado de [X] olhando pro chão. [X] também olhou pro chão. Os dois fingiram muito bem.',
  '[X] entrou numa loja que não queria entrar só pra evitar [Y].',
  '[Y] atravessou a rua quando viu [X] vindo. [X] fingiu não perceber.',
];

const PASSEAR_MSG_ENCONTRO_BRIGA = [
  '[X] e [Y] se encontraram e em 30 segundos já estavam discutindo. Em 1 minuto, porrada.',
  '[X] olhou torto pra [Y]. [Y] não gostou. A rua inteira parou pra assistir.',
  '[X] e [Y] brigaram por um motivo que nenhum dos dois lembra direito. Vizinhos aplaudiram.',
];

const PASSEAR_MSG_LADRAO_RECONHECIDO = [
  'Um suspeito se aproximou, olhou nos seus olhos e foi embora sem falar nada.',
  'Alguém tentou mexer no seu bolso, percebeu quem você era e desistiu na hora.',
];

const PASSEAR_MSG_LENDARIO = [
  'Uma velhinha te parou na rua, não sabia quem você era mas achou sua cara honesta e te deu R$[valor].',
  'Um moleque pediu seu autógrafo. Você assinou. Ganhou R$[valor] de vergonha alheia.',
  'Nossa, você é famoso aqui no bairro! O padeiro te deu um pão de queijo e R$[valor] de troco.',
];

const PASSEAR_MSG_SUSPEITO = [
  'Você saiu na rua e as pessoas atravessaram a calçada pra te evitar.',
  'Uma criança apontou pra você e perguntou pra mãe quem era. A mãe disse pra não olhar.',
];

const LUTA_FLAVOR_VITORIA = [
  '⚔️ [vencedor] partiu pra cima de [perdedor] sem hesitar e saiu ileso.',
  '⚔️ [vencedor] encostou uma vez só em [perdedor]. Foi suficiente.',
  '⚔️ [perdedor] subestimou [vencedor]. Erro clássico.',
  '⚔️ [vencedor] não disse nada. Só olhou. [perdedor] já sabia o resultado.',
  '⚔️ [perdedor] tentou correr. [vencedor] era mais rápido.',
  '⚔️ [vencedor] saiu andando normal. [perdedor] ficou no chão pensando na vida.',
];

const LUTA_FLAVOR_DERROTA = [
  '💀 [perdedor] achou que ia ganhar. Não foi o caso.',
  '💀 [perdedor] acordou no chão sem saber bem o que aconteceu.',
  '💀 [vencedor] nem suou. [perdedor] sim.',
  '💀 [perdedor] vai fingir que isso nunca aconteceu.',
  '💀 Testemunhas disseram que [perdedor] tentou. Com toda a certeza tentou.',
  '💀 [perdedor] vai precisar de um tempo pra se recuperar disso.',
];

const ASSASSINO_MULTA = 200;
const CONTRATO_DURACAO_MS = 2 * 60 * 60 * 1000;
const activeContracts = new Map();

function contratoKey(groupId, assassinoId) {
  return `${groupId}:${assassinoId}`;
}

function clearContrato(groupId, assassinoId) {
  const key = contratoKey(groupId, assassinoId);
  const existing = activeContracts.get(key);
  if (existing && existing.timeout) {
    clearTimeout(existing.timeout);
  }
  activeContracts.delete(key);
}

function setContrato(groupId, assassinoId, contrato) {
  clearContrato(groupId, assassinoId);
  const timeout = setTimeout(() => {
    clearContrato(groupId, assassinoId);
  }, Math.max(0, contrato.expiraEm - Date.now()));
  activeContracts.set(contratoKey(groupId, assassinoId), { ...contrato, timeout });
}

function getContratoAtivo(groupId, assassinoId) {
  const key = contratoKey(groupId, assassinoId);
  const contrato = activeContracts.get(key);
  if (!contrato) return null;
  if (Date.now() >= contrato.expiraEm) {
    clearContrato(groupId, assassinoId);
    return null;
  }
  return contrato;
}

function normalizeClasse(input) {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value === 'trabalhador') return 'trabalhador';
  if (value === 'ladrao' || value === 'ladrão') return 'ladrao';
  if (value === 'assassino') return 'assassino';
  return null;
}

async function verificarDesbloqueios(msg, playerId, groupId) {
  const player = getPlayer(playerId, groupId, '');
  const nome = displayName(player);

  const reputacao = Number(player.reputacao ?? 50);
  const ladraoDesbloqueado = Number(player['ladrão_desbloqueado'] ?? 0);
  if (reputacao < 35 && ladraoDesbloqueado === 0) {
    setLadraoDesbloqueado(playerId, groupId, 1);
    const chat = await msg.getChat();
    await chat.sendMessage(
      `${nome} foi contatado por alguém suspeito no beco atrás do Assaí Atacadista. ` +
      'Ele oferece uma vida diferente. Digite !cargo ladrão pra mudar de vida.'
    );
  }

  const vitorias = Number(player.vitorias_luta ?? 0);
  const assassinoDesbloqueado = Number(player.assassino_desbloqueado ?? 0);
  if (vitorias >= 10 && assassinoDesbloqueado === 0) {
    setAssassinoDesbloqueado(playerId, groupId, 1);
    const chat = await msg.getChat();
    await chat.sendMessage(
      `${nome}, seu trabalho chamou atenção de pessoas importantes. ` +
      'Há uma proposta esperando por você. Digite !cargo assassino pra mudar de vida.'
    );
  }
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
    const classe = player.classe || 'trabalhador';
    if (classe !== 'trabalhador') {
      return msg.reply('Apenas quem é da classe trabalhador pode usar !trabalhar.');
    }

    const baseEarned = Math.floor(Math.random() * 151) + 50;
    const cargoAtualNome = classe === 'trabalhador' ? (player.cargo || 'empacotador') : 'empacotador';
    const cargoAtual = getCargoInfo(cargoAtualNome);
    const bonus = classe === 'trabalhador' ? cargoAtual.bonus : 0;
    const earned = Math.floor(baseEarned * (1 + bonus));

    updateBalance(msg.author, msg.from, earned);
    const trabalhos = incrementarTrabalhos(msg.author, msg.from);
    alterarReputacao(msg.author, msg.from, 1);

    let promotedTo = null;
    if (classe === 'trabalhador') {
      const reputacaoAtual = Number(player.reputacao ?? 50) + 1;
      const cargoAtualIndex = ASSAI_CARGOS.findIndex((c) => c.nome === cargoAtual.nome);
      const proximoCargo = ASSAI_CARGOS[cargoAtualIndex + 1];

      if (
        proximoCargo &&
        trabalhos >= proximoCargo.trabalhosMin &&
        reputacaoAtual >= proximoCargo.reputacaoMin
      ) {
        setCargo(msg.author, msg.from, proximoCargo.nome);
        alterarReputacao(msg.author, msg.from, 3);
        promotedTo = proximoCargo.nome;
      }
    }

    setCooldown(msg.author, 'trabalhar');

    if (promotedTo) {
      const chat = await msg.getChat();
      await chat.sendMessage(`🎉 ${displayName(player)} foi promovido para ${promotedTo} no Assaí Atacadista!`);
    }

    await verificarDesbloqueios(msg, msg.author, msg.from);

    if (Math.random() < 0.4) {
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

    return msg.reply(
      `*${displayName(player)}* trabalhou como *${cargoAtual.nome}* e ganhou R$${earned}.\n` +
      `${cargoAtual.flavor}`
    );
  },

  async passear(msg) {
    const cd = config.cooldowns.trabalhar;
    if (isOnCooldown(msg.author, 'passear', cd)) {
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'passear', cd)}s para passear de novo.`);
    }

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const nomeAutor = displayName(player);

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const roll = Math.random() * 100;

    setCooldown(msg.author, 'passear');

    if (roll < 25) {
      return msg.reply(pick(PASSEAR_MSG_NADA));
    }

    if (roll < 50) {
      const valor = Math.floor(Math.random() * 100) + 1;
      updateBalance(msg.author, msg.from, valor);
      return msg.reply(`💰 ${nomeAutor} achou R$${valor} no caminho.`);
    }

    if (roll < 70) {
      const players = listGroupPlayers(msg.from).filter((p) => p.id !== msg.author);
      if (!players.length) {
        return msg.reply(pick(PASSEAR_MSG_NADA));
      }

      const outro = players[Math.floor(Math.random() * players.length)];
      const nomeOutro = displayName(outro);
      const subRoll = Math.random() * 100;

      let template;
      if (subRoll < 80) template = pick(PASSEAR_MSG_ENCONTRO_CUMPRIMENTO);
      else if (subRoll < 90) template = pick(PASSEAR_MSG_ENCONTRO_EVITAR);
      else template = pick(PASSEAR_MSG_ENCONTRO_BRIGA);

      const texto = template.replaceAll('[X]', nomeAutor).replaceAll('[Y]', nomeOutro);
      return msg.reply(texto);
    }

    if (roll < 85) {
      const classe = player.classe || 'trabalhador';
      if (classe === 'ladrao') {
        return msg.reply(pick(PASSEAR_MSG_LADRAO_RECONHECIDO));
      }

      const valor = Math.floor(Math.random() * (200 - 10 + 1)) + 10;
      updateBalance(msg.author, msg.from, -valor);
      return msg.reply(`🕵️ ${nomeAutor} vacilou na rua e perdeu R$${valor}.`);
    }

    const reputacao = Number(player.reputacao ?? 50);
    if (reputacao >= 81) {
      const valor = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
      updateBalance(msg.author, msg.from, valor);
      const texto = pick(PASSEAR_MSG_LENDARIO).replace('[valor]', String(valor));
      return msg.reply(texto);
    }

    if (reputacao <= 20) {
      return msg.reply(pick(PASSEAR_MSG_SUSPEITO));
    }

    return msg.reply('Você deu uma volta, mas hoje sua reputação não chamou atenção de ninguém.');
  },


  async saldo(msg) {
    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const reputacao = Number(player.reputacao ?? 50);
    const faixa = getFaixaReputacao(reputacao);
    return msg.reply(
      `Saldo de *${displayName(player)}*: R$${player.balance}\n` +
      `Reputação: *${reputacao}* (${faixa})`
    );
  },

  async status(msg, args) {
    let player;

    if (!args.length) {
      const contact = await msg.getContact();
      player = getPlayer(msg.author, msg.from, contact.pushname || '');
    } else {
      const targetAlias = args.join(' ');
      player = getPlayerByAlias(msg.from, targetAlias);
      if (!player) {
        return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
      }
    }

    const nome = displayName(player);
    const saldo = Number(player.balance ?? 0);
    const reputacao = Number(player.reputacao ?? 50);
    const cargo = player.cargo || 'empacotador';

    return msg.reply(
      `*Status de ${nome}*\n` +
      `Saldo: R$${saldo}\n` +
      `Reputação: ${reputacao}\n` +
      `Cargo: ${cargo}`
    );
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
    const attackerName = displayName(attacker);
    const defenderName = displayName(defender);

    if (attackerWins) {
      updateBalance(msg.author, msg.from, prize);
      updateBalance(defender.player_id, msg.from, -prize);
      incrementarVitoriasLuta(msg.author, msg.from);
      alterarReputacao(msg.author, msg.from, 2);
      alterarReputacao(defender.player_id, msg.from, -3);
      setCooldown(msg.author, 'lutar');
      await verificarDesbloqueios(msg, msg.author, msg.from);
      await verificarDesbloqueios(msg, defender.player_id, msg.from);

      const template = LUTA_FLAVOR_VITORIA[Math.floor(Math.random() * LUTA_FLAVOR_VITORIA.length)];
      const flavor = template
        .replaceAll('[vencedor]', attackerName)
        .replaceAll('[perdedor]', defenderName);

      return msg.reply(
        `${flavor}\n` +
        `🏆 *${attackerName}* venceu e ganhou R$${prize}.`
      );
    } else {
      updateBalance(msg.author, msg.from, -prize);
      updateBalance(defender.player_id, msg.from, prize);
      incrementarVitoriasLuta(defender.player_id, msg.from);
      alterarReputacao(defender.player_id, msg.from, 2);
      alterarReputacao(msg.author, msg.from, -3);
      setCooldown(msg.author, 'lutar');
      await verificarDesbloqueios(msg, msg.author, msg.from);
      await verificarDesbloqueios(msg, defender.player_id, msg.from);

      const template = LUTA_FLAVOR_DERROTA[Math.floor(Math.random() * LUTA_FLAVOR_DERROTA.length)];
      const flavor = template
        .replaceAll('[vencedor]', defenderName)
        .replaceAll('[perdedor]', attackerName);

      return msg.reply(
        `${flavor}\n` +
        `🏆 *${defenderName}* venceu e ganhou R$${prize}.`
      );
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
    const thiefClasse = thief.classe || 'trabalhador';
    if (thiefClasse !== 'ladrao') {
      return msg.reply('Apenas quem é da classe ladrao pode usar !roubar.');
    }

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
      alterarReputacao(msg.author, msg.from, -5);
      setCooldown(msg.author, 'roubar');
      await verificarDesbloqueios(msg, msg.author, msg.from);
      return msg.reply(`*${displayName(thief)}* tentou roubar *${displayName(target)}* e foi pego! Multa de R$${fine}.`);
    }
  },

  async cargo(msg, args) {
    const classeDesejada = normalizeClasse(args[0]);
    if (!classeDesejada) {
      return msg.reply('Uso: !cargo <trabalhador|ladrao|assassino>');
    }

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classeAtual = player.classe || 'trabalhador';

    if (classeDesejada === classeAtual) {
      return msg.reply(`Você já está na classe *${classeAtual}*.`);
    }

    if (classeDesejada === 'ladrao' && Number(player['ladrão_desbloqueado'] ?? 0) !== 1) {
      return msg.reply('Classe ladrao ainda não desbloqueada para você.');
    }

    if (classeDesejada === 'assassino' && Number(player.assassino_desbloqueado ?? 0) !== 1) {
      return msg.reply('Classe assassino ainda não desbloqueada para você.');
    }

    const now = Math.floor(Date.now() / 1000);
    const lastSwap = Number(player.cooldown_classe ?? 0);
    const cooldown = 86400;
    const remaining = cooldown - (now - lastSwap);
    if (remaining > 0) {
      return msg.reply(`Você precisa aguardar ${remaining}s para trocar de classe novamente.`);
    }

    if (classeAtual === 'trabalhador' || classeDesejada === 'trabalhador') {
      resetTrabalhosECargo(msg.author, msg.from);
    }

    setClasse(msg.author, msg.from, classeDesejada);
    setCooldownClasse(msg.author, msg.from, now);

    return msg.reply(`Classe alterada com sucesso para *${classeDesejada}*.`);
  },

  async rumor(msg, args) {
    const targetRaw = args[0];
    if (!targetRaw) return msg.reply('Uso: !rumor @pessoa');

    const targetAlias = targetRaw.startsWith('@') ? targetRaw.slice(1) : targetRaw;
    if (!targetAlias) return msg.reply('Uso: !rumor @pessoa');

    const contact = await msg.getContact();
    const sender = getPlayer(msg.author, msg.from, contact.pushname || '');
    const target = getPlayerByAlias(msg.from, targetAlias);

    if (!target) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
    if (target.player_id === msg.author) return msg.reply('Você não pode espalhar rumor sobre si mesmo.');

    if (Number(sender.balance) < 50) {
      return msg.reply(`Você precisa de R$50 para usar !rumor. Saldo atual: R$${sender.balance}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const cdEnviou = 14400;
    const lastEnviou = Number(sender.cooldown_rumor_enviou ?? 0);
    const remainingEnviou = cdEnviou - (now - lastEnviou);
    if (remainingEnviou > 0) {
      return msg.reply(`Aguarde ${remainingEnviou}s para enviar outro rumor.`);
    }

    const cdRecebeu = 10800;
    const lastRecebeu = Number(target.cooldown_rumor_recebeu ?? 0);
    const remainingRecebeu = cdRecebeu - (now - lastRecebeu);
    if (remainingRecebeu > 0) {
      return msg.reply(`*${displayName(target)}* está protegido de rumores por mais ${remainingRecebeu}s.`);
    }

    updateBalance(msg.author, msg.from, -50);
    setCooldownRumorEnviou(msg.author, msg.from, now);
    setCooldownRumorRecebeu(target.player_id, msg.from, now);
    alterarReputacao(target.player_id, msg.from, -2);

    await verificarDesbloqueios(msg, target.player_id, msg.from);

    const template = RUMORES[Math.floor(Math.random() * RUMORES.length)];
    const rumor = template.replace('[pessoa]', displayName(target));
    const chat = await msg.getChat();
    await chat.sendMessage(rumor);

    return msg.reply(`Rumor espalhado. Custo: R$50.`);
  },

  async contrato(msg) {
    const cd = config.cooldowns.trabalhar;
    if (isOnCooldown(msg.author, 'contrato', cd)) {
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'contrato', cd)}s para pegar outro contrato.`);
    }

    const contact = await msg.getContact();
    const assassino = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classe = assassino.classe || 'trabalhador';
    if (classe !== 'assassino') {
      return msg.reply('Apenas jogadores da classe assassino podem usar !contrato.');
    }

    const players = listGroupPlayers(msg.from).filter((p) => p.id !== msg.author);
    if (!players.length) {
      return msg.reply('Não há alvos disponíveis no grupo para contrato.');
    }

    const alvo = players[Math.floor(Math.random() * players.length)];
    const premio = Math.floor(Math.random() * (1500 - 300 + 1)) + 300;
    const expiraEm = Date.now() + CONTRATO_DURACAO_MS;

    setContrato(msg.from, msg.author, {
      assassinoId: msg.author,
      alvoId: alvo.id,
      groupId: msg.from,
      premio,
      expiraEm,
    });

    setCooldown(msg.author, 'contrato');

    return msg.reply(
      `📋 Novo contrato recebido. Alvo: ${displayName(alvo)}. ` +
      `Recompensa: R$${premio}. Você tem 2 horas.`
    );
  },

  async matar(msg, args) {
    const targetRaw = args[0];
    if (!targetRaw) return msg.reply('Uso: !matar @pessoa');

    const targetAlias = targetRaw.startsWith('@') ? targetRaw.slice(1) : targetRaw;
    if (!targetAlias) return msg.reply('Uso: !matar @pessoa');

    const contact = await msg.getContact();
    const assassino = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classe = assassino.classe || 'trabalhador';
    if (classe !== 'assassino') {
      return msg.reply('Apenas jogadores da classe assassino podem usar !matar.');
    }

    const alvo = getPlayerByAlias(msg.from, targetAlias);
    if (!alvo) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);
    if (alvo.player_id === msg.author) return msg.reply('Você não pode executar contrato em si mesmo.');

    const contrato = getContratoAtivo(msg.from, msg.author);
    if (!contrato || contrato.alvoId !== alvo.player_id) {
      return msg.reply('Não há contrato ativo para esse alvo.');
    }

    const sucesso = Math.random() < 0.6;
    clearContrato(msg.from, msg.author);

    if (sucesso) {
      updateBalance(msg.author, msg.from, contrato.premio);
      alterarReputacao(msg.author, msg.from, 5);
      const mortoAte = Math.floor(Date.now() / 1000) + 30 * 60;
      setMortoAte(alvo.player_id, msg.from, mortoAte);

      await verificarDesbloqueios(msg, msg.author, msg.from);

      return msg.reply(
        `💀 ${displayName(assassino)} eliminou ${displayName(alvo)} e recebeu R$${contrato.premio}.`
      );
    }

    alterarReputacao(msg.author, msg.from, -8);
    const presoAte = Math.floor(Date.now() / 1000) + 20 * 60;
    setPresoAte(msg.author, msg.from, presoAte);
    await verificarDesbloqueios(msg, msg.author, msg.from);

    return msg.reply(`🚨 ${displayName(assassino)} tentou eliminar ${displayName(alvo)} e foi capturado.`);
  },

  async pagar_multa(msg) {
    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classe = player.classe || 'trabalhador';
    if (classe !== 'assassino') {
      return msg.reply('Apenas jogadores da classe assassino podem usar !pagar_multa.');
    }

    const now = Math.floor(Date.now() / 1000);
    const presoAte = Number(player.preso_ate ?? 0);

    if (presoAte <= now) {
      return msg.reply('Você não está preso.');
    }

    if (Number(player.balance) < ASSASSINO_MULTA) {
      return msg.reply(`Saldo insuficiente para pagar a multa de R$${ASSASSINO_MULTA}.`);
    }

    updateBalance(msg.author, msg.from, -ASSASSINO_MULTA);
    setPresoAte(msg.author, msg.from, 0);
    return msg.reply(`Multa paga. Você foi liberado por R$${ASSASSINO_MULTA}.`);
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
      `${p}cargo <classe> - Troca sua classe\n\n` +
      `*Economia*\n` +
      `${p}trabalhar - Ganhe dinheiro (cooldown: 10min)\n` +
      `${p}passear - Dê uma volta pelo bairro (cooldown: 10min)\n` +
      `${p}lutar <nome> - Lute contra alguém (cooldown: 1min)\n` +
      `${p}roubar <nome> - Tente roubar alguém (cooldown: 2min)\n` +
      `${p}rumor @pessoa - Espalha um rumor (custo: R$50)\n` +
      `${p}contrato - Recebe um contrato de assassino\n` +
      `${p}matar @pessoa - Tenta executar um contrato\n` +
      `${p}pagar_multa - Paga R$200 para sair da prisão\n` +
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
commands.passeio = commands.passear;
commands.andar = commands.passear;
commands.explorar = commands.passear;
commands.brigar = commands.lutar;
commands.bater = commands.lutar;
commands.espancar = commands.lutar;
commands.transferir = commands.pix;
commands.doar = commands.pix;
commands.comandos = commands.ajuda;
commands.help = commands.ajuda;
commands.perfil = commands.status;
commands.reputação = commands.status;
commands.reputacao = commands.status;


module.exports = commands;
