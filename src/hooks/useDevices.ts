import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Device {
  id: string;
  title: string;
  path: string;
  node_id: string;
  created_at: string;
  template_id: string | null;
  dashboard_templates?: {
    schema: any;
    name: string;
  } | null;
}

const DEVICES_QUERY_KEY = ["devices"];

/**
 * Fetch all devices from Supabase, ordered by creation date.
 */
export function useDevices() {
  return useQuery<Device[]>({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*, dashboard_templates(schema, name)")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Device[];
    },
  });
}

/**
 * Generate a URL-safe path slug from a title.
 */
function slugify(title: string): string {
  return `/device/${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")}`;
}

/**
 * Add a new device.
 */
export function useAddDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, nodeId }: { title: string; nodeId: string }) => {
      const path = slugify(title);
      const { data, error } = await supabase
        .from("devices")
        .insert({ title, path, node_id: nodeId })
        .select()
        .single();

      if (error) throw error;
      return data as Device;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}

/**
 * Update a device's title (and regenerate path).
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const path = slugify(title);
      const { data, error } = await supabase
        .from("devices")
        .update({ title, path })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Device;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}

/**
 * Delete a device by ID.
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}
