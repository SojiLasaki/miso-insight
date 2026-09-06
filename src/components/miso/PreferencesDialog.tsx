import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPreferences, savePreferences } from "@/lib/miso.functions";

interface Prefs {
  output_format: string;
  units: string;
  region: string;
  always_show_api: boolean;
}

const DEFAULTS: Prefs = {
  output_format: "auto",
  units: "MW",
  region: "MISO",
  always_show_api: false,
};

export function PreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const load = useServerFn(getPreferences);
  const save = useServerFn(savePreferences);

  useEffect(() => {
    if (!open) return;
    load().then(setPrefs).catch(() => undefined);
  }, [open, load]);

  const commit = async () => {
    try {
      await save({ data: prefs });
      toast.success("Preferences saved");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save your preferences");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[19px] font-medium tracking-tight">Preferences</DialogTitle>
          <DialogDescription className="text-[13.5px]">
            These shape how results are presented. Credentials are never stored in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-[13px]">Preferred output</Label>
            <Select
              value={prefs.output_format}
              onValueChange={(v) => setPrefs((p) => ({ ...p, output_format: v }))}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Let MISO AI decide</SelectItem>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="summary">Short summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Units</Label>
              <Select value={prefs.units} onValueChange={(v) => setPrefs((p) => ({ ...p, units: v }))}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MW">MW</SelectItem>
                  <SelectItem value="GW">GW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Region</Label>
              <Select value={prefs.region} onValueChange={(v) => setPrefs((p) => ({ ...p, region: v }))}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["MISO", "North", "Central", "South", "Indiana", "Michigan", "Louisiana"].map(
                    (r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <p className="text-[13.5px]">Always show API details</p>
              <p className="text-[12.5px] text-muted-foreground">
                Include the request and code with every answer.
              </p>
            </div>
            <Switch
              checked={prefs.always_show_api}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, always_show_api: v }))}
            />
          </div>
        </div>

        <Button onClick={() => void commit()} className="w-full rounded-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
