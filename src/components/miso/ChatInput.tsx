import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about MISO data, markets, load, prices, generation, reports, or APIs...",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className={cn(
        "flex items-end gap-2 rounded-3xl border bg-card px-4 py-3 transition-all duration-300",
        focused ? "border-border-strong shadow-lift" : "shadow-soft",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label="Ask about MISO data"
        className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[16px] leading-relaxed outline-none placeholder:text-muted-foreground/80"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send request"
        className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-25"
      >
        <ArrowUp className="size-4" />
      </button>
    </form>
  );
}
