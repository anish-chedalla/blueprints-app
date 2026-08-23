type ToolCallDelta = {
  index?: number;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type CompletedToolCall = {
  name: string;
  arguments: string;
};

export class OpenAiSseAccumulator {
  private buffer = "";
  private responseText = "";
  private readonly toolCalls = new Map<number, CompletedToolCall>();

  push(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      this.consumeLine(line.replace(/\r$/, ""));
    }
  }

  finish(): void {
    if (this.buffer.trim()) {
      this.consumeLine(this.buffer.replace(/\r$/, ""));
    }
    this.buffer = "";
  }

  get text(): string {
    return this.responseText;
  }

  get completedToolCalls(): CompletedToolCall[] {
    return [...this.toolCalls.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, call]) => call);
  }

  private consumeLine(line: string): void {
    if (!line.startsWith("data: ")) return;

    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") return;

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      if (typeof delta?.content === "string") {
        this.responseText += delta.content;
      }

      for (const toolCall of (delta?.tool_calls ?? []) as ToolCallDelta[]) {
        const index = toolCall.index ?? 0;
        const current = this.toolCalls.get(index) ?? { name: "", arguments: "" };
        if (toolCall.function?.name) current.name += toolCall.function.name;
        if (toolCall.function?.arguments) current.arguments += toolCall.function.arguments;
        this.toolCalls.set(index, current);
      }
    } catch {
      // Ignore non-JSON SSE events while preserving subsequent events.
    }
  }
}
