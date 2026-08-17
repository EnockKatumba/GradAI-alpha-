export default async (req, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in Netlify environment variables' }), { status: 500, headers: corsHeaders });
  }

  try {
    const { messages, system, useSearch } = await req.json();

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      system_instruction: {
        parts: [{ text: system || 'You are GradAI, a dedicated AI academic companion for African university students.' }]
      },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };

    if (useSearch) {
      body.tools = [{ google_search_retrieval: {} }];
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await geminiRes.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: corsHeaders });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I had trouble responding. Please try again.';
    const didSearch = useSearch && !!data.candidates?.[0]?.groundingMetadata;

    return new Response(JSON.stringify({ text, didSearch }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
