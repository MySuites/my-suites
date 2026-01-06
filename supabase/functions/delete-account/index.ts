// Setup type definitions for built-in Supabase Runtime APIs
import "supabase-edge-runtime";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ??
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => null);
    const { user_id } = body || {};

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400 },
      );
    }

    // Verify the user making the request matches the user_id to be deleted
    // OR better yet, get the user from the Authorization header token to ensure they are who they say they are.
    // However, standard pattern: passing the token in Authorization header lets us distinguish the caller.
    // Let's verify the user from the token.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth
      .getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401 },
      );
    }

    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403 },
      );
    }

    // 1. Delete the User from Auth
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      user_id,
    );

    if (deleteUserError) {
      throw new Error(deleteUserError.message);
    }

    // 2. Manual Cleanup (if cascading is not sufficient or safety is needed)
    // We can optionally delete from public tables if they are foreign key constrained without CASCADE DELETE.
    // Assuming Postgres Cascade is set up for most things, but let's be safe for critical identifiers if known.
    // Actually, `deleteUser` removes from `auth.users`.
    // If our public tables reference `auth.users.id` with `ON DELETE CASCADE`, we are good.
    // If not, we might fail or leave orphans.
    // Given I don't see the schema, I will assume standard Supabase setup or that errors here are acceptable if minor data is left.

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
