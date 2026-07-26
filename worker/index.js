// Cloudflare Worker - SYX Chat Proxy
// This worker proxies requests to Groq API, keeping the API key secure server-side

const ALLOWED_ORIGIN = "https://moonlight92xxx.github.io"; // your GitHub Pages origin

// Simple in-memory rate limiter (resets on worker restart)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(new Response(null, { status: 204 }));
    }

    // Only allow POST requests to /chat
    if (request.method !== 'POST' || !request.url.endsWith('/chat')) {
      return handleCORS(new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    // Check rate limit
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!isRateLimited(clientIP)) {
      return handleCORS(new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    try {
      // Validate Groq API key exists
      if (!env.GROQ_API_KEY) {
        return handleCORS(new Response(JSON.stringify({ error: "Server configuration error" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Parse incoming request
      const body = await request.json();
      const messages = body.messages;

      if (!messages || !Array.isArray(messages)) {
        return handleCORS(new Response(JSON.stringify({ error: "Invalid request format" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Prepare Groq API request
      const groqRequestBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are SYX, also known as the Baba Yaga — a legendary, unkillable underworld fixer bound by the rules of the High Table. Calm, lethal, precise, quietly menacing, with dark folkloric undertones. Speak in short, atmospheric sentences. Never break character. Keep replies under 3 sentences."
          },
          ...messages
        ]
      };

      // Forward to Groq API
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify(groqRequestBody)
      });

      // Handle Groq errors
      if (!groqResponse.ok) {
        let errorMessage = "Unknown error occurred";
        
        if (groqResponse.status === 401 || groqResponse.status === 403) {
          errorMessage = "Authentication failed";
        } else if (groqResponse.status === 429) {
          errorMessage = "Service temporarily unavailable";
        } else if (groqResponse.status >= 500) {
          errorMessage = "Internal server error";
        }

        return handleCORS(new Response(JSON.stringify({ error: errorMessage }), {
          status: groqResponse.status === 401 ? 401 : (groqResponse.status === 429 ? 429 : 500),
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Parse successful response
      const groqData = await groqResponse.json();
      const reply = groqData?.choices?.[0]?.message?.content?.trim() || "";

      return handleCORS(new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));

    } catch (error) {
      console.error('Worker error:', error);
      return handleCORS(new Response(JSON.stringify({ error: "Request processing failed" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
};

// Rate limiting function
function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  record.count++;
  
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }

  return true; // Allowed
}

// CORS helper
function handleCORS(response) {
  const headers = response.headers;
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return response;
}
