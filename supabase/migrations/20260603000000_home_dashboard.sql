-- Migration to add type column to dashboard_templates and support Home Dashboard
ALTER TABLE public.dashboard_templates ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'device' CHECK (type IN ('device', 'home'));

-- Update trigger function to handle default template check per-type
CREATE OR REPLACE FUNCTION public.handle_default_template()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.dashboard_templates SET is_default = false WHERE id != NEW.id AND type = NEW.type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
