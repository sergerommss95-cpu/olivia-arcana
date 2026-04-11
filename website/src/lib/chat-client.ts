/**
 * chat-client.ts — Streaming SSE client for the Olivia AI chat
 *
 * Async generator that POSTs to /api/chat and yields text delta tokens
 * as they arrive from the Anthropic streaming API via the edge function.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stream chat responses from the edge function.
 * Yields text deltas as they arrive.
 * Throws on network or API errors.
 */
export async function* streamChat(
  messages: ChatMessage[],
  natalContext: string,
): AsyncGenerator<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, natalContext }),
  });

  if (!response.ok) {
    let errorMsg = "The stars are unreachable right now.";
    try {
      const errBody = await response.json();
      if (errBody.error) errorMsg = errBody.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream available");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events from buffer
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        // SSE data lines start with "data: "
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6).trim();

        // End of stream marker
        if (data === "[DONE]") return;

        try {
          const event = JSON.parse(data);

          // Anthropic streaming events:
          // - content_block_delta with delta.type === "text_delta"
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            event.delta?.text
          ) {
            yield event.delta.text;
          }

          // Check for stop event
          if (event.type === "message_stop") {
            return;
          }

          // Check for errors in stream
          if (event.type === "error") {
            throw new Error(event.error?.message || "Stream error");
          }
        } catch (e) {
          // Skip non-JSON lines (like event: type lines)
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
