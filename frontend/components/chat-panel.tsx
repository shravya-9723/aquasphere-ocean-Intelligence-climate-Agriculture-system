"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { AskResponse } from "@/lib/types";


interface ChatPanelProps {
  busy: boolean;
  error: string | null;
  onSubmit: (question: string, options: ChatOptions) => Promise<AskResponse>;
  regionName: string | null;
  onClearRegionContext?: () => void;
}

export interface ChatOptions {
  explanationMode: "student" | "researcher";
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  meta?: string;
  response?: AskResponse;
}

const PROMPTS = [
  "What is AquaSphere and what does this project do?",
  "Which regions are most affected by ocean warming right now?",
  "Explain how ocean heat can affect crop yield in simple terms.",
  "How would you improve marine food security in the next five years?",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}


export function ChatPanel({ busy, error, onSubmit, regionName, onClearRegionContext }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [explanationMode, setExplanationMode] = useState<"student" | "researcher">("student");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "AquaSphere is an intelligent ocean exploration and analysis system. It combines immersive visualization with AI-powered insights to help you understand ocean conditions, environmental change, climate impact, marine biodiversity, pollution pressure, and ecosystem health more clearly.",
      meta: regionName ? `Region context ready: ${regionName}` : "General AI mode active",
    },
  ]);

  useEffect(() => {
    setMessages((current) => {
      if (!current.length || current[0].id !== "welcome") {
        return current;
      }
      const next = [...current];
      next[0] = {
        ...next[0],
        meta: regionName ? `Region context ready: ${regionName}` : "General AI mode active",
      };
      return next;
    });
  }, [regionName]);

  const latestResponse = [...messages].reverse().find((message) => message.response)?.response;

  const starterCards = useMemo(
    () =>
      PROMPTS.map((prompt) => ({
        prompt,
        short: prompt.replace("right now", "").replace("in simple terms", "").trim(),
      })),
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || busy) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");

    try {
      const result = await onSubmit(trimmed, { explanationMode });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        meta: `Confidence ${Math.round(result.confidence * 100)}% - ${result.sources.join(", ")}`,
        response: result,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch {}
  }

  function exportAiCsv() {
    if (!latestResponse) {
      return;
    }
    downloadCsv(
      "aquasphere-ai-answer.csv",
      ["Section", "Content"],
      [
        ["Answer", latestResponse.answer],
        ["Summary", latestResponse.summary],
        ["Analysis", latestResponse.analysis],
        ["Suggested Action", latestResponse.suggested_action],
        ["Sources", latestResponse.sources.join(", ")],
        ["Confidence", `${Math.round(latestResponse.confidence * 100)}%`],
      ],
    );
  }

  function exportAiDoc() {
    if (!latestResponse) {
      return;
    }
    const rows = [
      ["Answer", latestResponse.answer],
      ["Summary", latestResponse.summary],
      ["Analysis", latestResponse.analysis],
      ["Suggested Action", latestResponse.suggested_action],
      ["Why This Answer", latestResponse.why_this_answer.join(" | ")],
      ["Sources", latestResponse.sources.join(", ")],
      ["Confidence", `${Math.round(latestResponse.confidence * 100)}%`],
    ]
      .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
      .join("");
    const html = `
      <html>
        <head>
          <title>AquaSphere AI Answer</title>
          <style>
            body { font-family: Arial, sans-serif; color: #10202f; padding: 28px; }
            h1 { margin: 0 0 8px; }
            p { color: #425466; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #d8e2ea; padding: 10px; text-align: left; vertical-align: top; }
            th { width: 25%; background: #edf7fb; }
          </style>
        </head>
        <body>
          <h1>AquaSphere AI Answer</h1>
          <p>${escapeHtml(regionName ? `Region context: ${regionName}` : "General AI mode")}</p>
          <table>${rows}</table>
        </body>
      </html>
    `;
    const url = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "aquasphere-ai-answer.doc";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="glass-panel rounded-[30px] p-0 shadow-glow">
      <div className="chat-shell">
        <div className="chat-topbar">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/55">AquaSphere AI</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Ocean intelligence with normal generative AI</h3>
          </div>
          <div className="chat-status">
            <span className="status-dot bg-emerald-300 text-emerald-300" />
            <span>{regionName ? `Region-aware for ${regionName}` : "General mode with optional region context"}</span>
          </div>
        </div>

        {regionName && onClearRegionContext ? (
          <div className="mx-5 flex justify-end">
            <button
              className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-xs text-cyan-50/75"
              onClick={onClearRegionContext}
              type="button"
            >
              Use general AI only
            </button>
          </div>
        ) : null}

        <div className="mx-5 rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4 text-sm leading-7 text-cyan-50/74">
          AquaSphere is like a digital brain for the ocean. It helps you explore ocean regions, understand environmental changes, and get clearer AI explanations about climate impact, marine biodiversity, pollution levels, and ecosystem health.
        </div>

        <div className="mx-5 rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
            {(["student", "researcher"] as const).map((mode) => (
              <button
                className={`rounded-full border px-4 py-2 text-sm ${explanationMode === mode ? "border-cyan-200/40 bg-cyan-200/15 text-white" : "border-cyan-100/10 bg-white/5 text-cyan-50/72"}`}
                key={mode}
                onClick={() => setExplanationMode(mode)}
                type="button"
              >
                Explain like {mode === "student" ? "student" : "researcher"}
              </button>
            ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/72 disabled:opacity-40" disabled={!latestResponse} onClick={exportAiCsv} type="button">
                Export AI CSV
              </button>
              <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/72 disabled:opacity-40" disabled={!latestResponse} onClick={exportAiDoc} type="button">
                Export AI DOC
              </button>
            </div>
          </div>
        </div>

        <div className="chat-starters">
          {starterCards.map((item) => (
            <button
              key={item.prompt}
              className="chat-starter-card"
              onClick={() => setQuestion(item.prompt)}
              type="button"
            >
              <span className="chat-starter-label">Prompt</span>
              <span className="chat-starter-text">{item.short}</span>
            </button>
          ))}
        </div>

        <div className="chat-feed">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chat-bubble ${message.role === "assistant" ? "chat-bubble-assistant" : "chat-bubble-user"}`}
            >
              <div className="chat-bubble-head">
                <span>{message.role === "assistant" ? "AquaSphere AI" : "You"}</span>
                {message.meta ? <span>{message.meta}</span> : null}
              </div>
              <p className="chat-bubble-copy whitespace-pre-line">{message.content}</p>
              {message.response ? <PremiumAnswer response={message.response} /> : null}
            </article>
          ))}

          {busy ? (
            <article className="chat-bubble chat-bubble-assistant">
              <div className="chat-bubble-head">
                <span>AquaSphere AI</span>
                <span>Thinking</span>
              </div>
              <div className="chat-thinking">
                <span />
                <span />
                <span />
              </div>
            </article>
          ) : null}
        </div>

        {error ? (
          <div className="mx-5 mb-4 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4 text-sm text-orange-100">
            {error}
          </div>
        ) : null}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Message AquaSphere AI about oceans, climate, biodiversity, coding, research, business, trade, or anything else..."
            rows={4}
            value={question}
          />
          <div className="chat-composer-footer">
            <p className="text-sm text-cyan-50/60">
              {regionName
                ? `Using ${regionName} as optional context when helpful.`
                : "No region is forced right now. Ask general questions normally, or pick a map region first."}
            </p>
            <button className="sea-button rounded-full px-5 py-3 text-sm font-semibold" disabled={busy} type="submit">
              {busy ? "Generating..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function PremiumAnswer({ response }: { response: AskResponse }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <AnswerSection title="Summary" text={response.summary} />
        <AnswerSection title="Analysis" text={response.analysis} />
        <AnswerSection title="Suggested action" text={response.suggested_action} />
        <AnswerSection title="Why this answer" items={response.why_this_answer} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {response.risk_cards.map((card) => (
          <div className="rounded-[18px] border border-cyan-100/10 bg-slate-950/25 p-3" key={card.name}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">{card.name}</p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-cyan-50/70">{card.level}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-900/70">
              <div className="confidence-bar h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, card.score))}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-cyan-50/66">{card.score}/100 - {card.evidence}</p>
          </div>
        ))}
      </div>

      <AnswerSection title="Risks" items={response.risks} />

      {response.region_comparison.length ? (
        <div className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
          <p className="text-sm font-semibold text-white">Region comparison</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {response.region_comparison.map((item) => (
              <div className="rounded-[16px] border border-cyan-100/8 bg-white/[0.03] p-3 text-sm text-cyan-50/76" key={item.region}>
                <p className="font-semibold text-white">{item.region}</p>
                <p className="mt-2">{item.ocean_region} - {item.temperature.toFixed(1)} C</p>
                <p>Fertility {item.fertility.toFixed(1)}/100</p>
                <p>Top risk: {item.top_risk}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {response.anomaly_alerts.length ? (
        <div className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
          <p className="text-sm font-semibold text-white">Anomaly alerts</p>
          <div className="mt-3 grid gap-2">
            {response.anomaly_alerts.map((alert) => (
              <div className="rounded-[14px] border border-orange-200/10 bg-orange-200/10 px-3 py-2 text-sm text-cyan-50/76" key={alert.type}>
                <span className="font-semibold text-white">{alert.type}</span> - {alert.level}: {alert.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnswerSection({ title, text, items }: { title: string; text?: string; items?: string[] }) {
  return (
    <div className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      {text ? <p className="mt-2 text-sm leading-7 text-cyan-50/78">{text}</p> : null}
      {items ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-cyan-50/78">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
