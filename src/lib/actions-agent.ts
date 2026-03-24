const AGENT_ENDPOINT = "https://my.living-apps.de/actions-agent";
const APPGROUP_ID = "69c25cd0e0a36df678fbf698";

export interface InputSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  format?: string;
  enum?: string[];
}

export interface InputSchema {
  type: "object";
  properties: Record<string, InputSchemaProperty>;
  required?: string[];
}

export interface ActionMetadata {
  title?: string;
  input_schema?: InputSchema;
  output_schema?: Record<string, unknown>;
  description?: string;
}

export interface Action {
  identifier: string;
  title: string;
  description: string;
  app_id: string;
  app_name: string;
  value: string;
  metadata: ActionMetadata | null;
}

export async function fetchActions(): Promise<Action[]> {
  const resp = await fetch(
    `${AGENT_ENDPOINT}/actions?appgroup_id=${APPGROUP_ID}`,
    { credentials: "include" },
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  const flat: Action[] = [];
  for (const app of data.apps || []) {
    for (const action of app.actions || []) {
      flat.push({
        identifier: action.identifier,
        title: action.title || "",
        description: action.description || "",
        app_id: app.app_id,
        app_name: app.app_name,
        value: action.value || "",
        metadata: action.metadata ?? null,
      });
    }
  }
  return flat;
}

export async function executeAction(
  appId: string,
  actionIdentifier: string,
  inputs?: Record<string, unknown>,
  files?: File[],
): Promise<{ stdout: string | null; error: string | null }> {
  let resp: Response;

  if (inputs || (files && files.length > 0)) {
    const formData = new FormData();
    formData.append("app_id", appId);
    formData.append("action_identifier", actionIdentifier);
    if (inputs) formData.append("inputs", JSON.stringify(inputs));
    if (files) {
      for (const file of files) formData.append("files", file);
    }
    resp = await fetch(`${AGENT_ENDPOINT}/execute`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } else {
    resp = await fetch(`${AGENT_ENDPOINT}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ app_id: appId, action_identifier: actionIdentifier }),
    });
  }

  const data = await resp.json();
  return { stdout: data.stdout ?? null, error: data.error ?? null };
}

export async function deleteAction(
  appId: string,
  actionIdentifier: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const resp = await fetch(
      `${AGENT_ENDPOINT}/actions/apps/${appId}/${actionIdentifier}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!resp.ok) {
      const data = await resp.json().catch(() => null);
      return { ok: false, error: data?.detail || `HTTP ${resp.status}` };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function parseDataUri(uri: string): { mimeType: string; data: string } | null {
  const m = uri.match(/^data:([^;]+);base64,(.+)$/s);
  return m ? { mimeType: m[1], data: m[2] } : null;
}

export async function agentChat(
  messages: Array<{ role: string; content: string; image?: string }>,
  threadId: string,
  onContent: (delta: string) => void,
): Promise<void> {
  const resp = await fetch(`${AGENT_ENDPOINT}/copilotkit/agents/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: "klar-agent",
      threadId,
      state: {},
      properties: { appgroup_id: APPGROUP_ID },
      messages: messages.map((m) => {
        const parsed = m.image ? parseDataUri(m.image) : null;
        const content = parsed
          ? [
              { type: "text", text: m.content },
              { type: "binary", mimeType: parsed.mimeType, data: parsed.data },
            ]
          : m.content;
        return {
          id: crypto.randomUUID(),
          role: m.role,
          content,
          createdAt: new Date().toISOString(),
        };
      }),
      actions: [],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Agent API ${resp.status}: ${text.slice(0, 200)}`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === "TextMessageContent") {
          onContent(event.content);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer);
      if (event.type === "TextMessageContent") {
        onContent(event.content);
      }
    } catch {
      // skip
    }
  }
}
