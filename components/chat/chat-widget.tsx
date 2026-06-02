"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, CalendarCheck, Check, Loader2, MessageCircle, Send, X } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

type UiMessage = ChatMessage & {
  id: string;
  createdAt: string;
};

type LeadForm = {
  name: string;
  email: string;
  businessType: string;
  phone: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function getSessionId() {
  const key = "brightscale-chat-session";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = createId();
  window.localStorage.setItem(key, next);
  return next;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lead, setLead] = useState<LeadForm>({
    name: "",
    email: "",
    businessType: "",
    phone: ""
  });
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I’m Brightscale’s AI assistant. I can help you explore AI voice agents, messaging automation, social media agents, Meta ads, and lead generation.",
      createdAt: new Date().toISOString()
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isStreaming, leadOpen]);

  const lastUserMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.content ?? "",
    [messages]
  );

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || isStreaming || !sessionId) return;

    const userMessage: UiMessage = {
      id: createId(),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    const assistantId = createId();
    const assistantMessage: UiMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pageUrl: window.location.href,
          messages: [...messages, userMessage]
            .filter((message) => message.role === "user" || message.role === "assistant")
            .slice(-10)
            .map(({ role, content }) => ({ role, content }))
        })
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Brightscale assistant is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const eventName = event.match(/^event: (.+)$/m)?.[1];
          const dataText = event.match(/^data: (.+)$/m)?.[1];
          if (!eventName || !dataText) continue;
          const data = JSON.parse(dataText) as { token?: string; leadCapture?: boolean; error?: string };

          if (eventName === "token" && data.token) {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + data.token }
                  : message
              )
            );
          }

          if (eventName === "done" && data.leadCapture) {
            setLeadOpen(true);
          }

          if (eventName === "error") {
            throw new Error(data.error ?? "The assistant could not complete the response.");
          }
        }
      }
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "I’m not fully sure about that yet. Please contact Brightscale directly."
              }
            : message
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadError("");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        ...lead,
        source: "chat_widget",
        lastMessage: lastUserMessage
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setLeadError(payload?.error ?? "Please check the form and try again.");
      return;
    }

    setLeadSaved(true);
    setLeadOpen(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section
          className={cn(
            "flex h-[min(720px,calc(100vh-40px))] w-[calc(100vw-40px)] max-w-[420px] animate-slide-up flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-premium",
            "dark:border-white/10 dark:bg-[#0b1425]"
          )}
          aria-label="Brightscale chat"
        >
          <header className="border-b border-slate-200/80 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-[#0b1425]/95">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-bright-ink text-white dark:bg-bright-cyan dark:text-bright-ink">
                  <Bot size={21} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Brightscale Assistant
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI automation and lead growth
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/80 px-4 py-5 dark:bg-[#08111f]">
            <div className="space-y-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[84%] rounded-[22px] px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "bg-bright-ink text-white dark:bg-bright-cyan dark:text-bright-ink"
                        : "border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/7 dark:text-slate-100"
                    )}
                  >
                    {message.content ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <TypingIndicator />
                    )}
                    <time
                      className={cn(
                        "mt-2 block text-[11px]",
                        message.role === "user"
                          ? "text-white/65 dark:text-bright-ink/65"
                          : "text-slate-400"
                      )}
                    >
                      {formatTime(new Date(message.createdAt))}
                    </time>
                  </div>
                </article>
              ))}

              {leadSaved ? (
                <div className="flex items-center gap-2 rounded-2xl border border-bright-green/30 bg-bright-green/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  <Check size={16} />
                  Thanks. Brightscale received your details.
                </div>
              ) : null}

              {leadOpen ? (
                <form
                  onSubmit={submitLead}
                  className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/7"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                    <CalendarCheck size={16} />
                    Book a free consultation with Brightscale
                  </div>
                  <div className="grid gap-2">
                    <LeadInput label="Name" value={lead.name} onChange={(name) => setLead({ ...lead, name })} />
                    <LeadInput label="Email" type="email" value={lead.email} onChange={(email) => setLead({ ...lead, email })} />
                    <LeadInput label="Business type" value={lead.businessType} onChange={(businessType) => setLead({ ...lead, businessType })} />
                    <LeadInput label="Phone optional" value={lead.phone} onChange={(phone) => setLead({ ...lead, phone })} />
                  </div>
                  {leadError ? <p className="mt-2 text-xs text-red-500">{leadError}</p> : null}
                  <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-bright-ink px-4 text-sm font-semibold text-white transition hover:bg-bright-navy dark:bg-bright-cyan dark:text-bright-ink">
                    <Send size={15} />
                    Send details
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b1425]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
              className="flex items-end gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={1}
                placeholder="Ask about Brightscale services..."
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <button
                disabled={!input.trim() || isStreaming}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bright-blue text-white transition hover:bg-bright-ink disabled:cursor-not-allowed disabled:opacity-40 dark:bg-bright-cyan dark:text-bright-ink"
                aria-label="Send message"
              >
                {isStreaming ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative grid h-16 w-16 place-items-center rounded-full bg-bright-ink text-white shadow-premium transition hover:-translate-y-0.5 hover:bg-bright-navy dark:bg-bright-cyan dark:text-bright-ink"
          aria-label="Open Brightscale chat"
        >
          <span className="absolute inset-0 rounded-full bg-bright-cyan/50 opacity-60 blur-xl transition group-hover:opacity-90" />
          <MessageCircle className="relative" size={27} />
        </button>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex h-6 items-center gap-1">
      <span className="h-2 w-2 animate-soft-pulse rounded-full bg-slate-400" />
      <span className="h-2 w-2 animate-soft-pulse rounded-full bg-slate-400 [animation-delay:.15s]" />
      <span className="h-2 w-2 animate-soft-pulse rounded-full bg-slate-400 [animation-delay:.3s]" />
    </div>
  );
}

function LeadInput({
  label,
  value,
  type = "text",
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        required={!label.toLowerCase().includes("optional")}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-bright-blue dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}
