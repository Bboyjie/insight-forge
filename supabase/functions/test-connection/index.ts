import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl, apiKey, modelName } = await req.json() as TestRequest;

    console.log(`Testing connection - BaseURL: ${baseUrl}, Model: ${modelName}`);

    if (!baseUrl || !apiKey || !modelName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the base URL
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const endpoint = `${normalizedBaseUrl}/chat/completions`;

    console.log(`Testing endpoint: ${endpoint}`);

    // Send a minimal test request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Connection test failed: ${response.status} - ${errorText}`);
      
      let errorMessage = `API 返回错误 (${response.status})`;
      if (response.status === 401) {
        errorMessage = 'API Key 无效或已过期';
      } else if (response.status === 404) {
        errorMessage = '接口地址不正确或模型不存在';
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, details: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Connection test successful:', JSON.stringify(data).slice(0, 200));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '连接成功！',
        model: data.model || modelName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Connection test error:', error);
    
    let errorMessage = '连接失败';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '无法连接到服务器，请检查 Base URL';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
