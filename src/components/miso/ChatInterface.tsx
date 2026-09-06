import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ChatInput } from "./ChatInput";
import { Message, type ChatMessage } from "./Message";
import { RequestProcessor } from "./RequestProcessor";
import { DEFAULT_SUGGESTIONS, Suggestion } from "./Suggestion";
import { askMiso, getConversation } from "@/lib/miso.functions";
import { setLastResponse } from "@/lib/miso/session-store";
import type { MisoResponse } from "@/lib/miso/types";

export function ChatInterface({
  authed,
  conversationId,
  onConversationStarted,
  onRequireAuth,
  onLatestResponse,
}: {
  authed: boolean;
  conversationId: string | null;
  onConversationStarted: (id: string) => void;
  onRequireAuth: (pendingQuestion: string) => void;
  onLatestResponse?: (response: MisoResponse | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const ask = useServerFn(askMiso);
  const loadConversation = useServerFn(getConversation);

  useEffect(() => {
    let cancelled = false;
    if (!conversationId || !authed) {
      setMessages([]);
      onLatestResponse?.(null);
      return;
    }
    loadConversation({ data: { id: conversationId } })
      .then((rows) => {
        if (cancelled) return;
        const mapped = rows.map((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          content: r.content,
          ...(r.payload ? { response: r.payload as unknown as MisoResponse } : {}),
        }));
        setMessages(mapped);
        const last = [...mapped].reverse().find((m) => m.response)?.response ?? null;
        onLatestResponse?.(last);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationId, authed, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || busy) return;
      if (!authed) {
        onRequireAuth(trimmed);
        return;
      }

      setValue("");
      setMessages((prev) => [
        ...prev,
        { id: `local_${Date.now()}`, role: "user", content: trimmed },
      ]);
      setBusy(true);

      try {
        const result = await ask({
          data: { question: trimmed, conversation_id: conversationId },
        });
        if (!conversationId) onConversationStarted(result.conversation_id);
        setLastResponse(result.response);
        setMessages((prev) => [
          ...prev,
          {
            id: result.response.request_id,
            role: "assistant",
            content: result.response.title ?? result.response.answer,
            response: result.response,
          },
        ]);
      } catch {
        toast.error("Something interrupted that request. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [ask, authed, busy, conversationId, onConversationStarted, onRequireAuth],
  );

  const empty = messages.length === 0;

  if (empty) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 pb-20 pt-10">
        <div className="animate-rise text-center">
          <h2 className="text-[clamp(1.9rem,5vw,2.75rem)] font-medium leading-tight tracking-tight">
            What can I help you find?
          </h2>
        </div>
        <div className="animate-rise mt-8">
          <ChatInput
            value={value}
            onChange={setValue}
            onSubmit={() => void send(value)}
            disabled={busy}
            autoFocus
          />
        </div>
        <div className="animate-fade mt-6 flex flex-wrap justify-center gap-1.5">
          {DEFAULT_SUGGESTIONS.map((s) => (
            <Suggestion key={s} text={s} onSelect={(t) => void send(t)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-10">
          {messages.map((m) => (
            <Message
              key={m.id}
              message={m}
              onFix={(q) => void send(q)}
              onEdit={() => navigate({ to: "/canvas" })}
            />
          ))}
          {busy && <RequestProcessor />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-5 pt-3">
        <div className="mx-auto w-full max-w-2xl px-5">
          <ChatInput
            value={value}
            onChange={setValue}
            onSubmit={() => void send(value)}
            disabled={busy}
            placeholder="Ask a follow-up..."
          />
        </div>
      </div>
    </div>
  );
}
