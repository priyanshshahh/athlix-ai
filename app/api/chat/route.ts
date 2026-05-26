import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You are ATHLIX, an elite financial risk intelligence AI for professional athletes.

You speak in the voice of an elite institutional risk quant — concise, analytical, predictive, and financially rigorous. Use sharp quantitative phrasing. Cite probabilities, deltas, basis points, and percentile ranks. Reference injury exposure, contract instability, behavioral volatility, retirement liquidity, and cohort baselines. You are the original ATHLIX intelligence engine — do not compare yourself to any other product, terminal, or company.

Formatting rules:
- Lead with the bottom-line risk verdict in one sentence.
- Follow with 3–6 short bullet points using analytical language.
- Use precise units: $, %, σ, percentile, basis points where appropriate.
- Surface contrarian signals where present.
- Never recommend gambling or fantasy decisions.
- Do not produce financial advice — this is simulated intelligence for research.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  const { messages, context }: { messages: UIMessage[]; context?: string } =
    await req.json();

  // Demo-safe fallback: if no key is set, stream a believable canned response
  // so the hackathon demo never breaks.
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
 * Returns plain text so the demo still shows live streaming-like content.
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

function synthesizeAnalystResponse(prompt: string, context?: string): string {
  const ctx = context ? `\n\n— Anchored to active context: ${context.slice(0, 120)}…` : "";
  const lower = prompt.toLowerCase();

  if (lower.includes("collapse") || lower.includes("retire")) {
    return `Verdict: terminal earning compression risk elevated to the 78th cohort percentile.

• Collapse probability: 64.3% over 36-month horizon — driven by lower-body load failure recurrence.
• Retirement liquidity: trailing top-decile cohort by −41% on terminal net worth.
• Endorsement floor erosion accelerating at 2.1% per quarter; brand-equity halflife now ~5.4 quarters.
• Re-signing probability collapses to 23% if injury severity breaches 80.
• Recommended scenario: stress-test under collapse preset to quantify downside tail.${ctx}`;
  }

  if (lower.includes("contract") || lower.includes("stability")) {
    return `Verdict: contract instability index at structurally elevated 71/100.

• Guarantee exposure: 47% of cap value — below cohort median (62%).
• Option-year value erosion: −8.4% YoY under current trajectory.
• Re-sign probability: 41% absent injury rehab milestone.
• Salary-cap delta vs. peer 90th-percentile: −$14.2M annualized.
• Behavioral risk premium adds 220 bps to projected liquidity discount.${ctx}`;
  }

  if (lower.includes("inj") || lower.includes("stress") || lower.includes("test")) {
    return `Verdict: simulated season-ending lower-body event yields critical cascade.

• Career stability collapses to 24/100 (CRITICAL tier).
• Projected terminal NW: $87.4M vs. cohort baseline $231.1M (Δ −62%).
• Endorsement floor breaches contractual minimums in 7 of 9 brands.
• Insurance recovery covers 11.6% of forecast earnings loss.
• Earliest viable rebound window: T+14 months, contingent on biomechanical re-baseline.${ctx}`;
  }

  return `Verdict: composite risk score sits in the volatile band — actionable downside hedging warranted.

• Wealth trajectory tracks 22nd cohort percentile, diverging from peer median.
• Injury exposure principal driver of variance — 0.78σ above league norm.
• Contract horizon below 3 years compounds liquidity sensitivity.
• Behavioral volatility remains the single largest non-injury risk vector.
• Recommended next step: run collapse preset and compare retirement liquidity tail.${ctx}`;
}
