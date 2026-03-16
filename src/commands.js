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
  setMedicoDesbloqueado,
  setCooldownRumorEnviou,
  setCooldownRumorRecebeu,
  setMortoAte,
  setPresoAte,
  setEstudouPrimeiraVez,
  setCrmProximaCobranca,
  alterarReputacao,
  getFaixaReputacao,
  setAlias,
  listGroupPlayers,
  addFrase,
  getRandomFrase,
  listFrases,
  aumentarStatDireto,
  evoluirStatPorAcao,
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

const CONTRATO_DURACAO_MS = 2 * 60 * 60 * 1000;
const PRISAO_TEMPO_RECONHECIDO_SEG = 20 * 60;
const ESTUDO_MENSALIDADE = 500;
const MEDICO_INT_REQ = 7;
const MEDICO_CRM_INTERVALO_SEG = 6 * 60 * 60;
const MEDICO_CRM_MIN = 450;
const MEDICO_CRM_MAX = 850;
const PROGRESSO_STAT_THRESHOLD = 5;
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

function calcularMultaPeloTempo(presoAte, now) {
  const segundosRestantes = Math.max(0, presoAte - now);
  const minutosRestantes = Math.max(1, Math.ceil(segundosRestantes / 60));
  return minutosRestantes * 10;
}

function normalizeClasse(input) {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value === 'trabalhador') return 'trabalhador';
  if (value === 'ladrao' || value === 'ladrão') return 'ladrao';
  if (value === 'assassino') return 'assassino';
  if (value === 'medico' || value === 'médico') return 'medico';
  return null;
}

function clampChance(value) {
  return Math.max(0.05, Math.min(0.95, value));
}

function getStats(player) {
  return {
    forca: Number(player.forca ?? 1),
    inteligencia: Number(player.inteligencia ?? 1),
    furtividade: Number(player.furtividade ?? 1),
  };
}

