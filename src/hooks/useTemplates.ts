import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Template {
  id: string;
  name: string;
  description: string | null;
  schema: any;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  type: 'device' | 'home';
  devices?: { count: number }[];
}

const TEMPLATES_QUERY_KEY = ["templates"];

export function useTemplates() {
  return useQuery<Template[]>({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_templates")
        .select(`
          *,
          devices ( count )
        `)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: { name: string; description?: string; schema?: any; is_default?: boolean; type?: 'device' | 'home' }) => {
      const { data, error } = await supabase
        .from("dashboard_templates")
        .insert({
          ...template,
          type: template.type || "device",
          schema: template.schema || { version: "1.0", layout: [], widgets: {} }
        })
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; schema?: any; is_default?: boolean; type?: 'device' | 'home' }) => {
      const { data, error } = await supabase
        .from("dashboard_templates")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dashboard_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useAssignTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceIds, templateId }: { deviceIds: string[]; templateId: string }) => {
      const { error } = await supabase
        .from("devices")
        .update({ template_id: templateId })
        .in("id", deviceIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}
