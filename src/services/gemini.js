import { SYSTEM_PROMPT } from "../constants/systemPrompt";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Taken from your key's model list. Tried in order; if one is busy/unavailable the next is used.
const MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-2.5-flash-lite",
];
const ROUNDS = 3;          // go through all models up to 3 times
const TIMEOUT_MS = 45000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callModel(model, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function generateResponse(messages) {
  if (!API_KEY) {
    throw new Error("API key missing. Add VITE_GEMINI_API_KEY in .env.local and restart npm run dev.");
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.3 },
  };

  let lastError = "";

  for (let round = 1; round <= ROUNDS; round++) {
    for (const model of MODELS) {
      console.log(`[Gemini] round=${round} model=${model}`);
      let res;
      try {
        res = await callModel(model, body);
      } catch (e) {
        lastError = e.name === "AbortError" ? `${model} timed out` : e.message;
        console.warn("[Gemini]", lastError);
        continue;
      }

      console.log(`[Gemini] ${model} -> HTTP ${res.status}`);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("");
        if (text) return text;
        lastError = `${model} returned an empty response`;
        continue;
      }

      const err = await res.json().catch(() => ({}));
      lastError = err?.error?.message || `HTTP ${res.status}`;
      console.warn("[Gemini]", model, lastError);

      if (res.status >= 500 || res.status === 404 || res.status === 429) continue; // try next model
      throw new Error(lastError); // 400/401/403: real error
    }
    if (round < ROUNDS) await sleep(4000 * round); // wait 4s, then 8s before next round
  }
  throw new Error(`Gemini is busy right now. Please try again in a few minutes. (${lastError})`);
}