function formatStatUpMessages(nome, changes) {
  return changes
    .filter((c) => c.subiu > 0)
    .map((c) => `⬆️ ${nome} aumentou ${c.label} para ${c.valorAtual}.`)
    .join('\n');
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
    if (isOnCooldown(msg.author, 'trocar_nome', config.cooldowns.trocarNome)) {
      return msg.reply(
        `Você precisa aguardar ${getRemainingTime(msg.author, 'trocar_nome', config.cooldowns.trocarNome)}s para trocar de nome novamente.`
      );
    }

    const contact = await msg.getContact();
    getPlayer(msg.author, msg.from, contact.pushname || '');

    const result = setAlias(msg.author, msg.from, alias);
    if (result.error === 'alias_taken') return msg.reply(`O nome *${alias}* já está em uso neste grupo.`);

    setCooldown(msg.author, 'trocar_nome');

    return msg.reply(`Nome alterado para *${alias}*.`);
  },

  async trabalhar(msg) {
    const cd = config.cooldowns.trabalhar;
    if (isOnCooldown(msg.author, 'trabalhar', cd))
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'trabalhar', cd)}s para trabalhar de novo.`);

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classe = player.classe || 'trabalhador';
    const nome = displayName(player);

    if (classe === 'medico') {
      const now = Math.floor(Date.now() / 1000);
      const proximaCobranca = Number(player.crm_proxima_cobranca ?? 0);

      if (proximaCobranca <= now) {
        const taxaCrm = Math.floor(Math.random() * (MEDICO_CRM_MAX - MEDICO_CRM_MIN + 1)) + MEDICO_CRM_MIN;
        if (Number(player.balance) < taxaCrm) {
          return msg.reply(
            `Seu CRM venceu e a taxa de renovação é R$${taxaCrm}. ` +
            `Sem isso você não pode atender na UPA.`
          );
        }

        updateBalance(msg.author, msg.from, -taxaCrm);
        setCrmProximaCobranca(msg.author, msg.from, now + MEDICO_CRM_INTERVALO_SEG);

        const earned = Math.floor(Math.random() * (2300 - 1200 + 1)) + 1200;
        updateBalance(msg.author, msg.from, earned);
        incrementarTrabalhos(msg.author, msg.from);
        alterarReputacao(msg.author, msg.from, 10);
        setCooldown(msg.author, 'trabalhar');

        return msg.reply(
          `👨‍⚕️ *${nome}* pagou R$${taxaCrm} da CRM e entrou no plantão da UPA.\n` +
          `Atendeu meio bairro e recebeu R$${earned}.\n` +
          `Reputação +10.`
        );
      }

      const earned = Math.floor(Math.random() * (2300 - 1200 + 1)) + 1200;
      updateBalance(msg.author, msg.from, earned);
      incrementarTrabalhos(msg.author, msg.from);
      alterarReputacao(msg.author, msg.from, 10);
      setCooldown(msg.author, 'trabalhar');

      return msg.reply(
        `👨‍⚕️ *${nome}* fez plantão na UPA e ganhou R$${earned}.\n` +
        `Você salvou o bairro inteiro do caos e recebeu +10 de reputação.`
      );
    }

    if (classe === 'ladrao' || classe === 'assassino') {
      const chanceReconhecido = classe === 'assassino' ? 0.35 : 0.25;
      if (Math.random() < chanceReconhecido) {
        const presoAte = Math.floor(Date.now() / 1000) + PRISAO_TEMPO_RECONHECIDO_SEG;
        setPresoAte(msg.author, msg.from, presoAte);
        setCooldown(msg.author, 'trabalhar');
        return msg.reply(`Você foi reconhecido enquanto trabalhava e acabou preso por 20 minutos.`);
      }
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

    const flavor = classe === 'trabalhador'
      ? cargoAtual.flavor
      : `Você trabalhou discretamente para não chamar muita atenção.`;

    return msg.reply(
      `*${nome}* trabalhou como *${cargoAtual.nome}* e ganhou R$${earned}.\n` +
      `${flavor}`
    );
  },

  async passear(msg) {
    const cd = config.cooldowns.passear;
    if (isOnCooldown(msg.author, 'passear', cd)) {
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'passear', cd)}s para passear de novo.`);
    }

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const nomeAutor = displayName(player);

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const roll = Math.random() * 100;

    setCooldown(msg.author, 'passear');

    if (roll < 15) {
      const eventosDeStat = [
        {
          stat: 'forca',
          texto: `🥊 ${nomeAutor} encontrou o Mike Baguncinha na rua e aprendeu uns golpes novos. Força +1!`,
        },
        {
          stat: 'inteligencia',
          texto: `📚 ${nomeAutor} trombou com o Mizerávi e saiu sabendo até regra de três. Inteligência +1!`,
        },
        {
          stat: 'furtividade',
          texto: `🕶️ ${nomeAutor} conheceu a Dona Sombra no beco e aprendeu a sumir sem fazer barulho. Furtividade +1!`,
        },
      ];

      const evento = eventosDeStat[Math.floor(Math.random() * eventosDeStat.length)];
      const valorAtual = aumentarStatDireto(msg.author, msg.from, evento.stat, 1);
      return msg.reply(`${evento.texto} (Agora: ${valorAtual}/10)`);
    }

    if (roll < 25) {
      return msg.reply(pick(PASSEAR_MSG_NADA));
    }

    if (roll < 50) {
      const valor = Math.floor(Math.random() * 40) + 1;
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
    const classe = player.classe || 'trabalhador';
    const stats = getStats(player);
    let cargoExibido = cargo;
    if (classe === 'ladrao') cargoExibido = 'ladrão';
    if (classe === 'assassino') cargoExibido = 'assassino';
    if (classe === 'medico') cargoExibido = 'médico';
    const vitoriasLuta = Number(player.vitorias_luta ?? 0);

    return msg.reply(
      `*Status de ${nome}*\n` +
      `Saldo: R$${saldo}\n` +
      `Reputação: ${reputacao}\n` +
      `Cargo: ${cargoExibido}\n` +
      `Vitórias em luta: ${vitoriasLuta}\n` +
      `Força: ${stats.forca}/10\n` +
      `Inteligência: ${stats.inteligencia}/10\n` +
      `Furtividade: ${stats.furtividade}/10`
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

    const attackerStats = getStats(attacker);
    const defenderStats = getStats(defender);
    const chanceAtacante = clampChance(0.5 + (attackerStats.forca - defenderStats.forca) * 0.04);
    const attackerWins = Math.random() < chanceAtacante;
    const prize = Math.floor(Math.random() * 101) + 50;
    const attackerName = displayName(attacker);
    const defenderName = displayName(defender);
    const progressoForca = evoluirStatPorAcao(msg.author, msg.from, 'forca', PROGRESSO_STAT_THRESHOLD);
    const statUps = formatStatUpMessages(attackerName, [
      { label: 'força', subiu: progressoForca.subiu, valorAtual: progressoForca.stat },
    ]);

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
        `🏆 *${attackerName}* venceu e ganhou R$${prize}.` +
        (statUps ? `\n${statUps}` : '')
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
        `🏆 *${defenderName}* venceu e ganhou R$${prize}.` +
        (statUps ? `\n${statUps}` : '')
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

    const thiefStats = getStats(thief);
    const targetStats = getStats(target);
    const chanceRoubo = clampChance(0.35 + (thiefStats.furtividade - targetStats.furtividade) * 0.05);
    const success = Math.random() < chanceRoubo;
    const amount = Math.floor(Math.random() * 181) + 40;
    const progressoFurtividade = evoluirStatPorAcao(msg.author, msg.from, 'furtividade', PROGRESSO_STAT_THRESHOLD);
    const statUps = formatStatUpMessages(displayName(thief), [
      { label: 'furtividade', subiu: progressoFurtividade.subiu, valorAtual: progressoFurtividade.stat },
    ]);

    if (success) {
      const stolen = Math.min(amount, target.balance);
      updateBalance(msg.author, msg.from, stolen);
      updateBalance(target.player_id, msg.from, -stolen);
      alterarReputacao(msg.author, msg.from, -2);
      setCooldown(msg.author, 'roubar');
      return msg.reply(
        `*${displayName(thief)}* roubou R$${stolen} de *${displayName(target)}*!` +
        (statUps ? `\n${statUps}` : '')
      );
    } else {
      const fine = Math.floor(amount / 2);
      updateBalance(msg.author, msg.from, -fine);
      alterarReputacao(msg.author, msg.from, -5);
      setCooldown(msg.author, 'roubar');
      await verificarDesbloqueios(msg, msg.author, msg.from);
      return msg.reply(
        `*${displayName(thief)}* tentou roubar *${displayName(target)}* e foi pego! Multa de R$${fine}.` +
        (statUps ? `\n${statUps}` : '')
      );
    }
  },

  async cargo(msg, args) {
    const classeDesejada = normalizeClasse(args[0]);
    if (!classeDesejada) {
      return msg.reply('Uso: !cargo <trabalhador|ladrao|assassino|medico>');
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

    if (classeDesejada === 'medico' && Number(player.medico_desbloqueado ?? 0) !== 1) {
      return msg.reply('Você ainda não passou na prova de medicina. Use !prova_medico.');
    }

    const now = Math.floor(Date.now() / 1000);
    const lastSwap = Number(player.cooldown_classe ?? 0);
    const cooldown = config.cooldowns.trocarCargo;
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
    const cdEnviou = config.cooldowns.rumorEnviou;
    const lastEnviou = Number(sender.cooldown_rumor_enviou ?? 0);
    const remainingEnviou = cdEnviou - (now - lastEnviou);
    if (remainingEnviou > 0) {
      return msg.reply(`Aguarde ${remainingEnviou}s para enviar outro rumor.`);
    }

    const cdRecebeu = config.cooldowns.rumorRecebeu;
    const lastRecebeu = Number(target.cooldown_rumor_recebeu ?? 0);
    const remainingRecebeu = cdRecebeu - (now - lastRecebeu);
    if (remainingRecebeu > 0) {
      return msg.reply(`*${displayName(target)}* está protegido de rumores por mais ${remainingRecebeu}s.`);
    }

    updateBalance(msg.author, msg.from, -50);
    setCooldownRumorEnviou(msg.author, msg.from, now);
    setCooldownRumorRecebeu(target.player_id, msg.from, now);
    alterarReputacao(target.player_id, msg.from, -4);

    await verificarDesbloqueios(msg, target.player_id, msg.from);

    const template = RUMORES[Math.floor(Math.random() * RUMORES.length)];
    const rumor = template.replace('[pessoa]', displayName(target));
    const chat = await msg.getChat();
    await chat.sendMessage(rumor);

    return msg.reply(`Rumor espalhado. Custo: R$50.`);
  },

  async contrato(msg) {
    const cd = config.cooldowns.contrato;
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
    const isContratoValido = !!(contrato && contrato.alvoId === alvo.player_id);
    const assassinoStats = getStats(assassino);
    const alvoStats = getStats(alvo);
    const chanceBase = isContratoValido ? 0.65 : 0.55;
    const sucesso = Math.random() < clampChance(chanceBase + (assassinoStats.furtividade - alvoStats.furtividade) * 0.04);
    const progressoFurtividade = evoluirStatPorAcao(msg.author, msg.from, 'furtividade', PROGRESSO_STAT_THRESHOLD);
    const statUps = formatStatUpMessages(displayName(assassino), [
      { label: 'furtividade', subiu: progressoFurtividade.subiu, valorAtual: progressoFurtividade.stat },
    ]);
    if (isContratoValido) {
      clearContrato(msg.from, msg.author);
    }

    if (sucesso) {
      if (isContratoValido) {
        updateBalance(msg.author, msg.from, contrato.premio);
      }
      alterarReputacao(msg.author, msg.from, -5);
      const mortoAte = Math.floor(Date.now() / 1000) + 30 * 60;
      setMortoAte(alvo.player_id, msg.from, mortoAte);

      await verificarDesbloqueios(msg, msg.author, msg.from);

      if (isContratoValido) {
        return msg.reply(
          `💀 ${displayName(assassino)} eliminou ${displayName(alvo)} e recebeu R$${contrato.premio}.` +
          (statUps ? `\n${statUps}` : '')
        );
      }

      return msg.reply(
        `💀 ${displayName(assassino)} eliminou ${displayName(alvo)} fora de contrato e não recebeu recompensa.` +
        (statUps ? `\n${statUps}` : '')
      );
    }

    alterarReputacao(msg.author, msg.from, -8);
    const presoAte = Math.floor(Date.now() / 1000) + 20 * 60;
    setPresoAte(msg.author, msg.from, presoAte);
    await verificarDesbloqueios(msg, msg.author, msg.from);

    return msg.reply(
      `🚨 ${displayName(assassino)} tentou eliminar ${displayName(alvo)} e foi capturado.` +
      (statUps ? `\n${statUps}` : '')
    );
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

    const multa = calcularMultaPeloTempo(presoAte, now);

    if (Number(player.balance) < multa) {
      return msg.reply(`Saldo insuficiente para pagar a multa de R$${multa}.`);
    }

    updateBalance(msg.author, msg.from, -multa);
    setPresoAte(msg.author, msg.from, 0);
    return msg.reply(`Multa paga. Você foi liberado por R$${multa}.`);
  },

  async estudar(msg) {
    const cd = config.cooldowns.estudar;
    if (isOnCooldown(msg.author, 'estudar', cd)) {
      return msg.reply(`Aguarde ${getRemainingTime(msg.author, 'estudar', cd)}s para estudar de novo.`);
    }

    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const nome = displayName(player);
    const estudouPrimeiraVez = Number(player.estudou_primeira_vez ?? 0) === 1;

    if (!estudouPrimeiraVez) {
      setEstudouPrimeiraVez(msg.author, msg.from, 1);
      const novaInteligencia = aumentarStatDireto(msg.author, msg.from, 'inteligencia', 1);
      setCooldown(msg.author, 'estudar');
      return msg.reply(
        `"*Estácio:* Oi vem estuda com nois. A mensalidade é ${ESTUDO_MENSALIDADE}"\n` +
        `${nome} estudou e ganhou +1 de inteligência. (${novaInteligencia}/10)`
      );
    }

    const novaInteligencia = aumentarStatDireto(msg.author, msg.from, 'inteligencia', 1);
    setCooldown(msg.author, 'estudar');
    return msg.reply(`📘 ${nome} estudou e ganhou +1 de inteligência. (${novaInteligencia}/10)`);
  },

  async prova_medico(msg) {
    const contact = await msg.getContact();
    const player = getPlayer(msg.author, msg.from, contact.pushname || '');
    const nome = displayName(player);
    const inteligencia = Number(player.inteligencia ?? 1);

    if (Number(player.medico_desbloqueado ?? 0) === 1) {
      return msg.reply('Você já passou na prova de medicina. Use !cargo medico quando quiser.');
    }

    if (inteligencia < MEDICO_INT_REQ) {
      return msg.reply(
        'Você pediu pra fazer a prova, mas só riram da sua cara. ' +
        `Estude mais e chegue em ${MEDICO_INT_REQ} de inteligência.`
      );
    }

    const chancePassar = clampChance(0.6 + (inteligencia - MEDICO_INT_REQ) * 0.05);
    const passou = Math.random() < chancePassar;

    if (!passou) {
      return msg.reply(
        `📝 ${nome} travou na prova de medicina e foi reprovado por enquanto. ` +
        'Tenta de novo depois de estudar mais.'
      );
    }

    setMedicoDesbloqueado(msg.author, msg.from, 1);
    if (Number(player.crm_proxima_cobranca ?? 0) <= 0) {
      const now = Math.floor(Date.now() / 1000);
      setCrmProximaCobranca(msg.author, msg.from, now + MEDICO_CRM_INTERVALO_SEG);
    }

    return msg.reply(
      `🎓 ${nome} passou na prova de medicina! ` +
      'Agora use !cargo medico para começar os plantões na UPA.'
    );
  },

  async ressuscitar(msg, args) {
    const targetAlias = args[0];
    if (!targetAlias) return msg.reply('Uso: !ressuscitar <nome>');

    const contact = await msg.getContact();
    const medico = getPlayer(msg.author, msg.from, contact.pushname || '');
    const classe = medico.classe || 'trabalhador';
    if (classe !== 'medico') {
      return msg.reply('Apenas médicos podem usar !ressuscitar.');
    }

    const alvo = getPlayerByAlias(msg.from, targetAlias);
    if (!alvo) return msg.reply(`Nenhum jogador com o nome *${targetAlias}* encontrado.`);

    const now = Math.floor(Date.now() / 1000);
    const mortoAte = Number(alvo.morto_ate ?? 0);
    if (mortoAte <= now) {
      return msg.reply(`*${displayName(alvo)}* não está morto no momento.`);
    }

    setMortoAte(alvo.player_id, msg.from, 0);
    alterarReputacao(msg.author, msg.from, 5);
    return msg.reply(`⚕️ ${displayName(medico)} ressuscitou ${displayName(alvo)}. Milagre da UPA.`);
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
      `${p}trocar <nome> - Muda seu nome (cooldown: 7 dias)\n` +
      `${p}status [nome] - Mostra saldo, reputação, cargo, vitórias e stats\n` +
      `${p}cargo <trabalhador|ladrao|assassino|medico> - Troca sua classe\n` +
      `${p}estudar - Aumenta inteligência +1 (cooldown: 5min)\n` +
      `${p}prova_medico - Faz a prova para desbloquear médico\n` +
      `${p}ressuscitar <nome> - Médicos trazem mortos de volta\n\n` +
      `*Economia*\n` +
      `${p}trabalhar - Ganhe dinheiro (classes ladrao/assassino podem ser reconhecidas e presas)\n` +
      `${p}passear / ${p}andar - Dê uma volta pelo bairro (cooldown: 1min)\n` +
      `${p}lutar <nome> - Lute contra alguém (cooldown: 1min)\n` +
      `${p}roubar <nome> - Tente roubar alguém (cooldown: 2min)\n` +
      `${p}rumor @pessoa - Espalha um rumor (custo: R$50, cooldown reduzido)\n` +
      `${p}contrato - Recebe um contrato de assassino (cooldown: 1h)\n` +
      `${p}matar @pessoa - Tenta eliminar alvo (com ou sem contrato)\n` +
      `${p}pagar_multa - Paga multa variável para sair da prisão\n` +
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
commands.prova = commands.prova_medico;
commands.estudar_medicina = commands.prova_medico;
commands.reviver = commands.ressuscitar;


module.exports = commands;
