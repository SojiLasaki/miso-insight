export const DEFAULT_SUGGESTIONS = [
  "What was the actual load yesterday?",
  "Show me today's market prices.",
  "Find the latest market report.",
  "Give me the API for actual load data.",
  "What were the power results for Indiana?",
];

export function Suggestion({
  text,
  onSelect,
}: {
  text: string;
  onSelect: (text: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(text)}
      className="rounded-full border border-transparent px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
    >
      {text}
    </button>
  );
}
