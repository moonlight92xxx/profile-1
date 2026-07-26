# SYX Chat - Cloudflare Worker Setup Guide

This guide walks you through setting up a secure Groq API proxy using Cloudflare Workers, so your API key never appears in browser-served files.

## 📋 What We've Created

1. **`/worker/index.js`** - Cloudflare Worker script that proxies requests to Groq
2. **`/worker/wrangler.toml`** - Wrangler configuration for the Worker
3. **`.github/workflows/deploy-worker.yml`** - GitHub Actions workflow for automated deployment
4. **Updated `/js/main.js`** - Removed client-side key logic, ready for Worker endpoint

---

## 🔧 One-Time Setup Steps

### Step 1: Create a Cloudflare Account (Free)

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Sign up with your email (free tier is sufficient)
3. Verify your email address

### Step 2: Get Your Cloudflare API Token

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click your profile icon (top-right) → **"My Profile"**
3. Go to **"API Tokens"** tab on the left
4. Click **"Create Token"**
5. Use the **"Edit Cloudflare Workers"** template (pre-filled permissions)
6. Review and click **"Continue to summary"**
7. Click **"Create Token"**
8. **Copy the token immediately** - you won't see it again!

### Step 3: Configure Your Worker Domain

In `worker/index.js`, update this line with your GitHub Pages URL:

```javascript
const ALLOWED_ORIGIN = "https://YOUR_USERNAME.github.io"; // Replace with your actual GitHub Pages URL
```

For example:
- If your repo is `https://github.com/johndoe/xat-syx`, use: `"https://johndoe.github.io"`
- If you have a custom domain, use that instead

### Step 4: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** tab → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

Add these two secrets:

#### Secret 1: CLOUDFLARE_API_TOKEN
- **Name:** `CLOUDFLARE_API_TOKEN`
- **Value:** Paste the Cloudflare API token from Step 2
- Click **"Add secret"**

