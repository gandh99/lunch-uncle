/**
 * Validation for the POST /chat body.
 *
 * history comes from the browser, so it is untrusted: only plain user and
 * assistant turns are allowed (no system or tool messages), each turn is
 * size-capped, and only the most recent turns are kept so a long chat
 * cannot grow the model's input without limit.
 */

export const MAX_MESSAGE_CHARS = 1000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_HISTORY_CONTENT_CHARS = 2000;

const ALLOWED_ROLES = new Set(["user", "assistant"]);

/**
 * Check a parsed /chat body.
 *
 * Returns { error } when the body is invalid, otherwise { history, message }
 * with history reduced to clean {role, content} pairs.
 */
export function validateChatBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Body must be a JSON object" };
  }

  const { history = [], message } = body;

  if (typeof message !== "string" || message.trim() === "") {
    return { error: "message is required" };
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return { error: `message must be at most ${MAX_MESSAGE_CHARS} characters` };
  }

  if (!Array.isArray(history)) {
    return { error: "history must be an array" };
  }

  const clean = [];
  for (const entry of history) {
    if (entry === null || typeof entry !== "object") {
      return { error: "history entries must be objects" };
    }
    const { role, content } = entry;
    if (!ALLOWED_ROLES.has(role)) {
      return { error: "history roles must be user or assistant" };
    }
    if (typeof content !== "string") {
      return { error: "history content must be a string" };
    }
    if (content.length > MAX_HISTORY_CONTENT_CHARS) {
      return {
        error: `history entries must be at most ${MAX_HISTORY_CONTENT_CHARS} characters`,
      };
    }
    clean.push({ role, content });
  }

  return { history: clean.slice(-MAX_HISTORY_MESSAGES), message };
}
