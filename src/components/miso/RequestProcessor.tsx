import { useEffect, useState } from "react";

const PHASES = [
  "Understanding your request...",
  "Finding the right MISO data...",
  "Retrieving results...",
];

export function RequestProcessor() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1100),
      setTimeout(() => setPhase(2), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      <span key={phase} className="animate-fade text-[14.5px] text-muted-foreground">
        {PHASES[phase]}
      </span>
    </div>
  );
}
