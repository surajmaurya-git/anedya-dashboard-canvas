-- Migration for Dashboard Template Management

-- 1. Add is_default column to dashboard_templates
ALTER TABLE public.dashboard_templates ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- 2. Mark existing 'default' template as default, or create one if none exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.dashboard_templates WHERE name = 'default') THEN
    UPDATE public.dashboard_templates SET is_default = true WHERE name = 'default';
  ELSE
    INSERT INTO public.dashboard_templates (name, description, is_default, schema)
    VALUES ('Default', 'System default template', true, '{"version": "1.0", "layout": [], "widgets": {}}');
  END IF;
END $$;

-- 3. Create a trigger to ensure only one default template exists
CREATE OR REPLACE FUNCTION public.handle_default_template()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.dashboard_templates SET is_default = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_single_default_template ON public.dashboard_templates;
CREATE TRIGGER ensure_single_default_template
  BEFORE INSERT OR UPDATE OF is_default
  ON public.dashboard_templates
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.handle_default_template();
