import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import BuilderLayout from '../components/dashboard-builder/BuilderLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBuilderStore } from '@/store/useBuilderStore';

export default function TemplateBuilder() {
  const { setTemplate, setTemplateType, reset, templateType } = useBuilderStore();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('id');
  const queryType = searchParams.get('type') as 'device' | 'home' | null;

  // Load existing template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        let data = null;
        if (templateId) {
          const { data: tpl } = await supabase
            .from('dashboard_templates')
            .select('*')
            .eq('id', templateId)
            .single();
          data = tpl;
        } else {
          // Attempt to find by is_default first
          const { data: defaultTpl } = await supabase
            .from('dashboard_templates')
            .select('*')
            .eq('is_default', true)
            .eq('type', queryType || 'device')
            .maybeSingle();
          
          data = defaultTpl;

          // Fallback to name 'Default'
          if (!data) {
            const { data: fallbackTpl } = await supabase
              .from('dashboard_templates')
              .select('*')
              .eq('name', 'Default')
              .eq('type', queryType || 'device')
              .maybeSingle();
            data = fallbackTpl;
          }
        }

        if (data) {
          setTemplateType(data.type || 'device');
          if (data.schema) {
            const s = data.schema as any;
            if (s.layout && s.widgets) {
              // Support v1 (no sections) and v2 (with sections)
              const sections = s.sections || [];
              setTemplate(sections, s.layout, s.widgets);
            }
          }
        } else {
          reset();
          setTemplateType(queryType || 'device');
        }
      } catch {
        reset();
        setTemplateType(queryType || 'device');
      }
    };
    loadTemplate();
  }, [setTemplate, setTemplateType, reset, templateId, queryType]);

  // Auto-save template (upsert)
  const handleSaveTemplate = async (templateData: any) => {
    try {
      let error;
      if (templateId) {
        ({ error } = await supabase
          .from('dashboard_templates')
          .update({ schema: templateData, updated_at: new Date().toISOString() })
          .eq('id', templateId));
      } else {
        // Find default template by is_default first
        let { data: defaultTpl } = await supabase
          .from('dashboard_templates')
          .select('id')
          .eq('is_default', true)
          .eq('type', templateType)
          .maybeSingle();

        // Fallback to name 'Default'
        if (!defaultTpl) {
          const { data: fallbackTpl } = await supabase
            .from('dashboard_templates')
            .select('id')
            .eq('name', 'Default')
            .eq('type', templateType)
            .maybeSingle();
          defaultTpl = fallbackTpl;
        }
          
        if (defaultTpl?.id) {
          ({ error } = await supabase
            .from('dashboard_templates')
            .update({ schema: templateData, updated_at: new Date().toISOString() })
            .eq('id', defaultTpl.id));
        } else {
          ({ error } = await supabase
            .from('dashboard_templates')
            .insert({ name: 'Default', is_default: true, schema: templateData, type: templateType }));
        }
      }

      if (error) throw error;
      toast.success('Template layout saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save template layout');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col h-[calc(100vh-80px)]">
        
        <BuilderLayout onSave={handleSaveTemplate} />
      </div>
    </DashboardLayout>
  );
}
