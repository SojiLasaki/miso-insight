import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, PanelLeft, Plus } from "lucide-react";

import { ChatInterface } from "@/components/miso/ChatInterface";
import { DetailsPanel } from "@/components/miso/DetailsPanel";
import { History, type ConversationSummary } from "@/components/miso/History";
import { PreferencesDialog } from "@/components/miso/PreferencesDialog";
import { UserMenu } from "@/components/miso/UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteConversation,
  getMisoAccessStatus,
  listConversations,
} from "@/lib/miso.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MISO AI — Ask for the information, we'll find the MISO data" },
      {
        name: "description",
        content:
          "MISO AI is a natural-language interface to MISO load, prices, generation, market reports and APIs. Just ask — no endpoints or terminology required.",
      },
      { property: "og:title", content: "MISO AI — Find MISO data without learning how to find it" },
      {
        property: "og:description",
        content:
          "Ask for MISO load, market prices, generation, reports or API requests in plain language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [misoConnected, setMisoConnected] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [latestResponse, setLatestResponse] = useState<MisoResponse | null>(null);

  const fetchList = useServerFn(listConversations);
  const fetchAccess = useServerFn(getMisoAccessStatus);
  const removeConversation = useServerFn(deleteConversation);

  const refresh = useCallback(() => {
    if (!user) return;
    fetchList()
      .then(setConversations)
      .catch(() => undefined);
  }, [fetchList, user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMisoConnected(false);
      return;
    }
    refresh();
    fetchAccess()
      .then((s) => setMisoConnected(s.connected))
      .catch(() => undefined);
  }, [user, refresh, fetchAccess]);

  const onDelete = async (id: string) => {
    await removeConversation({ data: { id } });
    if (conversationId === id) setConversationId(null);
    refresh();
  };

  const sidebar = (
    <History
      conversations={conversations}
      activeId={conversationId}
      onSelect={(id) => {
        setConversationId(id);
        setSheetOpen(false);
      }}
      onNew={() => {
        setConversationId(null);
        setSheetOpen(false);
      }}
      onDelete={(id) => void onDelete(id)}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {user && (
        <aside className="hidden h-screen w-[248px] shrink-0 overflow-hidden border-r bg-sidebar md:block">
          <div className="px-5 pt-5">
            <p className="text-[14.5px] font-medium tracking-tight">MISO AI</p>
          </div>
          {sidebar}
        </aside>
      )}

      <div className="flex h-screen min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {user && (
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open history">
                    <PanelLeft className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] bg-sidebar p-0">
                  <SheetTitle className="px-5 pt-5 text-[14.5px] font-medium">MISO AI</SheetTitle>
                  {sidebar}
                </SheetContent>
              </Sheet>
            )}
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-medium tracking-tight">MISO AI</p>
              <p className="hidden truncate text-[12.5px] text-muted-foreground sm:block">
                Find MISO data without learning how to find it.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && misoConnected && (
              <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[12px] text-muted-foreground sm:inline-flex">
                <Check className="size-3 text-success" />
                MISO API Access
              </span>
            )}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="New request"
                onClick={() => setConversationId(null)}
                className="md:hidden"
              >
                <Plus className="size-4" />
              </Button>
            )}
            {loading ? null : user ? (
              <UserMenu
                email={user.email ?? ""}
                misoConnected={misoConnected}
                onSignOut={() => void signOut()}
                onPreferences={() => setPrefsOpen(true)}
              />
            ) : (
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <ChatInterface
            authed={Boolean(user)}
            conversationId={conversationId}
            onConversationStarted={(id) => {
              setConversationId(id);
              refresh();
            }}
            onRequireAuth={() => void navigate({ to: "/auth" })}
            onLatestResponse={setLatestResponse}
          />

          {latestResponse && (
            <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l bg-card/40 px-5 py-6 lg:block">
              <DetailsPanel response={latestResponse} />
            </aside>
          )}
        </div>
      </div>


      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
    </div>
  );
}
