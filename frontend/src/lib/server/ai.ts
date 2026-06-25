import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

const CHAT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ||
  "meta-llama/llama-4-scout-17b-16e-instruct";

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function chatCompletion(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const client = getGroqClient();
  const { temperature = 0.7, maxTokens = 1024, jsonMode = false } = options;

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return response.choices[0]?.message?.content || "";
}

export async function visionCompletion(
  prompt: string,
  imageBase64List: string[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const client = getGroqClient();
  const { temperature = 0.4, maxTokens = 1500, jsonMode = false } = options;

  const content: Groq.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: prompt },
    ...imageBase64List.map(
      (b64): Groq.Chat.ChatCompletionContentPartImage => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${b64}` },
      })
    ),
  ];

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [{ role: "user", content }],
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return response.choices[0]?.message?.content || "";
}

export function extractJson(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error(`Could not extract JSON: ${cleaned.slice(0, 200)}`);
  }
}
