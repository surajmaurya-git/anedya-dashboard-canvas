import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string;
  role: string | null;
  created_at: string | null;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  assigned_at: string;
}

export interface UserWithDevices extends Profile {
  devices: string[]; // Array of device_ids
}

const USERS_QUERY_KEY = ["users"];
const USER_DEVICES_QUERY_KEY = ["user_devices"];

/**
 * Admin hook: Fetch all users and their assigned devices.
 */
export function useUsers() {
  return useQuery<UserWithDevices[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      // 1. Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // 2. Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("user_devices")
        .select("*");

      if (assignmentsError) throw assignmentsError;

      // 3. Map assignments to profiles
      return (profiles ?? []).map((profile) => ({
        ...profile,
        devices: (assignments ?? [])
          .filter((a) => a.user_id === profile.id)
          .map((a) => a.device_id),
      }));
    },
  });
}

/**
 * Admin hook: Assign a device to a user
 */
export function useAssignDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, deviceId }: { userId: string; deviceId: string }) => {
      const { error } = await supabase
        .from("user_devices")
        .insert({ user_id: userId, device_id: deviceId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

/**
 * Admin hook: Unassign a device from a user
 */
export function useUnassignDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, deviceId }: { userId: string; deviceId: string }) => {
      const { error } = await supabase
        .from("user_devices")
        .delete()
        .match({ user_id: userId, device_id: deviceId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

/**
 * Admin hook: Update a user's role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'viewer' | 'editor' }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Admin hook: Delete a user using the Edge Function
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
