# Architecture Overview - SYX Chat Security

## Before (Insecure) ❌
```
Browser (main.js) ──────────────→ Groq API
     │                                  ↑
     └── Contains: GROQ_API_KEY ───────┘
         (visible in DevTools, git history, etc.)
```

**Problems:**
- API key exposed in browser DevTools → Network tab
- Key visible in JavaScript source code
- Anyone can steal and abuse your key
- No rate limiting or access control

---

## After (Secure) ✅
```
Browser (main.js) ─────→ Cloudflare Worker ─────→ Groq API
     │                        │                         ↑
     └── No keys! ────────────┴── GROQ_API_KEY (secret) ┘
         (just messages)        (encrypted server-side)
         
Security layers:
1. CORS: Only YOUR domain can call Worker
2. Rate limit: 20 req/min per IP
3. Error masking: Generic errors, no leaks
4. Secret storage: Key never in git/browser
```

**Benefits:**
✅ API key completely hidden from users  
✅ Automatic rate limiting prevents abuse  
✅ CORS restricts access to your domain only  
✅ Zero backend maintenance (serverless)  
✅ Free tier handles 100K+ requests/day  

---

## Request Flow

### 1. User sends message
```javascript
// Browser (main.js)
fetch("https://syx-chat.YOURS.workers.dev/chat", {
  method: "POST",
  body: JSON.stringify({ messages: [...] })
  // NO Authorization header needed!
})
```

### 2. Cloudflare Worker receives request
```javascript
// Worker (index.js)
- Validates CORS origin
- Checks rate limit (20 req/min per IP)
- Reads GROQ_API_KEY from encrypted secrets
- Adds system prompt + forwards to Groq
```

### 3. Groq processes request
```javascript
// Groq API
{
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: "You are SYX..." },
    ...user messages
  ]
}
```

### 4. Worker returns clean response
```javascript
// Back to browser
{ "reply": "SYX's atmospheric response" }
// No API keys, no internal details, just the reply
```

---

## File Responsibilities

| File | Purpose |
|------|---------|
| `worker/index.js` | Cloudflare Worker script - proxies to Groq, handles auth/rate limiting |
| `worker/wrangler.toml` | Wrangler config - tells Cloudflare how to deploy |
| `.github/workflows/deploy-worker.yml` | GitHub Actions - auto-deploys on git push |
| `js/main.js` | Frontend chat UI - calls Worker instead of Groq directly |
| GitHub Secrets | Stores `CLOUDFLARE_API_TOKEN` and `GROQ_API_KEY` securely |

---

## Deployment Pipeline

```
Developer pushes code
       ↓
GitHub detects changes in /worker/**
       ↓
GitHub Actions workflow triggers
       ↓
Wrangler deploys Worker to Cloudflare
       ↓
GROQ_API_KEY set as encrypted secret
       ↓
Worker live at https://syx-chat.XYZ.workers.dev
       ↓
Browser calls Worker (no keys needed!)
```

**Key point:** After initial setup, you **never touch Wrangler or Cloudflare dashboard again**. Just `git push` and everything updates automatically.

---

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare Workers | Free | 100K requests/day |
| GitHub Actions | Free (public repo) | Unlimited |
| Groq API | Free (beta) | Check current pricing |
| **Total** | | **$0/month** 🎉 |

---

## Security Checklist

- ✅ GROQ_API_KEY stored as Cloudflare Worker secret (encrypted)
- ✅ GROQ_API_KEY stored as GitHub Action secret (encrypted)
- ✅ GROQ_API_KEY never committed to git
- ✅ GROQ_API_KEY never sent to browser
- ✅ CORS restricts Worker to your domain only
- ✅ Rate limiting prevents abuse (20 req/min/IP)
- ✅ Error messages don't leak upstream details
- ✅ .gitignore prevents accidental secret commits
- ✅ Automated deployment reduces human error

---

## What Happens If...?

### Someone tries to call your Worker from their site?
❌ Blocked by CORS - only your GitHub Pages domain is allowed

### Someone steals your Worker URL?
⚠️ They can use it, but:
- Rate limited to 20 req/min
- You see usage in Cloudflare analytics
- You can rotate GROQ_API_KEY instantly via GitHub Secrets

### Your Groq key gets compromised?
1. Generate new key at console.groq.com
2. Update `GROQ_API_KEY` in GitHub Secrets
3. Next deployment uses new key automatically

### Cloudflare goes down?
- Worker fails gracefully with "relay is down" message
- Your site still works, just no chat
- Free tier has 99.9% uptime SLA

---

## Monitoring & Debugging

### View Worker logs
Cloudflare Dashboard → Workers → syx-chat-proxy → Logs

### View usage stats
Cloudflare Dashboard → Workers → Analytics

### Test locally
```bash
cd worker
wrangler dev  # Runs Worker on localhost:8787
```

### Check deployment status
GitHub repo → Actions tab → See deployment logs

---

This architecture gives you production-grade security for a personal project, with zero ongoing maintenance. Just write code, push to git, and let automation handle the rest. 🚀
