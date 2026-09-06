import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MisoResponse } from "./miso/types";

const AskInput = z.object({
  question: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().nullable().optional(),
});

export interface AskResult {
  conversation_id: string;
  response: MisoResponse;
}

/** Runs the full orchestration pipeline and persists the exchange. */
export const askMiso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }): Promise<AskResult> => {
    const { supabase, userId } = context;
    const { runMisoRequest } = await import("./miso/orchestrator.server");

    let conversationId = data.conversation_id ?? null;
    let history: string[] = [];

    if (conversationId) {
      const { data: prior } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);
      history = (prior ?? []).map((m) => `${m.role}: ${m.content}`);
    } else {
      const title = data.question.length > 60 ? `${data.question.slice(0, 57)}...` : data.question;
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = created.id;
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content: data.question,
    });

    const response = await runMisoRequest(data.question, history);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content: response.title ?? response.answer,
      payload: JSON.parse(JSON.stringify(response)),
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { conversation_id: conversationId!, response };
  });

/** Re-runs a plan with edited parameters (used by Canvas). */
export const rerunMisoRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(1),
        conversation_id: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<MisoResponse> => {
    const { runMisoRequest } = await import("./miso/orchestrator.server");
    return runMisoRequest(data.question, []);
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, content, payload, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("conversations").delete().eq("id", data.id);
    return { ok: true };
  });

/** The frontend only ever learns WHETHER MISO access is available. */
export const getMisoAccessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("miso_access_granted, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const { hasLiveMisoCredentials } = await import("./miso/client.server");
    return {
      connected: data?.miso_access_granted ?? true,
      mode: hasLiveMisoCredentials() ? ("live" as const) : ("simulated" as const),
      display_name: data?.display_name ?? null,
    };
  });

const PrefsSchema = z.object({
  output_format: z.string(),
  units: z.string(),
  region: z.string(),
  always_show_api: z.boolean(),
});

export const getPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_preferences")
      .select("output_format, units, region, always_show_api")
      .eq("user_id", context.userId)
      .maybeSingle();
    return (
      data ?? { output_format: "auto", units: "MW", region: "MISO", always_show_api: false }
    );
  });

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrefsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_preferences")
      .upsert({ user_id: context.userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
