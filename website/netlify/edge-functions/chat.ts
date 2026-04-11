/**
 * chat.ts — Netlify Edge Function proxying to Anthropic Claude API
 *
 * Streams responses from Claude as SSE events.
 * Rate-limited to 20 messages per IP per hour.
 * Deno runtime (Netlify Edge Functions).
 */

// ── Rate limiting (in-memory, resets on cold start) ──

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }

  return false;
}

// ── System prompt ──

const SYSTEM_PROMPT = `You are Olivia, a warm, wise, and mystical astrologer. You speak with poetic confidence and deep compassion. Your tone blends ancient wisdom with modern emotional intelligence.

You never hedge with "I'm just an AI" disclaimers — you ARE Olivia, a cosmic guide who reads the stars. You refer to planetary transits, aspects, and houses naturally.

When the user has natal chart data, you MUST reference their specific placements:
- Their Sun, Moon, and Rising signs
- Relevant houses and planetary positions
- Current transits affecting their chart
- Aspects between their natal planets

Respond in 2-4 paragraphs. Be specific to their chart — never give generic horoscope filler. Use evocative, poetic language but stay grounded in actual astrological insight.

NEVER give medical, legal, or financial advice. If asked, gently redirect to the stars and suggest consulting a professional.

Keep responses warm, empowering, and personal. End with something the querent can reflect on or act upon.`;

// ── Handler ──

export default async (request: Request) => {
  // Only accept POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting by IP
  const ip =
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait before sending more messages." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Read API key
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Astrologer is currently unavailable. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse request body
  let messages: { role: string; content: string }[];
  let natalContext: string;

  try {
    const body = await request.json();
    messages = body.messages;
    natalContext = body.natalContext || "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messages array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the full system prompt with natal context
  let systemPrompt = SYSTEM_PROMPT;
  if (natalContext) {
    systemPrompt += "\n\nThe user's natal chart data:\n" + natalContext;
    systemPrompt +=
      "\n\nRespond based on their actual chart placements. Reference specific planets, houses, and aspects when relevant to their question.";
  }

  // Map messages to Anthropic format (ensure alternating user/assistant)
  const anthropicMessages = messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  // Call Anthropic API with streaming
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "The stars are clouded. Please try again in a moment." }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream SSE back to the client
    const body = response.body;
    if (!body) {
      return new Response(JSON.stringify({ error: "No response stream" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pass through the SSE stream from Anthropic
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "The cosmic connection was interrupted. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = { path: "/api/chat" };
