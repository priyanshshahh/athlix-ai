import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createRateLimiter, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You are ATHLIX, a risk-analysis assistant for a scenario simulator of professional-athlete financial risk.

Ground every answer in the active scenario context provided below. The numbers in that context come from a deterministic simulator (fixed formulas over user-set inputs), not from a predictive model — describe them as scenario outputs, never as forecasts of real events.

Voice: concise, analytical, quant-flavored. Use precise units ($, %, σ, percentile, basis points) when the context supports them.

Formatting rules:
- Lead with a one-sentence bottom-line read of the current scenario.
- Follow with 3–6 short analytical bullet points.
- Surface contrarian signals where present.
- Never recommend gambling or fantasy decisions.
- This is not financial advice — it is scenario commentary for research.`;

// Per-client limits: chat is expensive (LLM tokens), so keep it tight.
const limiter = createRateLimiter(20, 60_000);

// Loose-but-strict validation: reject malformed/oversized payloads without
// trying to re-derive the AI SDK's full UIMessage type. Caps bound abuse.
const partSchema = z
  .object({ type: z.string().max(64) })
  .passthrough();

const messageSchema = z.object({
  id: z.string().max(200).optional(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(partSchema).max(200),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  context: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  const limit = limiter(clientKey(req));
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", detail: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const { messages, context } = parsed.data as {
    messages: UIMessage[];
    context?: string;
  };

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Demo-safe fallback: if no key is set, stream a clearly-labeled canned
  // response so the demo still shows live streaming without inventing a key.
  if (!apiKey) {
    return new Response(buildDemoStream(messages, context), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const openrouter = createOpenRouter({ apiKey });

  const result = streamText({
    model: openrouter("deepseek/deepseek-chat"),
    messages: await convertToModelMessages(messages),
    system: context ? `${SYSTEM}\n\n=== ACTIVE CONTEXT ===\n${context}` : SYSTEM,
  });

  return result.toUIMessageStreamResponse();
}

/**
 * Demo fallback that emits a UI-message-style SSE stream when no key is set.
 * The response is explicitly labeled as a canned demo — it is not model output.
 */
function buildDemoStream(messages: UIMessage[], context?: string): ReadableStream {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text =
    typeof lastUser?.parts?.[0] === "object" &&
    "text" in (lastUser?.parts?.[0] ?? {})
      ? (lastUser.parts[0] as { text: string }).text
      : "";

  const response = synthesizeAnalystResponse(text, context);

  // Emit as v6 UI-message stream protocol (SSE) so useChat parses parts.
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const id = `msg_${Math.random().toString(36).slice(2, 9)}`;
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      send({ type: "start", messageId: id });
      send({ type: "start-step" });
      send({ type: "text-start", id: "t1" });

      const chunks = response.match(/[\s\S]{1,18}/g) ?? [response];
      for (const c of chunks) {
        send({ type: "text-delta", id: "t1", delta: c });
        await new Promise((r) => setTimeout(r, 18));
      }
      send({ type: "text-end", id: "t1" });
      send({ type: "finish-step" });
      send({ type: "finish" });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

const DEMO_LABEL =
  "[DEMO MODE — no OPENROUTER_API_KEY set. This is a canned template response, not live model output.]\n\n";

function synthesizeAnalystResponse(prompt: string, context?: string): string {
  const ctx = context ? `\n\n— Anchored to active scenario context: ${context.slice(0, 120)}…` : "";
  const lower = prompt.toLowerCase();

  if (lower.includes("collapse") || lower.includes("retire")) {
    return `${DEMO_LABEL}Read: under the current scenario inputs, the simulator flags elevated terminal earning compression.

• Scenario collapse output is driven by the injury-severity and contract-duration sliders.
• Retirement liquidity trails the synthetic cohort curve in this configuration.
• Endorsement floor erodes as the simulated stability score falls.
• Re-signing assumption weakens sharply once contract duration drops below two years.
• Try the collapse preset to see the downside tail of the same formulas.${ctx}`;
  }

  if (lower.includes("contract") || lower.includes("stability")) {
    return `${DEMO_LABEL}Read: the contract-instability readout is structurally elevated for these inputs.

• Guarantee exposure and salary-exposure sliders dominate this dial.
• Option-year value erodes under the fixed decay term.
• Re-sign assumption is sensitive to the contract-duration input.
• Behavioral-risk index adds a fixed premium to the liquidity discount.
• Adjust salary exposure to see the dial recompute deterministically.${ctx}`;
  }

  if (lower.includes("inj") || lower.includes("stress") || lower.includes("test")) {
    return `${DEMO_LABEL}Read: raising simulated injury severity produces a sharp scenario cascade.

• Career-stability output drops toward the CRITICAL band.
• Projected terminal net worth diverges from the synthetic cohort baseline.
• Exposure buckets for lower-body load and body composition climb together.
• The wealth curve's post-peak decay steepens with severity.
• This is a what-if of the formulas, not a prediction of a real injury.${ctx}`;
  }

  return `${DEMO_LABEL}Read: the composite scenario score sits in the volatile band for these inputs.

• Injury severity is the largest single driver of variance in this configuration.
• Short contract horizons compound the liquidity-sensitivity term.
• The behavioral-risk index is a fixed assumption, not a measured stat.
• Percentiles are relative to a synthetic cohort curve, not a real population.
• Move any slider to watch the outputs recompute — same inputs, same outputs.${ctx}`;
}
