# Automated Recommendation System for Students

An AI career platform for students. It helps a student find the right career field, close skill gaps, build a CV and portfolio, practise interviews, and track progress, all in one place.

## Features

| Page | What it does |
| --- | --- |
| **ARS Agent** (`/agent`) | Voice career counselor. Talks with the student in English or Roman Urdu, asks about education, skills and goals, then recommends a career field. |
| **Dashboard** (`/dashboard`) | Overview of the student's activity. |
| **Skills Assessment** (`/assessment`) | AI-generated assessment for a target role, with a verdict and level. |
| **Skill Gap Analysis** (`/skills`) | Compares current skills with a target role and lists what is missing. |
| **Roadmap** (`/roadmap`) | Step-by-step learning roadmap with sub-topics and status tracking. |
| **Courses** (`/courses`) | Recommended learning resources per topic, plus quizzes on weak concepts. |
| **Resume Optimizer** (`/resume`) | Analyses a resume against a target role and suggests improvements. |
| **CV Builder** (`/cv`) | Build and export a CV (PDF) from templates. |
| **Portfolio Builder** (`/portfolio`) | Generates a portfolio from the student's profile. |
| **Mock Interview** (`/interview`) | Turn-by-turn AI interview with feedback at the end. |
| **Jobs** (`/jobs`) | AI job matches with fit score, salary range and apply links. |
| **Progress** (`/progress`) | Study time and progress over time. |

Users sign up with email/password or Google. Every user's data is private (Supabase Row Level Security).

## Tech stack

- **Frontend:** React 19, TanStack Start / Router, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts
- **Backend:** TanStack Start server functions (Nitro)
- **Database & auth:** [Supabase](https://supabase.com) (Postgres, Auth, Realtime)
- **AI:** [Groq](https://console.groq.com)
  - Chat: `llama-3.3-70b-versatile`
  - Speech to text: `whisper-large-v3-turbo`
  - Text to speech: `canopylabs/orpheus-v1-english`
- **Hosting:** Vercel

## Getting started

### 1. Requirements

- Node.js 22 or newer and npm
- A Supabase project
- A Groq API key ([console.groq.com/keys](https://console.groq.com/keys))

### 2. Install

```sh
git clone https://github.com/Muazkhaliq/university-project.git
cd university-project
npm install
```

### 3. Environment variables

Copy the template and fill in your values:

```sh
cp .env.example .env
```

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `SUPABASE_PROJECT_ID` | Supabase project ref (from the project URL) | No |
| `SUPABASE_URL` | Supabase → Project Settings → API | No |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → publishable key (`sb_publishable_...`) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → secret key (`sb_secret_...`) | **Never** |
| `VITE_SUPABASE_PROJECT_ID` | Same as `SUPABASE_PROJECT_ID` | Yes |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as `SUPABASE_PUBLISHABLE_KEY` | Yes |
| `GROQ_API_KEY` | Groq console (`gsk_...`) | **Never** |

> `.env` is git-ignored. Never commit real keys, and never put the secret key or Groq key in a `VITE_` variable.

Optional overrides: `GROQ_CHAT_MODEL`, `GROQ_STT_MODEL`, `GROQ_TTS_MODEL`, `GROQ_TTS_VOICE` (default voice: `hannah`).

### 4. Database

Open Supabase → **SQL Editor**, paste the contents of [`supabase/setup.sql`](supabase/setup.sql) and run it once. It creates all tables, RLS policies and triggers.

If you use the Supabase CLI instead, `supabase db push` applies the same files from `supabase/migrations/`. Older duplicate migrations are kept in `supabase/migrations_legacy/` for reference only. Do not run them.

### 5. Run

```sh
npm run dev
```

## Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com), create an **OAuth client ID** (type: Web application).
   - Authorized JavaScript origin: your site URL, e.g. `https://your-app.vercel.app`
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Publish the OAuth consent screen, otherwise only test users can sign in.
3. In Supabase → **Authentication → Sign In / Providers → Google**, enable it and paste the client ID and secret.

## Deploy to Vercel

1. Import the repository in Vercel. Framework and build settings can stay on their defaults, and **Root Directory** stays empty.
2. Add every variable from the table above under **Settings → Environment Variables** (Production and Preview). `VITE_` values are baked in at build time, so redeploy after changing them.
3. Deploy.
4. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Project structure

```
src/
  routes/               Pages (file-based routing)
    _authenticated/     Pages that need sign-in
    auth.tsx            Sign in / sign up
  components/           UI components (shadcn/ui in components/ui)
  lib/
    features.functions.ts   Server functions for all features
    agent.functions.ts      Voice agent: transcribe, converse, speak
    ai.server.ts            Groq client (server only)
  integrations/supabase/    Supabase clients and auth middleware
supabase/
  setup.sql             Full database schema
  migrations/           Same schema as migrations
```

## Known limitations

- The agent automation toggle on the ARS Agent page calls an external agent service at `http://localhost:5000`, which is not part of this repository. It only works when that service runs locally.
- Text-to-speech is English-only, so the voice agent writes Urdu replies in Roman Urdu.
- If Supabase sign-in fails, the app falls back to a local demo account.
