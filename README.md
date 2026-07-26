# SYX // The House of Baba Yaga

A two-page, John Wick / Baba Yaga-themed, xat.me-compatible profile experience.

- **`index.html`** — Cinematic 3D intro ("The Boogeyman Stirs"). Click (or tap) the cloaked figure to shatter it and enter.
- **`main.html`** — The hub: radio, Marker Chat (Groq-powered), V-Bot, Blood Oath day/night VFX toggle.

## 🔑 Chat: two ways to bond SYX to Groq

**Default — just a key (recommended, zero deploy):**
Click ⚙ next to Marker Chat, paste a free Groq API key from
[console.groq.com/keys](https://console.groq.com/keys), and SYX talks straight
from the browser to Groq. Nothing to deploy. The key lives only in that
browser's `localStorage` and is only ever sent to `api.groq.com`.
⚠️ Trade-off: anyone using devtools on that browser could see the key. Fine
for a personal page; not fine if you're worried about strangers burning your
free-tier quota.

**Optional — Cloudflare Worker proxy (more secure):**
Deploy `worker/index.js` (see `WORKER_SETUP.md` / `QUICK_START.md`), set
`GROQ_API_KEY` as a server-side secret, then set `SYX_API_ENDPOINT` in
`js/main.js` to your Worker URL. The key never touches the browser at all.
If `SYX_API_ENDPOINT` is set, it's used automatically instead of the local key.

## File structure

```
/xat-syx/
├── index.html
├── main.html
├── css/
│   ├── style.css        # shared theme, layout, both pages
│   └── animations.css   # entry stagger + micro-interactions
├── js/
│   ├── intro.js          # Page 1 — Three.js cloak/shatter sequence
│   ├── main.js            # Page 2 — radio, chat, v-bot, toggle
│   └── particles-bg.js   # shared ambient background (2D canvas)
├── worker/
│   ├── index.js           # optional Cloudflare Worker (Groq API proxy)
│   └── wrangler.toml      # Wrangler configuration
├── .github/
│   └── workflows/
│       └── deploy-worker.yml  # Auto-deployment workflow (only if using the Worker)
├── music/
│   └── track1.mp3 … track5.mp3   ← add your 5 songs here
├── img/
│   ├── avatar.gif        ← add your animated profile pic here
│   └── icons/
├── QUICK_START.md        # 5-minute setup guide (Worker path)
├── WORKER_SETUP.md       # Detailed documentation (Worker path)
└── README.md
```

## Setup

1. **Add your music.** Drop 5 mp3 files into `/music/` named `track1.mp3` … `track5.mp3`
   (or edit the `TRACKS` array at the top of `js/main.js` to point at your own filenames/titles).
2. **Add your avatar.** Drop `avatar.gif` into `/img/`, then uncomment the
   `<img class="avatar-img" ...>` line inside the `.sigil-wrap` in `main.html`.
3. **Bond the bot.** Open the site, click the V-Bot (or ⚙ in Marker Chat), paste
   your Groq key, save. That's it — no deploy needed for this path.
4. *(Optional, more secure)* Deploy the Cloudflare Worker per `QUICK_START.md`
   and set `SYX_API_ENDPOINT` in `js/main.js`.

## Deploy to GitHub Pages

```
git init
git add .
git commit -m "syx hub v1"
git branch -M main
git remote add origin https://github.com/YOURUSER/xat-syx.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Deploy from branch → main / (root)**.
Your site will be live at `https://YOURUSER.github.io/xat-syx/`.

## Embed in xat.me

In your xat.me **Media Box**:

```html
<iframe src="https://YOURUSER.github.io/xat-syx/" width="100%" height="960" frameborder="0" scrolling="no"></iframe>
```

In the xat.me **CSS box** (requires Mepower):

```css
#xatstyme { margin:0!important; padding:0!important; width:100vw!important; }
#xatstyme .xatmedialayer { width:100%!important; }
#xatmenu { transform:scale(0.6); }
```

## Notes

- Mobile (`<768px`) automatically simplifies the intro copy; the hub layout
  reflows to a single column.
- No login, no chat persistence — Groq is stateless per session, by design.
- The day/night VFX toggle state is saved to `localStorage` and restored on load.
- **Security:** by default your Groq key lives in this browser's `localStorage`
  only (see the trade-off note above). Deploy the optional Worker proxy if you
  need the key to never touch the browser at all.
