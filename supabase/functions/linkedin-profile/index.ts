import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { linkedin_access_token } = await req.json();

    if (!linkedin_access_token) {
      return new Response(
        JSON.stringify({ error: "linkedin_access_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch LinkedIn profile using their API
    // LinkedIn API v2 - userinfo endpoint (OpenID Connect)
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${linkedin_access_token}` },
    });

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error("LinkedIn API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch LinkedIn profile", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkedinProfile = await profileRes.json();

    // Map LinkedIn data to our profile fields
    const profileUpdate: Record<string, unknown> = {
      linkedin_id: linkedinProfile.sub || null,
      avatar_url: linkedinProfile.picture || null,
      linkedin_headline: linkedinProfile.name || null,
      linkedin_bio: null, // Not available via userinfo
      linkedin_connected_at: new Date().toISOString(),
    };

    // If name is empty, fill from LinkedIn
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    if (!existingProfile?.full_name && linkedinProfile.name) {
      profileUpdate.full_name = linkedinProfile.name;
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: {
          name: linkedinProfile.name,
          picture: linkedinProfile.picture,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
