export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleChat(request, env) {
  const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || "https://cuidarseguro.com.br";
  const origin = request.headers.get("Origin") || "";
  if (origin && origin !== ALLOWED_ORIGIN) {
    return jsonResponse({ error: "Origem não autorizada." }, 403, ALLOWED_ORIGIN);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Servidor mal configurado." }, 500, ALLOWED_ORIGIN);
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
