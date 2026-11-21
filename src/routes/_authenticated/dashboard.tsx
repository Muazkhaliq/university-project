import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ComponentType } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Brain, Briefcase, Check, ClipboardList, FileText, Flame, Github, IdCard,
  LineChart, Map, Mic, Pencil, PlayCircle, Sparkles, Target, Trophy,
} from "lucide-react";
import { PageShell } from "./route";
import {
  getMyProfile, updateMyProfile, listSkillAssessments, listResumes, listInterviews,
  getMyPortfolio, listAssessments, getMyCv, listJobs, getProgress,
} from "@/lib/features.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Automated Recommendation System for Students" },
      { name: "description", content: "Your career progress at a glance." },
      { property: "og:title", content: "Dashboard · Automated Recommendation System for Students" },
      { property: "og:description", content: "Track your skill gaps, resumes, interviews, and portfolio." },
    ],
  }),
  component: Dashboard,
});

type Icon = ComponentType<{ className?: string }>;

// A failing section should not blank the whole dashboard.
const safe = <T,>(fn: () => Promise<T>) => async () => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

function Dashboard() {
  const qc = useQueryClient();
  const fns = {
    profile: useServerFn(getMyProfile),
    update: useServerFn(updateMyProfile),
    skills: useServerFn(listSkillAssessments),
    resumes: useServerFn(listResumes),
    interviews: useServerFn(listInterviews),
    portfolio: useServerFn(getMyPortfolio),
    assessments: useServerFn(listAssessments),
    cv: useServerFn(getMyCv),
    jobs: useServerFn(listJobs),
    progress: useServerFn(getProgress),
  };

  const q = <T,>(key: string, fn: () => Promise<T>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({ queryKey: ["dash", key], queryFn: safe(fn), retry: false });

  const profile = q("profile", () => fns.profile()).data;
  const skills = q("skills", () => fns.skills()).data;
  const resumes = q("resumes", () => fns.resumes()).data;
  const interviews = q("interviews", () => fns.interviews()).data;
  const portfolio = q("portfolio", () => fns.portfolio()).data;
  const assessments = q("assessments", () => fns.assessments()).data;
  const cv = q("cv", () => fns.cv()).data;
  const jobs = q("jobs", () => fns.jobs()).data;
  const progress = q("progress", () => fns.progress()).data;

  const [editingRole, setEditingRole] = useState(false);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const targetRole = profile?.target_role as string | null | undefined;

  const saveRole = async () => {
    if (role.trim().length < 2) return;
    setSaving(true);
    try {
      await fns.update({ data: { target_role: role.trim() } });
      toast.success("Target role saved");
      setEditingRole(false);
      setRole("");
      qc.invalidateQueries({ queryKey: ["dash", "profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save role");
    } finally {
      setSaving(false);
    }
  };

  const firstName = (profile?.display_name as string | undefined)?.split(" ")[0];
  const skillScore = skills?.[0]?.overall_score ?? null;
  const atsScore = resumes?.length ? Math.max(...resumes.map((r) => r.ats_score ?? 0)) : null;
  const interviewScore = interviews?.find((i) => i.overall_score != null)?.overall_score ?? null;
  const streak = progress?.streak ?? 0;

  const steps: { title: string; desc: string; to: string; icon: Icon; done: boolean }[] = [
    { title: "Set your target role", desc: "Personalizes every feature.", to: "/dashboard", icon: Target, done: !!targetRole },
    { title: "Take the skills assessment", desc: "Find your current level.", to: "/assessment", icon: ClipboardList, done: !!assessments?.length },
    { title: "Analyze your skill gap", desc: "See what to learn next.", to: "/skills", icon: Brain, done: !!skills?.length },
    { title: "Generate your roadmap", desc: "A step-by-step learning plan.", to: "/roadmap", icon: Map, done: (progress?.roadmap_total ?? 0) > 0 },
    { title: "Learn with courses", desc: "Curated videos plus quizzes.", to: "/courses", icon: PlayCircle, done: (progress?.courses_total ?? 0) > 0 },
    { title: "Build your CV", desc: "Templates with PDF export.", to: "/cv", icon: IdCard, done: !!cv },
    { title: "Optimize your resume", desc: "Score it against ATS checks.", to: "/resume", icon: FileText, done: !!resumes?.length },
    { title: "Practice an interview", desc: "Live AI interviewer with feedback.", to: "/interview", icon: Mic, done: !!interviews?.length },
    { title: "Find matching jobs", desc: "Roles ranked by your fit.", to: "/jobs", icon: Briefcase, done: !!jobs?.length },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  const roadmapPct = pct(progress?.roadmap_done, progress?.roadmap_total);
  const coursesPct = pct(progress?.courses_completed, progress?.courses_total);

  return (
    <PageShell
      title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
      subtitle="Here's where you are on your career journey."
    >
      {/* Target role */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-panel">
        {targetRole && !editingRole ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-ember/10 text-ember">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Target role</div>
                <div className="text-lg font-semibold">{targetRole}</div>
              </div>
            </div>
            <button
              onClick={() => { setRole(targetRole); setEditingRole(true); }}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" /> Change
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold">What role are you aiming for?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every tool uses this to tailor its advice.
            </p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => { e.preventDefault(); saveRole(); }}
            >
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Junior Frontend Developer"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={role.trim().length < 2 || saving}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-cream disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {editingRole && (
                  <button type="button" onClick={() => setEditingRole(false)} className="rounded-lg border border-border px-4 py-2 text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Trophy} label="Skill score" value={skillScore} sub="latest gap analysis" to="/skills" />
        <Stat icon={FileText} label="ATS score" value={atsScore} sub="best resume" to="/resume" />
        <Stat icon={Mic} label="Interview" value={interviewScore} sub="latest mock" to="/interview" />
        <Stat icon={Flame} label="Study streak" value={streak} suffix={streak === 1 ? " day" : " days"} sub="keep it going" to="/progress" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Journey */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-panel lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="display text-xl">Your journey</h2>
              <p className="text-sm text-muted-foreground">{doneCount} of {steps.length} steps done</p>
            </div>
            {nextStep && (
              <Link
                to={nextStep.to}
                className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-cream hover:opacity-90 sm:flex"
              >
                Next: {nextStep.title} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <Bar value={(doneCount / steps.length) * 100} className="mt-3" />
          <ol className="mt-4 divide-y divide-border">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Link to={s.to} className="group flex items-center gap-3 py-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      s.done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "border border-border text-muted-foreground"
                    }`}
                  >
                    {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${s.done ? "text-muted-foreground line-through decoration-1" : ""}`}>{s.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Link
            to="/agent"
            className="group rounded-2xl border border-ember/30 bg-ember/5 p-5 shadow-panel transition hover:-translate-y-0.5"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-ember text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-3 font-semibold">Ask the AI Agent</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Chat or talk about careers, resumes and interviews, in English or Roman Urdu.
            </p>
            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-ember">
              Open chat <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-panel">
            <h2 className="font-semibold">Learning progress</h2>
            <Meter label="Roadmap" done={progress?.roadmap_done ?? 0} total={progress?.roadmap_total ?? 0} value={roadmapPct} to="/roadmap" />
            <Meter label="Courses" done={progress?.courses_completed ?? 0} total={progress?.courses_total ?? 0} value={coursesPct} to="/courses" />
            {!!progress?.weak_concepts?.length && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Needs practice</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {progress.weak_concepts.slice(0, 6).map((w) => (
                    <span key={w.concept} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
                      {w.concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* All tools */}
      <h2 className="display mt-10 mb-4 text-xl">All tools</h2>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Tool to="/assessment" icon={ClipboardList} title="Assessment" />
        <Tool to="/skills" icon={Brain} title="Skill Gap" />
        <Tool to="/roadmap" icon={Map} title="Roadmap" />
        <Tool to="/courses" icon={PlayCircle} title="Courses" />
        <Tool to="/cv" icon={IdCard} title="CV Builder" />
        <Tool to="/resume" icon={FileText} title="Resume" />
        <Tool to="/interview" icon={Mic} title="Interview" />
        <Tool to="/jobs" icon={Briefcase} title="Jobs" />
        <Tool to="/portfolio" icon={Github} title="Portfolio" done={!!portfolio} />
        <Tool to="/progress" icon={LineChart} title="Progress" />
        <Tool to="/agent" icon={Sparkles} title="AI Agent" />
      </section>
    </PageShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function pct(done?: number, total?: number) {
  return total ? Math.round(((done ?? 0) / total) * 100) : 0;
}

function Bar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Meter({ label, done, total, value, to }: { label: string; done: number; total: number; value: number; to: string }) {
  return (
    <Link to={to} className="mt-4 block">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{total ? `${done}/${total}` : "Not started"}</span>
      </div>
      <Bar value={value} className="mt-1.5" />
    </Link>
  );
}

function Stat({ icon: Icon, label, value, sub, to, suffix = "" }: {
  icon: Icon; label: string; value: number | null | undefined; sub: string; to: string; suffix?: string;
}) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 shadow-panel transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-ember" />
      </div>
      <div className="display mt-2 text-3xl">
        {value != null ? <>{value}<span className="text-base text-muted-foreground">{suffix}</span></> : "—"}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </Link>
  );
}

function Tool({ to, icon: Icon, title, done }: { to: string; icon: Icon; title: string; done?: boolean }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-ember/40 hover:bg-ember/5"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium">{title}</span>
      {done && <Check className="h-4 w-4 text-emerald-500" />}
    </Link>
  );
}
