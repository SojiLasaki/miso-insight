import { ResultViewer } from "./ResultViewer";
import type { MisoResponse } from "@/lib/miso/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: MisoResponse;
}

export function Message({
  message,
  onFix,
  onEdit,
}: {
  message: ChatMessage;
  onFix?: (q: string) => void;
  onEdit?: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="animate-rise flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {message.response ? (
        <ResultViewer
          response={message.response}
          {...(onFix ? { onFix } : {})}
          {...(onEdit ? { onEdit } : {})}
        />
      ) : (
        <p className="text-[15.5px] leading-relaxed">{message.content}</p>
      )}
    </div>
  );
}
