# 🚀 Quick Start - SYX Chat Worker Setup

## TL;DR - 5 Steps to Secure Your Groq API Key

### 1️⃣ Update CORS Origin (2 minutes)
Edit `worker/index.js`, line 3:
```javascript
const ALLOWED_ORIGIN = "https://YOUR_USERNAME.github.io"; // ← Change this!
```

### 2️⃣ Get Cloudflare API Token (3 minutes)
- Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) (free)
- Profile → My Profile → API Tokens → Create Token
- Use "Edit Cloudflare Workers" template
- **Copy the token** (one-time view!)

### 3️⃣ Add GitHub Secrets (2 minutes)
Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add these:
- `CLOUDFLARE_API_TOKEN` = Your Cloudflare API token from step 2
- `GROQ_API_KEY` = Your Groq API key from [console.groq.com](https://console.groq.com/keys)

### 4️⃣ Deploy Worker (5 minutes)
```bash
npm install -g wrangler
wrangler login
cd worker
wrangler deploy
wrangler secret put GROQ_API_KEY  # Paste your Groq key when prompted
```

**Note the Worker URL** displayed (e.g., `https://syx-chat-proxy.abc123.workers.dev`)

### 5️⃣ Update main.js (1 minute)
Edit `js/main.js`, line ~16:
```javascript
const SYX_API_ENDPOINT = "https://syx-chat-proxy.abc123.workers.dev/chat"; // ← Paste your URL + /chat
```

### ✅ Done! Push to GitHub
```bash
git add .
git commit -m "Add secure Groq proxy via Cloudflare Workers"
git push origin main
```

---

## 🎯 After This Setup

- ✅ **Just `git push`** - GitHub Actions auto-deploys Worker changes
- ✅ **No manual Wrangler/Cloudflare steps** ever again
- ✅ **API key stays secure** - never in git, never in browser
- ✅ **Free tier** - 100K requests/day on Cloudflare

---

## 🔍 Verify It Works

1. Open your GitHub Pages site
2. Click the V-Bot (bottom-left sphere)
3. Send a message
4. Check DevTools → Network tab - **no Groq API key visible** ✅

---

## 📖 Full Documentation

See `WORKER_SETUP.md` for detailed troubleshooting and explanations.
