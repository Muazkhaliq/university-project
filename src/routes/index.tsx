import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState, type ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Brain, Briefcase, Check, FileText, Map, Mic, Sparkles, Target,
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";

const NAME = "Automated Recommendation System for Students";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${NAME} — AI Career Guidance` },
      {
        name: "description",
        content:
          "Find the right career path, close your skill gaps and get job-ready with one AI mentor. Built for students.",
      },
      { property: "og:title", content: `${NAME} — AI Career Guidance` },
      { property: "og:description", content: "Find your path, build your skills, land your first role." },
    ],
  }),
  component: Landing,
});

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const FEATURES: { icon: Icon; title: string; desc: string }[] = [
  { icon: Brain, title: "Skill assessment", desc: "Find your level and the exact gaps for your target role." },
  { icon: Map, title: "Learning roadmap", desc: "A step-by-step plan with curated videos and quizzes." },
  { icon: FileText, title: "Resume & CV", desc: "Build a CV and score your resume against ATS checks." },
  { icon: Mic, title: "Mock interviews", desc: "Practice with an AI interviewer and get honest feedback." },
  { icon: Briefcase, title: "Job matches", desc: "Roles ranked by how well they fit your skills." },
  { icon: Sparkles, title: "AI career agent", desc: "Chat or talk in English or Roman Urdu, any time." },
];

const STEPS = [
  { title: "Tell us your goal", desc: "Pick a target role and take a short assessment." },
  { title: "Get your plan", desc: "See your gaps, a roadmap and the right resources." },
  { title: "Get job-ready", desc: "Polish your CV, practice interviews, apply with confidence." },
];

function Landing() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session)).catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const primaryTo = authed ? "/dashboard" : "/auth";
  const primaryLabel = authed ? "Open dashboard" : "Get started free";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Soft color wash behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[640px]">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.22),transparent)]" />
        <div className="absolute right-[-120px] top-[120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoMark} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className="display text-sm leading-tight sm:text-lg">{NAME}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 text-sm">
          <ThemeToggle />
          {!authed && (
            <Link to="/auth" className="hidden rounded-full px-4 py-2 hover:bg-muted sm:inline-flex">
              Sign in
            </Link>
          )}
          <Link to={primaryTo} className="rounded-full bg-ink px-4 py-2 font-medium text-cream hover:opacity-90">
            {authed ? "Dashboard" : "Get started"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-ember" />
          AI-powered career guidance
        </div>
        <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
          <span className="brand-gradient-text">Automated Recommendation System</span>
          <span className="mt-2 block text-3xl text-foreground sm:text-5xl md:text-6xl">for Students</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Find the right career path, close your skill gaps and get job-ready, with one AI mentor that knows your goals.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={primaryTo}
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-cream shadow-cta transition hover:opacity-90"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a href="#features" className="rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium backdrop-blur hover:bg-muted">
            See features
          </a>
        </div>

        {/* Preview card */}
        <div className="mx-auto mt-14 max-w-md rounded-2xl border border-border bg-card p-5 text-left shadow-panel">
          <div className="flex items-center gap-3">
            <div className="brand-gradient grid h-10 w-10 place-items-center rounded-full text-white">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Recommended path</div>
              <div className="font-semibold">Web Development</div>
            </div>
            <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              92% match
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["React fundamentals", "REST APIs with Node.js", "SQL & databases"].map((t, i) => (
              <div key={t} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                    i === 0 ? "bg-ember text-white" : "border border-border text-muted-foreground"
                  }`}
                >
                  {i === 0 ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={i === 0 ? "text-muted-foreground line-through" : ""}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display text-3xl sm:text-4xl">Everything you need, in one place</h2>
          <p className="mt-3 text-muted-foreground">Six tools that work together around your target role.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-ember/40 hover:shadow-panel"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ember/10 text-ember">
                <f.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="display text-center text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="text-center">
              <div className="brand-gradient mx-auto grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white shadow-cta">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6">
        <div className="brand-gradient rounded-3xl px-6 py-12 text-center text-white shadow-cta sm:px-12">
          <h2 className="display text-3xl text-white sm:text-4xl">Start your career journey today</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">Free for students. Sign in with Google or email in seconds.</p>
          <Link
            to={primaryTo}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-900 transition hover:bg-white/90"
          >
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} {NAME}</span>
          <a href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
