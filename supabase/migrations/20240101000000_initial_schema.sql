-- ================================================================
-- Anedya IoT Dashboard — Initial Database Schema
-- Run this entire script in Supabase SQL Editor ONCE to set up
-- all required tables, Row Level Security policies, and triggers.
-- ================================================================

-- ── 1. Dashboard Templates ────────────────────────────────────
-- Stores widget layouts created in the Dashboard Builder.
CREATE TABLE IF NOT EXISTS public.dashboard_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  schema      JSONB NOT NULL DEFAULT '{"version": "1.0", "layout": [], "widgets": {}}',
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ── 2. Devices ────────────────────────────────────────────────
-- One row per physical IoT device registered in Anedya.
CREATE TABLE IF NOT EXISTS public.devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  path        TEXT UNIQUE NOT NULL,   -- URL-safe slug used in routing
  node_id     TEXT NOT NULL,          -- Anedya Node ID
  template_id UUID REFERENCES public.dashboard_templates(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ── 3. Profiles ───────────────────────────────────────────────
-- Extended user data synced from auth.users. Created automatically
-- via trigger when a new user signs up.
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ── 4. User ↔ Device assignments ─────────────────────────────
-- Controls which devices each user can see.
CREATE TABLE IF NOT EXISTS public.user_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id   UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(user_id, device_id)
);

-- ================================================================
-- Row Level Security
-- ================================================================
ALTER TABLE public.dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices        ENABLE ROW LEVEL SECURITY;

-- Helper function: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── profiles policies ─────────────────────────────────────────
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ── devices policies ──────────────────────────────────────────
CREATE POLICY "Users can read their assigned devices"
  ON public.devices FOR SELECT
  USING (
    public.is_admin()
    OR id IN (
      SELECT device_id FROM public.user_devices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert devices"
  ON public.devices FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update devices"
  ON public.devices FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete devices"
  ON public.devices FOR DELETE
  USING (public.is_admin());

-- ── dashboard_templates policies ──────────────────────────────
CREATE POLICY "All authenticated users can read templates"
  ON public.dashboard_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert templates"
  ON public.dashboard_templates FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update templates"
  ON public.dashboard_templates FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete templates"
  ON public.dashboard_templates FOR DELETE
  USING (public.is_admin());

-- ── user_devices policies ─────────────────────────────────────
CREATE POLICY "Users can read their own assignments"
  ON public.user_devices FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert assignments"
  ON public.user_devices FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete assignments"
  ON public.user_devices FOR DELETE
  USING (public.is_admin());

-- ================================================================
-- Trigger: Auto-create a profile row when a new user registers
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
