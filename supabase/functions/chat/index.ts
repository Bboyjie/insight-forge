import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  stream?: boolean;
  systemPrompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, baseUrl, apiKey, modelName, stream = true, systemPrompt } = await req.json() as ChatRequest;

    console.log(`Chat request - Model: ${modelName}, Messages: ${messages.length}, Stream: ${stream}`);

    if (!baseUrl || !apiKey || !modelName) {
      return new Response(
        JSON.stringify({ error: 'Missing required configuration: baseUrl, apiKey, or modelName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the full messages array with system prompt if provided
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // Normalize the base URL
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const endpoint = `${normalizedBaseUrl}/chat/completions`;

    console.log(`Calling LLM API: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: fullMessages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `LLM API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stream) {
      // Return streaming response
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } else {
      // Return non-streaming response
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
