import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MisoParameterSpec } from "@/lib/miso/types";

export function ParameterEditor({
  specs,
  values,
  onChange,
}: {
  specs: MisoParameterSpec[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (!specs.length) {
    return (
      <p className="text-[13px] text-muted-foreground">
        This source doesn't take any parameters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {specs.map((spec) => {
        const missing = spec.required && !values[spec.name];
        return (
          <div key={spec.name} className="space-y-1.5">
            <Label htmlFor={spec.name} className="text-[13px]">
              {spec.label}
              {spec.required && <span className="ml-1 text-muted-foreground">required</span>}
            </Label>
            <Input
              id={spec.name}
              type={spec.type === "date" ? "date" : "text"}
              value={values[spec.name] ?? ""}
              placeholder={spec.example ?? ""}
              onChange={(e) => onChange(spec.name, e.target.value)}
              className={missing ? "rounded-lg border-destructive/60" : "rounded-lg"}
            />
            <p className="text-[12px] text-muted-foreground">{spec.description}</p>
            {missing && (
              <p className="text-[12px] text-destructive">{spec.label} is required.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
