import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirectUri } = await req.json();
    
    const clientId = Deno.env.get('LINUXDO_CLIENT_ID');
    const clientSecret = Deno.env.get('LINUXDO_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Missing LinuxDo credentials');
      return new Response(JSON.stringify({ error: 'Missing LinuxDo credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_auth_url') {
      // Generate the authorization URL
      const authUrl = `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      console.log('Generated auth URL for redirect:', redirectUri);
      
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_code') {
      // Exchange authorization code for access token
      console.log('Exchanging code for token...');
      
      const tokenResponse = await fetch('https://connect.linux.do/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: errorText }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      // Get user info
      const userResponse = await fetch('https://connect.linux.do/api/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User info fetch failed:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to get user info' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userData = await userResponse.json();
      console.log('User info fetched successfully:', userData.username);

      return new Response(JSON.stringify({
        accessToken: tokenData.access_token,
        user: {
          id: userData.id?.toString() || userData.username,
          username: userData.username,
          name: userData.name,
          avatar_url: userData.avatar_url,
          trust_level: userData.trust_level,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('LinuxDo auth error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
