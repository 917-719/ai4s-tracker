const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" } | { type: "text" };
}

/** 调用 DeepSeek V4 Chat Completion */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const { model = "deepseek-chat", temperature = 0.3, max_tokens = 2048, response_format } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens,
    stream: false,
  };
  if (response_format) {
    body.response_format = response_format;
  }

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API returned empty response");
  }
  return content;
}

/** 批量调用 — 多条内容塞进一个 user message，减少请求数 */
export async function batchChatCompletion(
  systemPrompt: string,
  items: string[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const batchSize = 6;
  const results: string[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const userContent = batch
      .map((item, idx) => `[${i + idx + 1}]\n${item}`)
      .join("\n\n---\n\n");

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const result = await chatCompletion(messages, {
      ...options,
      max_tokens: Math.min(batchSize * 800, 4096),
    });
    results.push(result);
  }

  return results.join("\n\n");
}
