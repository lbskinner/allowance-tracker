# Allowance Tracker

A small app to track allowances for kids: add credits and expenses, set a default allowance amount, and share a read-only view link so kids can see their balance and recent transactions (last 30 days) without logging in. Supports two parents per household: invite your partner with a code or link so you both see the same data.

**Stack:** React 19, TypeScript, Vite 7, Supabase (Auth + Postgres).

---

## Local setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd allowance-tracker
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run in order:
     - `supabase/schema.sql`
     - `supabase/invite-co-parent.sql`
     - `supabase/kid-view-token.sql`

3. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) from Supabase Dashboard → Project Settings → API.

4. **Run**
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Deploy (Vercel)

See **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)** for steps: connect the repo, set the same env vars, and deploy. The repo includes a `vercel.json` so client-side routes (e.g. `/view/:token`) work.

---

## Docs

- **[docs/SUPABASE_SCHEMA.md](docs/SUPABASE_SCHEMA.md)** — Tables, RLS, and RPCs.
