import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * setup-admin: One-time bootstrap endpoint.
 * GET  → returns { needsSetup: boolean } so the frontend wizard can detect first-run
 * POST → creates the first admin. Disabled automatically once any admin exists.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if any admin exists
    const { data: existingAdmins } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    const needsSetup = !existingAdmins || existingAdmins.length === 0;

    // GET → status check only (used by in-app wizard)
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ needsSetup }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST → create admin (only if none exists)
    if (!needsSetup) {
      return new Response(
        JSON.stringify({ error: 'An admin account already exists. This endpoint is disabled.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newUser.user) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', newUser.user.id);
        
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Update profile failed. Did you run the SQL migration script? Detailed error: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: { id: newUser.user?.id, email: newUser.user?.email } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
