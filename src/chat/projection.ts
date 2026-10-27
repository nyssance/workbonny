// Projects `@alwith/api/session` turns into the presentation blocks `@alwith/module-chat` renders.
// Session folding stays in @alwith/api; this file only maps shapes and owns no state.
import type { Turn, TurnEntry } from "@alwith/api/session"
import type { ChatMessage, ContentBlock, PlanEntry } from "@alwith/module-chat/types"

type Block = { type: string; text?: string }

export function plainText(content: readonly Block[]): string {
  return content.map((block) => (block.type === "text" ? (block.text ?? "") : "")).join("")
}

function entryBlocks(entry: TurnEntry): ContentBlock[] {
  switch (entry.kind) {
    case "assistant":
      return [{ type: "text", text: plainText(entry.content as Block[]) }]
    case "thought":
      return [{ type: "thinking", id: entry.id, thinking: plainText(entry.content as Block[]), startedAt: entry.at, isComplete: true }]
    case "tool": {
      const own: ContentBlock = {
        type: "tool_use",
        id: entry.id,
        name: entry.name ?? entry.title ?? "tool",
        title: entry.title ?? entry.name ?? "",
        kind: entry.toolKind ?? "other",
        status: entry.status ?? "pending",
        content: entry.content,
        locations: entry.locations,
        rawInput: (entry.rawInput as Record<string, unknown> | null) ?? {},
        rawOutput: entry.rawOutput
      }
      const children = entry.children.flatMap((child) =>
        entryBlocks(child).map((block) => (block.type === "tool_use" ? { ...block, parentToolUseId: entry.id } : block))
      )
      return [own, ...children]
    }
    case "plan": {
      const entries = (entry.plan as { entries?: PlanEntry[] }).entries
      return entries ? [{ type: "plan", entries }] : []
    }
    default:
      return []
  }
}

export function assistantMessage(turn: Turn, index: number, streaming: boolean): ChatMessage {
  return {
    id: turn.prompt?.id ?? `turn-${index}`,
    role: "assistant",
    content: turn.entries.flatMap(entryBlocks),
    timestamp: turn.startedAt ?? Date.now(),
    streaming,
    startedAt: turn.startedAt ?? undefined,
    completedAt: turn.endedAt ?? undefined,
    durationMs: turn.startedAt && turn.endedAt ? turn.endedAt - turn.startedAt : undefined
  }
}
