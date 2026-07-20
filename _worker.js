export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

function getAllowedOrigin(env) {
  return env.ALLOWED_ORIGIN || "https://cuidarseguro.com.br";
}

function checkOrigin(request, env) {
  const ALLOWED_ORIGIN = getAllowedOrigin(env);
  const origin = request.headers.get("Origin") || "";
  if (origin && origin !== ALLOWED_ORIGIN) {
    return jsonResponse({ error: "Origem não autorizada." }, 403, ALLOWED_ORIGIN);
  }
  return null;
}

async function handleSignup(request, env) {
  const ALLOWED_ORIGIN = getAllowedOrigin(env);
  const originError = checkOrigin(request, env);
  if (originError) return originError;

  if (!env.LEADS_KV) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500, ALLOWED_ORIGIN);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "JSON inválido." }, 400, ALLOWED_ORIGIN);
  }

  const nome = (body?.nome || "").toString().trim();
  const email = (body?.email || "").toString().trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nome || nome.length < 2) {
    return jsonResponse({ error: "Informe seu nome." }, 400, ALLOWED_ORIGIN);
  }
  if (!emailRegex.test(email)) {
    return jsonResponse({ error: "Informe um e-mail válido." }, 400, ALLOWED_ORIGIN);
  }

  const token = crypto.randomUUID();
  await env.LEADS_KV.put(
    `lead:${token}`,
    JSON.stringify({ nome, email, criadoEm: new Date().toISOString() })
  );

  return jsonResponse({ token }, 200, ALLOWED_ORIGIN);
}

async function handleChat(request, env) {
  const ALLOWED_ORIGIN = getAllowedOrigin(env);
  const originError = checkOrigin(request, env);
  if (originError) return originError;

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500, ALLOWED_ORIGIN);
  }
  if (!env.LEADS_KV) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500, ALLOWED_ORIGIN);
  }

  const token = request.headers.get("X-Access-Token") || "";
  if (!token) {
    return jsonResponse({ error: "Cadastre-se para usar o assistente." }, 401, ALLOWED_ORIGIN);
  }
  const lead = await env.LEADS_KV.get(`lead:${token}`);
  if (!lead) {
    return jsonResponse({ error: "Cadastro não encontrado. Cadastre-se novamente." }, 401, ALLOWED_ORIGIN);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "JSON inválido." }, 400, ALLOWED_ORIGIN);
  }
  const { message, system } = body || {};
  if (!message || typeof message !== "string") {
    return jsonResponse({ error: "Campo 'message' é obrigatório." }, 400, ALLOWED_ORIGIN);
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || "claude-sonnet-5",
        max_tokens: 1024,
        system:
          system ||
          "Você é um assistente do site. Responda em português, de forma clara e cautelosa. Não forneça diagnóstico médico individual nem substitua orientação profissional; em caso de emergência, oriente a procurar atendimento imediato.",
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!upstream.ok) {
      console.error("Erro da Anthropic:", upstream.status, await upstream.text());
      return jsonResponse({ error: "Falha ao consultar a IA. Tente novamente." }, 502, ALLOWED_ORIGIN);
    }
    const data = await upstream.json();
    const text = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return jsonResponse({ reply: text }, 200, ALLOWED_ORIGIN);
  } catch (err) {
    console.error("Erro inesperado:", err.message);
    return jsonResponse({ error: "Falha ao consultar a IA. Tente novamente." }, 502, ALLOWED_ORIGIN);
  }
}

function jsonResponse(obj, status, allowedOrigin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "Access-Control-Allow-Origin": allowedOrigin },
  });
}
