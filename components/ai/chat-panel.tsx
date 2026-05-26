"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  Cpu,
  Send,
  Sparkles,
  Square,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  playerName: string;
  context: string;
};

const SUGGESTIONS = [
  "What is the collapse probability over the next 36 months?",
  "Stress test for season-ending lower-body injury.",
  "Compare retirement liquidity to top-decile cohort.",
  "Quantify contract instability premium right now.",
];

export function ChatPanel({ playerName, context }: Props) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ context }),
      }),
    [context],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const busy = status === "streaming" || status === "submitted";

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <span className="absolute inset-0 rounded-2xl animate-pulse-glow" />
            <span className="relative inline-flex items-center gap-2 rounded-2xl glow-button px-4 py-3 shadow-2xl">
              <Bot className="h-5 w-5" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                ATHLIX Intelligence
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 flex h-[80vh] max-h-[720px] w-[min(420px,calc(100vw-2rem))] flex-col glass-card-strong neon-border-cyan overflow-hidden"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Cpu className="h-5 w-5 text-cyan-300" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-medium text-cyan-100">
                    ATHLIX Intelligence
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">
                    DeepSeek · live stream · {playerName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-cyan-200"
                aria-label="Close ATHLIX Intelligence"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-3"
                >
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                      <Sparkles className="h-3 w-3" />
                      INTEL · ATHLIX boot sequence
                    </div>
                    <div className="mt-1.5 text-sm leading-relaxed text-slate-300">
                      Engine online. Real-time risk telemetry locked on{" "}
                      <span className="text-cyan-200">{playerName}</span>. Ask
                      anything — collapse probability, stress scenarios,
                      contract math.
                    </div>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Suggested queries
                  </div>
                  <div className="grid gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.06] hover:text-cyan-100"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                        <span className="leading-snug">{s}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m) => (
                <Message key={m.id} role={m.role} parts={m.parts} />
              ))}

              {status === "submitted" && <TypingIndicator />}
              {error && (
                <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
                  Engine error. Verify <code>OPENROUTER_API_KEY</code> in env.
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="relative border-t border-white/10 bg-black/30 p-3 backdrop-blur"
            >
              <div className="relative flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask ATHLIX Intelligence…"
                  className="flex-1 max-h-32 min-h-[42px] resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_0_4px_rgba(0,229,255,0.08)]"
                />
                {busy ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="danger"
                    onClick={() => stop()}
                    aria-label="Stop stream"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="status-dot" />
                  {busy ? "Streaming…" : "Engine ready · DeepSeek"}
                </span>
                <span>⇧ + ⏎ for newline</span>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Engine analyzing risk vectors
      <span className="animate-blink">▌</span>
    </div>
  );
}

type Part =
  | { type: "text"; text: string }
  | { type: string; [k: string]: unknown };

function Message({
  role,
  parts,
}: {
  role: "user" | "assistant" | "system" | string;
  parts: Part[];
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/15 text-slate-100 border border-cyan-400/30 shadow-[0_0_24px_-12px_rgba(0,229,255,0.7)]"
            : "bg-white/[0.04] border border-white/10 text-slate-200"
        }`}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.32em] text-cyan-300/80">
            <Cpu className="h-3 w-3" />
            ATHLIX
          </div>
        )}
        <div className="whitespace-pre-wrap">
          {parts.map((p, idx) => {
            if (p.type === "text" && typeof p.text === "string") {
              return <span key={idx}>{p.text}</span>;
            }
            return null;
          })}
        </div>
      </div>
    </motion.div>
  );
}
