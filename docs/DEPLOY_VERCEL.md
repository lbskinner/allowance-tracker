# Deploy Allowance Tracker to Vercel

## 1. Push your code to Git

Vercel deploys from a Git repo (GitHub, GitLab, or Bitbucket). If you haven’t already:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

---

## 2. Create the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New…** → **Project**.
3. Import your **allowance-tracker** repository.
4. Vercel should detect **Vite** and set:
   - **Build Command:** `npm run build` (or `tsc -b && vite build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Leave **Root Directory** as `.` unless the app lives in a subfolder.

---

## 3. Set environment variables

In the Vercel project: **Settings** → **Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | From Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key | Same page; "Project API keys" → anon public |

You can use `VITE_SUPABASE_PUBLISHABLE_KEY` instead of `VITE_SUPABASE_ANON_KEY` if that’s what you use locally.

Apply to **Production** (and Preview if you want). Redeploy after saving so the build picks them up.

---

## 4. Deploy

- Click **Deploy** (or push to `main` after connecting the repo).
- When the build finishes, Vercel gives you a URL (e.g. `https://allowance-tracker-xxx.vercel.app`).

---

## 5. SPA routing

The app uses client-side routes (e.g. `/view/:token` for the read-only kid view). The repo includes a **`vercel.json`** that rewrites all requests to `/index.html` so those routes work after refresh or when opened directly. No extra step needed if `vercel.json` is committed.

---

## Keep-alive cron (prevents Supabase free-tier pausing)

`vercel.json` schedules `/api/keepalive` every 3 days (`0 14 */3 * *`, UTC). It does a cheap GET against the Supabase REST API so the project isn't paused for inactivity.

1. In **Settings** → **Environment Variables**, add `CRON_SECRET` (any long random string, e.g. `openssl rand -hex 32`) for **Production**. Vercel sends it as `Authorization: Bearer <secret>` on cron calls; the endpoint returns 401 without it.
2. Redeploy. Crons only run on the production deployment.
3. Verify: **Settings** → **Cron Jobs** → **Run**, then check the function logs (expect 200).

On the Hobby plan, crons run at most once per day and may fire anywhere within the scheduled hour; every 3 days is fine.

---

## Optional: custom domain

In the Vercel project: **Settings** → **Domains** → add your domain and follow the DNS instructions.

---

## Troubleshooting

- **"Supabase not configured"**  
  Env vars must start with `VITE_` to be embedded in the Vite build. Redeploy after adding or changing them.

- **404 on `/view/xyz`**  
  Ensure `vercel.json` is in the repo and that the deploy used it (no overwrite by a root `rewrites` in the dashboard).

- **Auth redirects**  
  If you use Supabase Auth with redirect URLs, add your Vercel URL (and custom domain) in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
