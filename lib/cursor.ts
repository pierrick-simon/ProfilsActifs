export interface CursorPayload {
  created_at: string;
  id: string;
}

export interface DecodedCursor {
  createdAt: Date;
  id: string;
}

/**
 * Encodes created_at (ISO timestamp string) and id into an opaque base64 string.
 */
export function encodeCursor(payload: CursorPayload): string {
  if (!payload || typeof payload.created_at !== "string" || typeof payload.id !== "string") {
    throw new Error("Invalid cursor payload: created_at and id must be strings");
  }
  const jsonStr = JSON.stringify({
    created_at: payload.created_at,
    id: payload.id,
  });
  return Buffer.from(jsonStr, "utf-8").toString("base64");
}

/**
 * Decodes and validates an opaque base64 cursor string.
 * Throws an Error if the cursor is invalid, corrupted, or malformed.
 */
export function decodeCursor(cursorStr: string): DecodedCursor {
  if (typeof cursorStr !== "string" || cursorStr.trim() === "") {
    throw new Error("Cursor must be a non-empty string");
  }

  let jsonStr: string;
  try {
    jsonStr = Buffer.from(cursorStr, "base64").toString("utf-8");
  } catch {
    throw new Error("Malformed cursor: failed to decode base64");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Malformed cursor: invalid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Malformed cursor: expected JSON object");
  }

  const { created_at, id } = parsed as Record<string, unknown>;

  if (typeof created_at !== "string" || typeof id !== "string" || id.trim() === "") {
    throw new Error("Malformed cursor: missing or invalid created_at or id");
  }

  const date = new Date(created_at);
  if (isNaN(date.getTime())) {
    throw new Error("Malformed cursor: invalid ISO timestamp in created_at");
  }

  return {
    createdAt: date,
    id,
  };
}
