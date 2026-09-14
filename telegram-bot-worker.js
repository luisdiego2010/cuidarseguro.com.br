// ============================================================
// Bot do Telegram — CuidarSeguro.com.br
// Cloudflare Worker + Claude API (claude-haiku-4-5)
// Variáveis de ambiente necessárias (Settings → Variables):
//   TELEGRAM_TOKEN   → token do BotFather
//   ANTHROPIC_KEY    → sk-ant-...
// ============================================================

const SYSTEM_PROMPT = `Você é o assistente virtual do site CuidarSeguro.com.br, 
uma plataforma educacional brasileira dedicada à segurança do paciente, 
desenvolvida pelo Prof. Dr. Luís Antônio Diego, médico anestesiologista e 
pesquisador da Universidade Federal Fluminense (UFF).

Seu papel é responder perguntas sobre segurança do paciente de forma clara, 
acessível e baseada em evidências, para um público variado: profissionais de saúde, 
estudantes, pesquisadores e pacientes/familiares.

Tópicos que você domina:
- Cultura de segurança do paciente
- Erros de medicação e reconciliação medicamentosa
- Eventos adversos e near misses
- Protocolos e checklists de segurança (OMS, ANVISA, CFM)
- Acreditação hospitalar (ONA, JCI)
- Cirurgia segura e anestesia segura
- Identificação correta do paciente
- Prevenção de infecções relacionadas à assistência à saúde (IRAS)
- Comunicação efetiva na equipe de saúde
- Notificação de incidentes
- Indicadores de qualidade hospitalar
- Farmácia clínica e segurança no uso de medicamentos

Diretrizes de resposta:
- Use linguagem clara, sem jargão desnecessário quando falar com leigos
- Com profissionais, use terminologia técnica adequada
- Cite diretrizes brasileiras (ANVISA, CFM, MS) e internacionais (OMS, JCI) quando pertinente
- Seja objetivo e prático
- Se não souber algo, indique que o usuário consulte o site cuidarseguro.com.br ou um profissional
- Nunca faça diagnósticos ou prescreva medicamentos
- Mantenha respostas entre 3 e 8 parágrafos, ou use listas quando adequado
- Responda sempre em português brasileiro`;

export default {
  async fetch(request, env) {
    // Só aceita POST
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    // Ignora atualizações sem mensagem de texto
    const message = update?.message;
    if (!message?.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const userText = message.text.trim();
    const firstName = message.from?.first_name || "usuário";

    // Comando /start
    if (userText === "/start") {
      await sendTelegram(env.TELEGRAM_TOKEN, chatId,
        `👋 Olá, ${firstName}! Sou o assistente do *CuidarSeguro.com.br*.\n\n` +
        `Estou aqui para responder suas dúvidas sobre *segurança do paciente* — ` +
        `desde cultura de segurança, erros de medicação, protocolos cirúrgicos até acreditação hospitalar.\n\n` +
        `Digite sua pergunta e responderei com base em evidências e diretrizes atualizadas. 🏥`
      );
      return new Response("OK", { status: 200 });
    }

    // Comando /ajuda
    if (userText === "/ajuda" || userText === "/help") {
      await sendTelegram(env.TELEGRAM_TOKEN, chatId,
        `ℹ️ *Como usar este bot:*\n\n` +
        `Envie qualquer pergunta sobre segurança do paciente. Exemplos:\n\n` +
        `• O que é cultura de segurança?\n` +
        `• Como prevenir erros de medicação na UTI?\n` +
        `• Quais são os protocolos de cirurgia segura da OMS?\n` +
        `• O que é reconciliação medicamentosa?\n\n` +
        `🌐 Acesse também: cuidarseguro.com.br`
      );
      return new Response("OK", { status: 200 });
    }

    // Indica que está processando
    await sendTyping(env.TELEGRAM_TOKEN, chatId);

    // Chama a API do Claude
    let resposta;
    try {
      resposta = await callClaude(env.ANTHROPIC_KEY, userText);
    } catch (err) {
      await sendTelegram(env.TELEGRAM_TOKEN, chatId,
        `⚠️ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em instantes.`
      );
      console.error("Erro Claude:", err);
      return new Response("OK", { status: 200 });
    }

    await sendTelegram(env.TELEGRAM_TOKEN, chatId, resposta);
    return new Response("OK", { status: 200 });
  }
};

// ── Funções auxiliares ─────────────────────────────────────

async function callClaude(apiKey, userMessage) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "Não consegui gerar uma resposta. Tente novamente.";
}

async function sendTelegram(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  });
}

async function sendTyping(token, chatId) {
  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing"
    })
  });
}
