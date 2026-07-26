# ✅ Setup Checklist - SYX Chat Worker

Print this or keep it open while setting up!

## Pre-Setup (Gather These)
- [ ] Groq API key from [console.groq.com/keys](https://console.groq.com/keys)
- [ ] Your GitHub username (for GitHub Pages URL)
- [ ] 5 minutes of uninterrupted time

---

## Step-by-Step Checklist

### □ Step 1: Update CORS Origin (2 min)
File: `worker/index.js`

```javascript
const ALLOWED_ORIGIN = "https://YOUR_USERNAME.github.io";
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Example:** If your repo is at `github.com/johndoe/xat-syx`, use:
```javascript
const ALLOWED_ORIGIN = "https://johndoe.github.io";
```

✅ Save the file

---

### □ Step 2: Create Cloudflare Account (3 min)
- [ ] Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
- [ ] Sign up with email (free tier)
- [ ] Verify email address
- [ ] Log into dashboard

---

### □ Step 3: Get Cloudflare API Token (3 min)
- [ ] Click profile icon → **"My Profile"**
- [ ] Click **"API Tokens"** tab
- [ ] Click **"Create Token"**
- [ ] Use template: **"Edit Cloudflare Workers"**
- [ ] Click **"Continue to summary"**
- [ ] Click **"Create Token"**
- [ ] **COPY THE TOKEN NOW** (won't see it again!)
- [ ] Paste it somewhere safe temporarily

---

### □ Step 4: Add GitHub Secrets (2 min)
Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

#### Secret #1: CLOUDFLARE_API_TOKEN
- [ ] Click **"New repository secret"**
- [ ] Name: `CLOUDFLARE_API_TOKEN`
- [ ] Value: Paste Cloudflare API token from Step 3
- [ ] Click **"Add secret"**
- [ ] Verify it appears in the list

#### Secret #2: GROQ_API_KEY
- [ ] Click **"New repository secret"**
- [ ] Name: `GROQ_API_KEY`
- [ ] Value: Paste your Groq API key
- [ ] Click **"Add secret"**
- [ ] Verify it appears in the list

---

### □ Step 5: Install Wrangler & Deploy (5 min)

Open terminal/command prompt:

```bash
# Install Node.js first if needed: https://nodejs.org/

# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
# (Opens browser, click "Allow")

# Navigate to worker directory
cd worker

# Deploy the Worker
wrangler deploy

# Set Groq API key as encrypted secret
wrangler secret put GROQ_API_KEY
# (Paste your Groq key when prompted)
```

- [ ] Note the Worker URL displayed (looks like: `https://syx-chat-proxy.abc123.workers.dev`)
- [ ] Copy this URL somewhere

---

### □ Step 6: Update main.js (1 min)
File: `js/main.js`

Find this line (~line 16):
```javascript
const SYX_API_ENDPOINT = null; // Set this after deployment!
```

Replace with your Worker URL + `/chat`:
```javascript
const SYX_API_ENDPOINT = "https://syx-chat-proxy.abc123.workers.dev/chat";
```

**Important:** Include `/chat` at the end!

✅ Save the file

---

### □ Step 7: Commit & Push (1 min)

```bash
git add .
git commit -m "Add secure Groq proxy via Cloudflare Workers"
git push origin main
```

- [ ] Watch GitHub Actions tab for deployment (should complete in ~30 seconds)
- [ ] Green checkmark = success ✅
- [ ] Red X = check logs for errors ❌

---

### □ Step 8: Test It! (2 min)

- [ ] Open your GitHub Pages site in browser
- [ ] Click the V-Bot (bottom-left sphere)
- [ ] Type a message and send
- [ ] Should get a response from SYX
- [ ] Open DevTools (F12) → Network tab
- [ ] Send another message
- [ ] Click the request to `workers.dev`
- [ ] Check Headers tab - **NO Authorization header** ✅
- [ ] Check Payload - just `{messages: [...]}` ✅

---

## 🎉 You're Done!

From now on:
- ✅ Just `git push` - everything auto-deploys
- ✅ No manual Wrangler steps ever again
- ✅ No Cloudflare dashboard visits needed
- ✅ API key stays secure forever

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Check `GROQ_API_KEY` secret in GitHub Settings |
| "Rate limit exceeded" | Wait 60 seconds, then try again |
| CORS error in console | Verify `ALLOWED_ORIGIN` matches your GitHub Pages URL exactly |
| Worker not deploying | Check `.github/workflows/deploy-worker.yml` exists |
| 404 on Worker URL | Make sure you included `/chat` in `SYX_API_ENDPOINT` |

Full docs: See `WORKER_SETUP.md`

---

## Security Verification

After setup, verify these are TRUE:

- [ ] GROQ_API_KEY is NOT in any file in your repo
- [ ] GROQ_API_KEY is NOT visible in browser DevTools
- [ ] GROQ_API_KEY is stored in GitHub Secrets (encrypted)
- [ ] GROQ_API_KEY is stored in Cloudflare Worker secrets (encrypted)
- [ ] Only your domain can call the Worker (CORS)
- [ ] Rate limiting is active (20 req/min per IP)

If all boxes checked → **Your setup is secure!** 🔒

---

**Questions?** See `ARCHITECTURE.md` for how it all works under the hood.
