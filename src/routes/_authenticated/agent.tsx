import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  sendAgentMessage,
  listAgentConversations,
  getAgentMessages,
  renameAgentConversation,
  deleteAgentConversation,
  togglePinAgentConversation,
} from "@/lib/features.functions";
import { agentTranscribe, agentSpeak } from "@/lib/agent.functions";
import { toast } from "sonner";
import {
  Sparkles, Send, Loader2, MessageSquare, Plus, PanelLeftClose, PanelLeftOpen,
  Mic, Pin, PinOff, Pencil, Trash2, MoreHorizontal, Paperclip, Smile, X, User,
  ChevronDown, Search, Copy, RotateCcw, ThumbsUp, ThumbsDown, Volume2, Share2,
  MicOff, Square, Wand2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/agent")({
  head: () => ({
    meta: [
      { title: "AI Agent · Automated Recommendation System for Students" },
      { name: "description", content: "Chat or talk with your AI career mentor." },
      { property: "og:title", content: "AI Agent · Automated Recommendation System for Students" },
      { property: "og:description", content: "Chat or talk with your AI career mentor." },
    ],
  }),
  component: AgentPage,
});

type Convo = { id: string; title: string; updated_at: string; pinned: boolean };
type Msg = { id: string; role: string; content: string; created_at: string };

const EMOJIS = ["😀","😄","😅","😊","🤔","🙌","👍","🔥","🎯","🚀","💡","✨","❤️","💯","🙏","😎","👀","📚","💼","🧠"];

const SUGGESTIONS = [
  { emoji: "🎯", text: "Find the best career path for me" },
  { emoji: "📄", text: "Review my resume and suggest improvements" },
  { emoji: "💼", text: "Find jobs that match my profile" },
  { emoji: "🎤", text: "Conduct a mock interview with me" },
  { emoji: "📚", text: "Build my personalized learning roadmap" },
  { emoji: "🚀", text: "Analyze my current skill gap" },
  { emoji: "💰", text: "Estimate my target salary range" },
  { emoji: "🌍", text: "Find remote opportunities worldwide" },
];

