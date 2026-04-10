[<img alt="Anedya Documentation" src="https://img.shields.io/badge/Anedya-Documentation-blue?style=for-the-badge">](https://docs.anedya.io?utm_source=github&utm_medium=link&utm_campaign=github-sdk&utm_content=react)

<!---<div style="width:20%; margin:0 auto;margin-bottom:50px;margin-top:50px;">-->
<p align="center">
    <img src="https://cdn.anedya.io/anedya_black_banner.png" alt="Logo">
</p>
<!--</div>-->

# Anedya Dashboard Canvas

Turn raw IoT telemetry into a polished dashboard experience in minutes.

Anedya Dashboard Canvas helps teams launch multi-device monitoring dashboards with real-time insights, historical analysis, and remote control workflows out of the box.

<!-- ![Screenshot](screenshot.png) _(Note: Replace with your actual screenshot later)_ -->

## ✨ Features

- **Device-focused dashboard UI:** View live telemetry, status, and trends per device using Anedya APIs.
- **Dashboard template builder:** Design a shared dashboard layout with drag-and-drop sections and widgets (gauge, historical trend, value display, and value-store widgets).
- **Live + historical data views:** Use auto-refresh for real-time monitoring and date-range selection for historical analysis.
- **Write actions to devices:** Update device settings from the dashboard.
- **User and device access control:** Create users, assign device-level access, and manage permissions.
- **Deployment-ready setup:** Supabase migrations/functions via GitHub Actions and frontend deployment on Vercel.

---

## 🚀 Deployment Flow (Recommended)

Follow this exact order for a smooth deployment.

### Step 1: Fork this repository

1. Click **Fork** (top-right on GitHub).
2. Continue all setup from your own fork.

### Step 2: Create your Supabase account and project

1. Create a free account and a new project on [Supabase](https://supabase.com).
2. Save these values from your Supabase dashboard:
   - **Project URL** (Project Settings → API)
   - **Anon key** (Project Settings → API)
   - **Project Reference ID** (the `<project-ref>` in `https://<project-ref>.supabase.co`)
   - **Database password** (the password for this Supabase project)
   - **Personal Access Token** ([Account Settings → Access Tokens](https://supabase.com/dashboard/account/tokens))

### Step 3: In your fork, add GitHub secrets and run workflow

1. Open your forked repo → **Settings → Secrets and variables → Actions**.
2. Add these **New repository secrets**:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_DB_PASSWORD`
3. Open **Actions** → select **"🚀 Deploy to Supabase"** → click **Run workflow**.
4. Wait for the workflow to finish successfully.

> ✅ This creates the database schema, RLS policies, and deploys the required Supabase Edge Functions.

### Step 4: Create and copy your Anedya API key

1. Sign in at [Anedya](https://anedya.io) and create a project.
2. Generate an API key.
3. Keep the key ready for Vercel environment variables.

### Step 5: Deploy frontend on Vercel

Deploy your **forked repository** on Vercel.

Click the button below to open Vercel's import flow:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Then:

1. Choose **Import Git Repository**.
2. Select your fork (for example: `<your-github-username>/anedya-dashboard-canvas`).
3. Add the environment variables below.
4. Click **Deploy**.

Vercel will ask for:

- `VITE_SUPABASE_PROJECT_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANEDYA_API_KEY`
- `VITE_APP_NAME` (optional)

### Step 6: Run first-time setup

1. Open your deployed Vercel URL.
2. The app detects that no admin exists and opens the initial setup flow.
3. Create your admin account.
4. Done. You can now log in, add users, and assign devices.

### Quick Reference: Values You Need

| Where used                             | Name                        | Source                                    |
| -------------------------------------- | --------------------------- | ----------------------------------------- |
| GitHub Actions Secret                  | `SUPABASE_ACCESS_TOKEN`     | Supabase Account Settings → Access Tokens |
| GitHub Actions Secret                  | `SUPABASE_PROJECT_ID`       | Supabase project reference ID             |
| GitHub Actions Secret                  | `SUPABASE_DB_PASSWORD`      | Supabase project database password        |
| Vercel Environment Variable            | `VITE_SUPABASE_PROJECT_URL` | Supabase Project Settings → API           |
| Vercel Environment Variable            | `VITE_SUPABASE_ANON_KEY`    | Supabase Project Settings → API           |
| Vercel Environment Variable            | `VITE_ANEDYA_API_KEY`       | Anedya project API key                    |
| Vercel Environment Variable (optional) | `VITE_APP_NAME`             | Any app display name you choose           |

---

## 💻 Local Development

If you'd prefer to run the code locally:

```bash
# 1. Clone the repo
git clone https://github.com/anedyaio/anedya-dashboard-canvas.git
cd anedya-dashboard-canvas

# 2. Install dependencies
npm install

# 3. Add your environment variables
cp .env.example .env
# Edit .env with your keys

# 4. Run the development server
npm run dev
```

### 🔐 Pre-commit Secret Scan

This repo uses Husky to run `npm run scan:secrets` before every commit.

- It scans staged files for common credential patterns (private keys, access tokens, API key/password assignments, and URLs with embedded credentials).
- Commits are blocked when a match is found.
- Keep real credentials in `.env` (already git-ignored) and only commit placeholder values to tracked files.

### Manual Database Setup (CLI)

If you don't want to use GitHub Actions, you can push the automated database setup manually using the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase db push
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy setup-admin --no-verify-jwt
```

## 🛠 Tech Stack

- **React 18** with **Vite**
- **Tailwind CSS** + **shadcn/ui** for styling
- **Supabase** (Postgres DB, Auth, Edge Functions, RLS Policies)
- **Anedya** (IoT Telemetry, Value Store synchronization)
- **React Router** for secure routing
- **Lucide React** for icons
