import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Automated Recommendation System for Students" },
      {
        name: "description",
        content: "How Automated Recommendation System for Students collects, uses and protects your data.",
      },
    ],
  }),
  component: PrivacyPage,
});

const UPDATED = "21 November 2026";

function PrivacyPage() {
  return (
    <div className="grain-bg min-h-screen px-4 py-12">
      <article className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-panel">
        <a href="/" className="text-sm text-ember hover:underline">
          ← Back to home
        </a>
        <h1 className="display mt-4 text-3xl">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          <section>
            <p>
              Automated Recommendation System for Students ("ARS", "we") is a university project that helps
              students plan their careers. This page explains what data we collect, why, and how
              you can control it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Data we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account data:</strong> your email address and name. If you sign in with
                Google, we receive your name, email address and profile picture from Google. We do
                not receive your Google password.
              </li>
              <li>
                <strong>Content you create:</strong> resumes, CVs, portfolios, assessment answers,
                interview answers, roadmap and course progress, job matches and chat messages with
                the AI agent.
              </li>
              <li>
                <strong>Voice recordings:</strong> when you use the voice agent, your recording is
                sent for transcription and is not stored by us after it is converted to text.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">How we use it</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To sign you in and keep your account secure.</li>
              <li>To generate career recommendations, assessments, roadmaps and feedback.</li>
              <li>To show your saved work and progress back to you.</li>
            </ul>
            <p className="mt-2">We do not sell your data and we do not use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Services we use</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> stores your account and content. Each user can only access
                their own data.
              </li>
              <li>
                <strong>Groq</strong> processes the text and voice you send to AI features in order
                to generate a response.
              </li>
              <li>
                <strong>Google</strong> handles sign-in when you choose "Continue with Google".
              </li>
              <li>
                <strong>Vercel</strong> hosts the website.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Your choices</h2>
            <p className="mt-2">
              You can edit or delete your content inside the app at any time. To delete your
              account and all related data, contact us using the link below and we will remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="mt-2">
              Questions or deletion requests:{" "}
              <a
                href="https://github.com/Muazkhaliq/university-project/issues"
                className="text-ember hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                github.com/Muazkhaliq/university-project
              </a>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