#### Secret 2: GROQ_API_KEY
- **Name:** `GROQ_API_KEY`
- **Value:** Your Groq API key (from [console.groq.com](https://console.groq.com/keys))
- Click **"Add secret"**

⚠️ **IMPORTANT:** Never commit these values to any file. They stay only in GitHub's encrypted secrets storage.

### Step 5: Deploy the Worker

The first deployment must be manual to set up the Worker:

#### Option A: Using Wrangler CLI (Recommended for first deploy)

1. Install Node.js if you haven't: [https://nodejs.org/](https://nodejs.org/)

2. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

3. Login to Cloudflare:
   ```bash
   wrangler login
   ```

4. Navigate to the worker directory:
   ```bash
   cd worker
   ```

5. Deploy the Worker:
   ```bash
   wrangler deploy
   ```

6. Set the Groq API key as a secret (not in wrangler.toml):
   ```bash
   wrangler secret put GROQ_API_KEY
   ```
   When prompted, paste your Groq API key

7. Note the Worker URL displayed after deployment (e.g., `https://syx-chat-proxy.your-subdomain.workers.dev`)

#### Option B: Using GitHub Actions (After first manual deploy)

Once you've done the manual deploy above, all future deployments happen automatically via git push.

### Step 6: Update main.js with Worker URL

In `js/main.js`, find this line:

```javascript
const SYX_API_ENDPOINT = null; // Set this after deployment!
```

Replace it with your actual Worker URL:

```javascript
const SYX_API_ENDPOINT = "https://syx-chat-proxy.YOUR_SUBDOMAIN.workers.dev/chat";
```

**Important:** Include the `/chat` path at the end!

### Step 7: Commit and Push

```bash
git add .
git commit -m "Add Cloudflare Worker proxy for secure Groq API"
git push origin main
```

GitHub Actions will automatically redeploy the Worker whenever you push changes to the `/worker/**` directory.

---

## ✅ Verification Checklist

After setup, verify everything works:

1. **Worker is deployed:** Visit your Worker URL in a browser (without `/chat`) - should show 404 or error
2. **CORS is configured:** The Worker only accepts requests from your GitHub Pages domain
3. **Chat works:** Open your GitHub Pages site, click the V-Bot, send a message
4. **No API keys in browser:** Check browser DevTools → Network tab - no Groq API key should be visible in request headers
5. **Rate limiting works:** Send 20+ messages quickly - should get rate limited after ~20 requests/minute

---

## 🔄 Ongoing Workflow

### Do I need to touch Wrangler or Cloudflare dashboard again?

**No!** After the initial setup:

- ✅ **Just `git push`** - GitHub Actions automatically deploys Worker changes
- ✅ **Secrets are managed** - GROQ_API_KEY stays in GitHub Secrets, pushed securely during deploy
- ✅ **No manual intervention** needed for regular updates

### When would you need the Cloudflare dashboard?

Only for:
- Viewing analytics/logs (optional)
- Changing Worker settings (custom domains, etc.)
- Updating the API token if compromised

### Updating your Groq API key

If you need to rotate your Groq API key:

1. Generate a new key at [console.groq.com](https://console.groq.com/keys)
2. Update the `GROQ_API_KEY` secret in GitHub Settings → Secrets and variables → Actions
3. Trigger a new deployment by making any change to `/worker/**` files and pushing
4. OR manually run: `wrangler secret put GROQ_API_KEY` from the worker directory

---

## 🛡️ Security Features

✅ **API Key Never Exposed:** Groq key stored as Cloudflare Worker secret, never in git or browser  
✅ **CORS Protection:** Only your GitHub Pages domain can call the Worker  
✅ **Rate Limiting:** ~20 requests/minute per IP to prevent abuse  
✅ **Error Handling:** Generic error messages, never leaks upstream details  
✅ **Automated Deployment:** No manual steps after initial setup  

---

## 🐛 Troubleshooting

### "Authentication failed" error
- Verify `GROQ_API_KEY` secret is correctly set in GitHub Actions secrets
- Check that the Worker was deployed successfully (see GitHub Actions logs)

### "Rate limit exceeded" error
- Wait 60 seconds for the rate limit window to reset
- The limit is 20 requests per minute per IP address

### CORS errors in browser console
- Verify `ALLOWED_ORIGIN` in `worker/index.js` matches your GitHub Pages URL exactly
- Include protocol (`https://`) but no trailing slash

### Worker not deploying via GitHub Actions
- Check `.github/workflows/deploy-worker.yml` exists and is valid YAML
- Verify both secrets (`CLOUDFLARE_API_TOKEN` and `GROQ_API_KEY`) are set in GitHub repo settings
- Check the Actions tab for deployment logs and error messages

### Can't install Wrangler
- Make sure Node.js is installed: `node --version`
- Try: `npm install -g wrangler@latest`
- Or use npx: `npx wrangler deploy`

---

## 📝 File Structure

```
xat-syx/
├── .github/
│   └── workflows/
│       └── deploy-worker.yml      # Auto-deployment workflow
├── worker/
│   ├── index.js                   # Cloudflare Worker script
│   └── wrangler.toml              # Wrangler configuration
├── js/
│   └── main.js                    # Updated to use Worker endpoint
├── css/
├── index.html
└── main.html
```

---

## 💰 Costs

- **Cloudflare Workers:** Free tier includes 100,000 requests/day (more than enough for a personal site)
- **Groq API:** Currently free during beta (check [groq.com](https://groq.com/) for current pricing)
- **GitHub Actions:** Free for public repositories

Total cost: **$0/month** for typical personal site usage

---

## 🎯 Next Steps

1. Complete the setup steps above
2. Test the chat feature on your live site
3. Customize the system prompt in `worker/index.js` if desired
4. Adjust rate limits in the Worker if needed (currently 20 req/min)
5. Enjoy your secure, serverless AI chat! 🚀

---

**Questions?** Check the Cloudflare Workers docs: [developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