function AgentPage() {
  const send = useServerFn(sendAgentMessage);
  const listConvos = useServerFn(listAgentConversations);
  const getMsgs = useServerFn(getAgentMessages);
  const renameFn = useServerFn(renameAgentConversation);
  const deleteFn = useServerFn(deleteAgentConversation);
  const pinFn = useServerFn(togglePinAgentConversation);
  const transcribeFn = useServerFn(agentTranscribe);
  const speakFn = useServerFn(agentSpeak);
  const qc = useQueryClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; text: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; initials: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);


  // User
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const email = data.user.email ?? "";
        const name = (data.user.user_metadata as { full_name?: string })?.full_name || email.split("@")[0] || "You";
        const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";
        setUser({ email, name, initials });
      }
    })();
  }, []);

  const { data: convos } = useQuery<Convo[]>({
    queryKey: ["agent.convos"],
    queryFn: async () => (await listConvos()) as unknown as Convo[],
  });
  const { data: msgs } = useQuery<Msg[]>({
    queryKey: ["agent.msgs", conversationId],
    queryFn: async () =>
      conversationId ? ((await getMsgs({ data: { conversationId } })) as unknown as Msg[]) : [],
    enabled: !!conversationId,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [msgs?.length, thinking]);

  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

  const mut = useMutation({
    mutationFn: async (message: string) => {
      setThinking(true);
      const withAttachments = attachments.length
        ? `${message}\n\n---\nAttached files:\n${attachments.map((a) => `• ${a.name}\n${a.text.slice(0, 4000)}`).join("\n\n")}`
        : message;
      return send({ data: { conversationId, message: withAttachments } });
    },
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setInput("");
      setAttachments([]);
      qc.invalidateQueries({ queryKey: ["agent.convos"] });
      qc.invalidateQueries({ queryKey: ["agent.msgs", res.conversationId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    onSettled: () => setThinking(false),
  });

  const renameM = useMutation({
    mutationFn: (v: { conversationId: string; title: string }) => renameFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent.convos"] }),
  });
  const deleteM = useMutation({
    mutationFn: (v: { conversationId: string }) => deleteFn({ data: v }),
    onSuccess: (_, v) => {
      if (conversationId === v.conversationId) setConversationId(null);
      qc.invalidateQueries({ queryKey: ["agent.convos"] });
    },
  });
  const pinM = useMutation({
    mutationFn: (v: { conversationId: string; pinned: boolean }) => pinFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent.convos"] }),
  });

  const filtered = useMemo(
    () => (convos ?? []).filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [convos, search],
  );
  const grouped = useMemo(() => groupConvos(filtered), [filtered]);

  async function handleAttach(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      // Only plain-text files can be read in the browser; PDFs/DOCX would arrive as garbage.
      if (!/\.(txt|md|csv|json)$/i.test(f.name) && !f.type.startsWith("text/")) {
        toast.error(`${f.name}: only text files are supported. Paste resume text instead.`);
        continue;
      }
      const text = await f.text();
      setAttachments((a) => [...a, { name: f.name, text }]);
    }
  }

  function submit() {
    const v = input.trim();
    if (!v || mut.isPending) return;
    mut.mutate(v);
  }

  const activeConvo = convos?.find((c) => c.id === conversationId);
  const greeting = getGreeting();

  const groupProps = {
    activeId: conversationId,
    onSelect: setConversationId,
    onRename: (id: string, t: string) => renameM.mutate({ conversationId: id, title: t }),
    onDelete: (id: string) => deleteM.mutate({ conversationId: id }),
    onPin: (id: string, p: boolean) => pinM.mutate({ conversationId: id, pinned: p }),
  };

  return (
    <div className="flex h-[calc(100dvh-49px)] w-full overflow-hidden md:h-screen">
      {/* Conversation history */}
      <AnimatePresence initial={false}>
        {historyOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="hidden shrink-0 overflow-hidden border-r border-border bg-sidebar lg:block"
          >
            <div className="flex h-full w-[272px] flex-col">
              <div className="p-3">
                <button
                  onClick={() => setConversationId(null)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-cream transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> New chat
                </button>
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ember"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3">
                <ConvoGroup label="Pinned" items={grouped.pinned} {...groupProps} />
                <ConvoGroup label="Today" items={grouped.today} {...groupProps} />
                <ConvoGroup label="Yesterday" items={grouped.yesterday} {...groupProps} />
                <ConvoGroup label="Previous" items={grouped.previous} {...groupProps} />
                {filtered.length === 0 && (
                  <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    {search ? "No matching conversations" : "No conversations yet"}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setHistoryOpen((h) => !h)}
              title={historyOpen ? "Hide history" : "Show history"}
              className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex"
            >
              {historyOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ember text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{activeConvo?.title ?? "AI Career Agent"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setConversationId(null)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted lg:hidden"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
            <button
              onClick={() => setVoiceOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Mic className="h-3.5 w-3.5" /> Voice
            </button>
            <ThemeToggle />
          </div>
        </header>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          {!conversationId && (msgs?.length ?? 0) === 0 ? (
            <Welcome greeting={greeting} name={user?.name?.split(" ")[0]} onPick={(s) => mut.mutate(s)} onVoice={() => setVoiceOpen(true)} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
              <AnimatePresence initial={false}>
                {msgs?.map((m) => (
                  <Message key={m.id} role={m.role} content={m.content} onSpeak={async (t) => {
                    try {
                      const a = await speakFn({ data: { text: t } });
                      const audio = new Audio(`data:${a.mimeType};base64,${a.audioBase64}`);
                      await audio.play();
                    } catch (e) { toast.error(e instanceof Error ? e.message : "Playback failed"); }
                  }} onRegenerate={() => {
                    const lastUser = [...(msgs ?? [])].reverse().find((x) => x.role === "user");
                    if (lastUser) mut.mutate(lastUser.content);
                  }} />
                ))}
              </AnimatePresence>
              {thinking && <ThinkingBubble />}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[16ch] truncate">{a.name}</span>
                    <button onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl border border-border bg-card shadow-panel transition focus-within:border-ember">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 200) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                }}
                placeholder="Ask anything about your career..."
                className="block max-h-[200px] w-full resize-none rounded-2xl bg-transparent px-4 pb-12 pt-3.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <ToolButton title="Attach text file (.txt, .md)" onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4" /></ToolButton>
                  <ToolButton title="Voice input" onClick={() => setVoiceOpen(true)}><Mic className="h-4 w-4" /></ToolButton>
                  <div className="relative">
                    <ToolButton title="Emoji" onClick={() => setEmojiOpen((o) => !o)} active={emojiOpen}><Smile className="h-4 w-4" /></ToolButton>
                    {emojiOpen && (
                      <div className="absolute bottom-11 left-0 z-30 grid w-64 grid-cols-10 gap-1 rounded-xl border border-border bg-card p-2 shadow-panel">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => { setInput((v) => v + e); setEmojiOpen(false); inputRef.current?.focus(); }}
                            className="rounded-md p-1 text-lg transition hover:bg-muted"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json" hidden onChange={(e) => { handleAttach(e.target.files); e.target.value = ""; }} />
                </div>
                <button
                  onClick={submit}
                  disabled={!input.trim() || mut.isPending}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-medium text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              AI can make mistakes. Verify important details. Enter to send · Shift+Enter for new line.
            </p>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {voiceOpen && (
          <VoicePanel
            onClose={() => setVoiceOpen(false)}
            transcribe={transcribeFn}
            speak={speakFn}
            send={send}
            conversationId={conversationId}
            onConversation={(id) => { setConversationId(id); qc.invalidateQueries({ queryKey: ["agent.convos"] }); qc.invalidateQueries({ queryKey: ["agent.msgs", id] }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= Subcomponents ================= */

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

function ToolButton({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground ${active ? "bg-ember/10 text-ember" : ""}`}
    >
      {children}
    </button>
  );
}

function Welcome({ greeting, name, onPick, onVoice }: { greeting: string; name?: string; onPick: (s: string) => void; onVoice: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative mb-6">
        <motion.div
          className="bg-ember absolute inset-0 -m-8 rounded-full opacity-30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 -m-4 rounded-full border border-ember/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-ember relative grid h-20 w-20 place-items-center rounded-full shadow-cta"
        >
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 6, repeat: Infinity }}>
            <Sparkles className="h-9 w-9 text-white" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Online · ready to help
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="display mt-4 text-4xl sm:text-5xl"
      >
        {greeting}{name ? `, ${name}` : ""} <span className="inline-block">👋</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base"
      >
        I'm your <span className="text-ember font-semibold">AI Career Mentor</span>.
        Ask anything about careers, resumes, interviews, learning paths, or jobs.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
      >
        <button
          onClick={() => onPick("Let's begin — help me plan my next career move.")}
          className="bg-ember flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:brightness-110"
        >
          <Wand2 className="h-4 w-4" /> Start conversation
        </button>
        <button
          onClick={onVoice}
          className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-ember/50"
        >
          <Mic className="h-4 w-4" /> Voice mode
        </button>
      </motion.div>

      <div className="mt-10 grid w-full gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.text}
            onClick={() => onPick(s.text)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.04 }}
            whileHover={{ y: -3 }}
            className="bg-card border border-border group flex items-start gap-2 rounded-2xl p-3 text-left text-xs shadow-panel transition-all hover:border-ember/40 hover:shadow-cta"
          >
            <span className="text-lg leading-none">{s.emoji}</span>
            <span className="text-foreground/80 group-hover:text-foreground">{s.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Message({ role, content, onSpeak, onRegenerate }: { role: string; content: string; onSpeak: (t: string) => void; onRegenerate: () => void }) {
  const isUser = role === "user";
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`group mb-6 flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="bg-ember mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div className="max-w-[85%] min-w-0">
        <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
          ? "bg-ember text-white shadow-cta"
          : "bg-card border border-border text-foreground shadow-sm"}`}>
          {content}
        </div>
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <MsgAction title="Copy" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></MsgAction>
            <MsgAction title="Regenerate" onClick={onRegenerate}><RotateCcw className="h-3.5 w-3.5" /></MsgAction>
            <MsgAction title="Like" active={reaction === "up"} onClick={() => setReaction(reaction === "up" ? null : "up")}><ThumbsUp className="h-3.5 w-3.5" /></MsgAction>
            <MsgAction title="Dislike" active={reaction === "down"} onClick={() => setReaction(reaction === "down" ? null : "down")}><ThumbsDown className="h-3.5 w-3.5" /></MsgAction>
            <MsgAction title="Read aloud" onClick={() => onSpeak(content)}><Volume2 className="h-3.5 w-3.5" /></MsgAction>
            <MsgAction title="Share" onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ text: content });
                else { await navigator.clipboard.writeText(content); toast.success("Copied to share"); }
              } catch { /* cancelled */ }
            }}><Share2 className="h-3.5 w-3.5" /></MsgAction>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}

function MsgAction({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground ${active ? "bg-ember/10 text-ember" : ""}`}
    >
      {children}
    </button>
  );
}

function ThinkingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex gap-3">
      <div className="bg-ember mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm">
        <Sparkles className="h-4 w-4 animate-pulse" />
      </div>
      <div className="bg-card border border-border flex items-center gap-1.5 rounded-2xl px-4 py-3">
        <motion.span className="h-1.5 w-1.5 rounded-full bg-ember" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0 }} />
        <motion.span className="h-1.5 w-1.5 rounded-full bg-ember" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.15 }} />
        <motion.span className="h-1.5 w-1.5 rounded-full bg-ember" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }} />
        <span className="ml-2 text-xs text-muted-foreground">Thinking…</span>
      </div>
    </motion.div>
  );
}

/* ================= History ================= */

function groupConvos(convos: Convo[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const pinned: Convo[] = [], today: Convo[] = [], yesterday: Convo[] = [], previous: Convo[] = [];
  for (const c of convos) {
    if (c.pinned) { pinned.push(c); continue; }
    const t = new Date(c.updated_at).getTime();
    if (t >= startOfToday) today.push(c);
    else if (t >= startOfYesterday) yesterday.push(c);
    else previous.push(c);
  }
  return { pinned, today, yesterday, previous };
}

function ConvoGroup({
  label, items, activeId, onSelect, onRename, onDelete, onPin,
}: {
  label: string;
  items: Convo[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        {label}
        <ChevronDown className={`h-3 w-3 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((c) => (
            <ConvoRow key={c.id} convo={c} active={activeId === c.id}
              onSelect={() => onSelect(c.id)}
              onRename={(t) => onRename(c.id, t)}
              onDelete={() => onDelete(c.id)}
              onPin={() => onPin(c.id, !c.pinned)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConvoRow({ convo, active, onSelect, onRename, onDelete, onPin }: {
  convo: Convo; active: boolean; onSelect: () => void; onRename: (t: string) => void; onDelete: () => void; onPin: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(convo.title);
  useEffect(() => setTitle(convo.title), [convo.title]);

  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`group relative flex items-center rounded-xl text-sm transition-all ${active
        ? "bg-ember text-white shadow-cta"
        : "hover:bg-muted"}`}
    >
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { setEditing(false); if (title.trim() && title !== convo.title) onRename(title.trim()); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") { setTitle(convo.title); setEditing(false); }
          }}
          className="flex-1 rounded-xl bg-transparent px-3 py-2 text-sm outline-none ring-1 ring-ember"
        />
      ) : (
        <button onClick={onSelect} className={`flex flex-1 min-w-0 items-center gap-2 px-3 py-2 text-left ${active ? "text-white" : "text-foreground/80"}`}>
          <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white/80" : "text-muted-foreground"}`} />
          <span className="truncate">{convo.title || "Untitled"}</span>
          {convo.pinned && <Pin className={`h-3 w-3 shrink-0 ${active ? "text-white" : "text-ember"}`} />}
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
        className={`mr-1 rounded-md p-1 opacity-0 transition group-hover:opacity-100 ${active ? "text-white hover:bg-white/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${menu ? "opacity-100" : ""}`}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
          <div className="bg-card border border-border absolute right-1 top-9 z-20 w-40 overflow-hidden rounded-xl shadow-panel">
            <MenuItem icon={convo.pinned ? PinOff : Pin} label={convo.pinned ? "Unpin" : "Pin"} onClick={() => { onPin(); setMenu(false); }} />
            <MenuItem icon={Pencil} label="Rename" onClick={() => { setEditing(true); setMenu(false); }} />
            <MenuItem icon={Trash2} label="Delete" danger onClick={() => { onDelete(); setMenu(false); }} />
          </div>
        </>
      )}
    </motion.div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-muted ${danger ? "text-red-500" : "text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ================= Voice ================= */

function VoicePanel({
  onClose, transcribe, speak, send, conversationId, onConversation,
}: {
  onClose: () => void;
  transcribe: (args: { data: { audioBase64: string; mimeType: string } }) => Promise<{ text: string }>;
  speak: (args: { data: { text: string } }) => Promise<{ audioBase64: string; mimeType: string }>;
  send: (args: { data: { conversationId: string | null; message: string } }) => Promise<{ conversationId: string; reply: string }>;
  conversationId: string | null;
  onConversation: (id: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [muted, setMuted] = useState(false);
  const [levels, setLevels] = useState<number[]>(Array(24).fill(0.15));
  const [spokenIdx, setSpokenIdx] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const convoRef = useRef<string | null>(conversationId);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioRef.current?.pause();
    audioCtxRef.current?.close().catch(() => {});
  }

  function startWaveform(stream: MediaStream) {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 128;
    src.connect(an);
    analyserRef.current = an;
    const data = new Uint8Array(an.frequencyBinCount);
    const tick = () => {
      an.getByteFrequencyData(data);
      const step = Math.floor(data.length / 24);
      const next = Array.from({ length: 24 }, (_, i) => Math.max(0.12, data[i * step] / 255));
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  async function startRecording() {
    if (muted) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setLevels(Array(24).fill(0.15));
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1500) { setStatus("idle"); toast.error("Too short — try again"); return; }
        setStatus("thinking");
        try {
          const b64 = await blobToBase64(blob);
          const tr = await transcribe({ data: { audioBase64: b64, mimeType: mime } });
          const text = tr.text.trim();
          if (!text) { setStatus("idle"); toast.error("Couldn't hear you"); return; }
          setTranscript((t) => [...t, { role: "user", text }]);
          const res = await send({ data: { conversationId: convoRef.current, message: text } });
          convoRef.current = res.conversationId;
          onConversation(res.conversationId);
          setTranscript((t) => [...t, { role: "assistant", text: res.reply }]);
          await speakReply(res.reply);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
          setStatus("idle");
        }
      };
      mediaRef.current = rec;
      rec.start();
      setStatus("listening");
    } catch { toast.error("Microphone access denied"); }
  }

  async function speakReply(reply: string) {
    setStatus("speaking");
    const sentences = reply.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [reply];
    setSpokenIdx(0);
    const audio = await speak({ data: { text: reply } });
    const el = new Audio(`data:${audio.mimeType};base64,${audio.audioBase64}`);
    audioRef.current = el;
    const words = reply.split(/\s+/).length;
    const approxMs = Math.max(1500, words * 300);
    const perSentence = approxMs / sentences.length;
    let i = 0;
    const iv = setInterval(() => { i++; if (i < sentences.length) setSpokenIdx(i); else clearInterval(iv); }, perSentence);
    await new Promise<void>((r) => { el.onended = () => r(); el.onerror = () => r(); el.play().catch(() => r()); });
    clearInterval(iv);
    setStatus("idle");
  }

  function stop() {
    mediaRef.current?.stop();
    audioRef.current?.pause();
  }

  const statusLabel: Record<typeof status, string> = {
    idle: "Tap to speak",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };
  const lastAssistant = [...transcript].reverse().find((t) => t.role === "assistant");
  const sentences = lastAssistant ? (lastAssistant.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [lastAssistant.text]) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="bg-card border border-border relative w-full max-w-lg overflow-hidden rounded-3xl shadow-panel"
      >
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>

        <div className="relative flex flex-col items-center px-6 pb-4 pt-8">
          <div className="relative mb-5">
            <motion.div className="bg-ember absolute inset-0 -m-8 rounded-full opacity-40 blur-3xl"
              animate={status === "listening" ? { scale: [1, 1.2, 1] } : status === "speaking" ? { opacity: [0.4, 0.6, 0.4] } : {}}
              transition={{ duration: 1.6, repeat: Infinity }} />
            {status === "listening" && (
              <motion.div className="absolute inset-0 -m-3 rounded-full border-2 border-ember/60"
                animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            <div className="bg-ember relative grid h-28 w-28 place-items-center rounded-full shadow-cta">
              {status === "thinking" ? <Loader2 className="h-10 w-10 animate-spin text-white" /> :
                status === "speaking" ? <Volume2 className="h-10 w-10 animate-pulse text-white" /> :
                status === "listening" ? <Mic className="h-10 w-10 text-white" /> :
                <Sparkles className="h-10 w-10 text-white" />}
            </div>
          </div>

          <div className="text-sm font-semibold">{statusLabel[status]}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">English &amp; Urdu · natural conversation</div>

          {/* Waveform */}
          <div className="mt-4 flex h-10 items-end gap-1">
            {levels.map((v, i) => (
              <motion.span
                key={i}
                className="bg-ember w-1 rounded-full"
                style={{ height: `${v * 100}%` }}
                animate={status === "speaking" ? { scaleY: [0.4, 1, 0.5, 0.9, 0.4] } : {}}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.03 }}
              />
            ))}
          </div>
        </div>

        {/* Synchronized text */}
        {status === "speaking" && sentences.length > 0 && (
          <div className="border-y border-border/60 bg-background/40 px-6 py-4 text-center text-sm leading-relaxed">
            {sentences.map((s, i) => (
              <span key={i} className={i === spokenIdx ? "text-ember font-semibold" : "text-muted-foreground/70"}> {s} </span>
            ))}
          </div>
        )}

        <div className="max-h-[32vh] space-y-2 overflow-y-auto border-t border-border/60 px-5 py-4">
          {transcript.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Everything spoken will appear here as text.
            </div>
          )}
          {transcript.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${t.role === "user" ? "bg-ember text-white" : "bg-card border border-border"}`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-border/60 px-5 py-4">
          <button
            onClick={() => setMuted((m) => !m)}
            className={`grid h-11 w-11 place-items-center rounded-full border border-border transition ${muted ? "bg-red-500/10 text-red-500" : "text-muted-foreground hover:bg-muted"}`}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {status === "listening" || status === "speaking" ? (
            <button onClick={stop} className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-panel">
              <Square className="h-4 w-4" /> Stop
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={startRecording}
              disabled={status !== "idle" || muted}
              className="bg-ember flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-cta disabled:opacity-40"
            >
              <Mic className="h-4 w-4" /> Speak
            </motion.button>
          )}
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
