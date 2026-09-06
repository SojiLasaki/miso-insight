import { Link } from "@tanstack/react-router";
import { Check, LogOut, Settings2, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserMenu({
  email,
  misoConnected,
  onSignOut,
  onPreferences,
}: {
  email: string;
  misoConnected: boolean;
  onSignOut: () => void;
  onPreferences: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border"
          aria-label="Account menu"
        >
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-[13px]">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-[12px] text-muted-foreground">MISO API Access</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px]">
            {misoConnected ? (
              <>
                <Check className="size-3.5 text-success" />
                Connected
              </>
            ) : (
              "Not authorized"
            )}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPreferences}>
          <Settings2 className="size-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/canvas">Open Canvas</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
