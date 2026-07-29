/* ============================================================
   SYX // Page 2 — "The House of Baba Yaga"
   Radio (Web Audio API visualizer + volume) · Ghost Chat (Groq,
   with connection-state handling) · V-Bot (no-signal flicker) ·
   Day/Night VFX toggle (localStorage)
   ============================================================ */

/* ============================================================
   0. CHAT — talks to the Cloudflare Worker proxy below. The Worker
   holds the Groq key as a server-side secret (set via
   `wrangler secret put GROQ_API_KEY`); it never touches any
   browser, owner's or visitor's. Every visitor can chat immediately
   with zero setup on their end.
   ============================================================ */
const SYX_API_ENDPOINT = "https://syx-chat-proxy.syx-venom02.workers.dev/chat";

/* ============================================================
   1. RADIO
   ============================================================ */
/* TODO: swap these in for your final 3 real mp3 files once uploaded —
   currently pointing at the same placeholder audio for all 3 slots. */
const TRACKS = [
  { title:"HEART OF THE HUNTER",   artist:"babaYaga", src:"music/track1.mp3" },
  { title:"WHISPERS IN THE RAIN",  artist:"babaYaga", src:"music/track2.mp3" },
  { title:"ONLY SHADOWS REMAIN",   artist:"babaYaga", src:"music/track3.mp3" },
];

const audio = new Audio();
let trackIndex = 0;
let isPlaying = false;
let shuffled = false;
let repeatOn = false;
let liked = new Set(JSON.parse(localStorage.getItem('syx_liked') || '[]'));
// Web Audio API state — declared up here (not further down where it's used)
// because attemptPlay()/the play button can reference it before that later
// code would otherwise have run, which throws a temporal-dead-zone
// ReferenceError and silently kills the rest of the script.
let audioCtx, analyser, srcNode, freqData;

const els = {
  title: document.querySelector('.track-title'),
  sub: document.querySelector('.track-sub'),
  art: document.querySelector('.art'),
  wave: document.getElementById('wave'),
  curTime: document.getElementById('curTime'),
  durTime: document.getElementById('durTime'),
  playBtn: document.querySelector('.play-btn'),
  heart: document.querySelector('.heart'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  repeatBtn: document.getElementById('repeatBtn'),
  volSlider: document.getElementById('volumeSlider'),
  volIcon: document.getElementById('volIcon'),
};

const BAR_COUNT = 90;
const bars = [];
for(let i=0;i<BAR_COUNT;i++){
  const bar = document.createElement('span');
  bar.style.height = (20 + Math.random()*80) + '%';
  els.wave.appendChild(bar);
  bars.push(bar);
}

function fmtTime(sec){
  if(!isFinite(sec)) return "00:00";
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function loadTrack(i, autoplay){
  trackIndex = (i + TRACKS.length) % TRACKS.length;
  const t = TRACKS[trackIndex];
  const infoBlock = els.title.parentElement;
  infoBlock.classList.add('track-swap');
  setTimeout(()=>{
    audio.src = t.src;
    els.title.textContent = t.title;
    els.sub.textContent = t.artist;
    updateHeart();
    infoBlock.classList.remove('track-swap');
    if(autoplay){ attemptPlay(); }
  }, 180);
}

function updateHeart(){
  const t = TRACKS[trackIndex];
  els.heart.classList.toggle('on', liked.has(t.title));
  els.heart.textContent = liked.has(t.title) ? '♥' : '♡';
}

els.heart.addEventListener('click', ()=>{
  const t = TRACKS[trackIndex];
  if(liked.has(t.title)) liked.delete(t.title); else liked.add(t.title);
  localStorage.setItem('syx_liked', JSON.stringify([...liked]));
  updateHeart();
});

els.playBtn.addEventListener('click', ()=>{
  if(!audio.src) loadTrack(trackIndex, false);
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  if(isPlaying){ audio.pause(); } else { attemptPlay(); }
});

audio.addEventListener('play', ()=>{
  isPlaying = true;
  els.playBtn.textContent = '⏸';
  els.playBtn.classList.add('is-playing');
  els.art.classList.add('is-playing');
  els.wave.classList.remove('idle');
  startVisualizer();
  // Web Audio's AudioContext can start (or fall back to) a suspended state,
  // especially right after an autoplay attempt with no prior user gesture.
  // Because createMediaElementSource reroutes ALL of the <audio> element's
  // sound through this context, a suspended context means dead silence even
  // though the element itself is technically "playing". Always try to
  // wake it back up here.
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  // self-heal: if a previous attempt left the "no file" message showing,
  // a successful play means the track is fine after all — restore its title.
  const t = TRACKS[trackIndex];
  if(els.title.textContent === "NO AUDIO FILE FOUND"){
    els.title.textContent = t.title;
    els.sub.textContent = t.artist;
  }
});
audio.addEventListener('pause', ()=>{
  isPlaying = false;
  els.playBtn.textContent = '▶';
  els.playBtn.classList.remove('is-playing');
  els.art.classList.remove('is-playing');
  els.wave.classList.add('idle');
});
audio.addEventListener('error', ()=>{
  // a *genuine* load failure (bad path, unsupported codec, 404, etc.) —
  // as opposed to a transient autoplay-policy rejection, which is handled
  // separately in attemptPlay() and does NOT mean the file is missing.
  els.title.textContent = "NO AUDIO FILE FOUND";
  els.sub.textContent = "add mp3s to /music/";
});
audio.addEventListener('ended', ()=>{
  if(repeatOn){ audio.currentTime = 0; audio.play(); }
  else { nextTrack(); }
});
audio.addEventListener('timeupdate', ()=>{
  els.curTime.textContent = fmtTime(audio.currentTime);
  els.durTime.textContent = fmtTime(audio.duration);
  const ratio = audio.duration ? audio.currentTime/audio.duration : 0;
  bars.forEach((b, i)=> b.classList.toggle('played', i/BAR_COUNT < ratio));
});

document.getElementById('prevBtn').addEventListener('click', ()=> prevTrack());
document.getElementById('nextBtn').addEventListener('click', ()=> nextTrack());
els.shuffleBtn.addEventListener('click', ()=>{
  shuffled = !shuffled;
  els.shuffleBtn.classList.toggle('active', shuffled);
});
els.repeatBtn.addEventListener('click', ()=>{
  repeatOn = !repeatOn;
  els.repeatBtn.classList.toggle('active', repeatOn);
});
els.wave.addEventListener('click', (e)=>{
  if(!audio.duration) return;
  const rect = els.wave.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audio.currentTime = ratio * audio.duration;
});

function nextTrack(){
  const i = shuffled ? Math.floor(Math.random()*TRACKS.length) : trackIndex+1;
  loadTrack(i, true);
}
function prevTrack(){ loadTrack(trackIndex-1, true); }

/* ---- volume control ---- */
const savedVol = parseInt(localStorage.getItem('syx_volume') ?? '70', 10);
audio.volume = savedVol / 100;
els.volSlider.value = savedVol;
updateVolIcon(savedVol);

els.volSlider.addEventListener('input', ()=>{
  const v = parseInt(els.volSlider.value, 10);
  audio.volume = v / 100;
  audio.muted = false;
  localStorage.setItem('syx_volume', v);
  updateVolIcon(v);
});
els.volIcon.addEventListener('click', ()=>{
  audio.muted = !audio.muted;
  updateVolIcon(audio.muted ? 0 : parseInt(els.volSlider.value, 10));
});
function updateVolIcon(v){
  els.volIcon.textContent = (v === 0 || audio.muted) ? '🔇' : (v < 50 ? '🔉' : '🔊');
}

/* ---- autoplay handoff from the intro's "click to bond" gesture ----
   Browsers grant autoplay-with-sound when the navigation itself was
   triggered by a user gesture (the shatter click on index.html), but
   this isn't guaranteed on every browser/version. We try a real play()
   first; if it's rejected we fall back to the classic muted → play →
   unmute pattern, which autoplay policies always allow. */
function attemptPlay(){
  if(!audio.src) loadTrack(trackIndex, false);
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  const p = audio.play();
  if(p && typeof p.catch === 'function'){
    p.catch(()=>{
      audio.muted = true;
      audio.play().then(()=>{
        setTimeout(()=>{ audio.muted = false; updateVolIcon(parseInt(els.volSlider.value,10)); }, 300);
      }).catch(()=>{ /* still blocked — the 'error' listener will report a real load failure, if any */ });
    });
  }
}

els.wave.classList.add('idle');
loadTrack(0, false);

/* ---- local file:// notice ----
   Audio + CORS behave differently (worse) when the page is opened by
   double-clicking main.html straight from disk. Rather than let that show
   up as a silent, confusing "nothing works", say so directly on the page. */
if(location.protocol === 'file:'){
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:999; background:#3d0e0e; color:#f5ecd6; font:12px "Share Tech Mono",monospace; text-align:center; padding:8px 40px 8px 12px; border-bottom:1px solid var(--toxic);';
  bar.innerHTML = '⚠ Running from a local file — Chrome blocks audio loading over file://. Use a local server (e.g. <code>python -m http.server</code>) or open the deployed GitHub Pages link instead.';
  const x = document.createElement('span');
  x.textContent = '✕';
  x.style.cssText = 'position:absolute; right:12px; top:8px; cursor:pointer;';
  x.onclick = () => bar.remove();
  bar.appendChild(x);
  document.body.appendChild(bar);
}
if(sessionStorage.getItem('syx_bonded') === '1'){
  sessionStorage.removeItem('syx_bonded');
  attemptPlay();
}

/* ---- Web Audio API visualizer ----
   Skipped entirely on file:// (double-clicked local file testing): Chrome
   treats file: as a unique "null" origin, and the moment you connect an
   <audio> element to the Web Audio graph via createMediaElementSource, the
   browser starts requiring a CORS-clean fetch for that media — which a
   file:// URL can never satisfy (no server, no headers). The result isn't
   just "no visualizer", it's the whole track failing to load at all. Once
   this is hosted for real (GitHub Pages, any http/https host), same-origin
   audio has no such restriction and the real frequency visualizer runs. */
function startVisualizer(){
  if(location.protocol === 'file:') return; // CSS idle-breathing bars still look fine
  if(audioCtx){ if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{}); return; }
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    srcNode = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    srcNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    audioCtx.resume().catch(()=>{});
    tickVisualizer();
  }catch(err){ /* silent fallback to CSS-only bars */ }
}
function tickVisualizer(){
  requestAnimationFrame(tickVisualizer);
  if(!analyser || !isPlaying) return;
  analyser.getByteFrequencyData(freqData);
  const step = Math.floor(freqData.length / BAR_COUNT) || 1;
  bars.forEach((b, i)=>{
    const v = freqData[i*step] || 0;
    const h = 15 + (v/255)*85;
    if(!b.classList.contains('played')) b.style.height = h + '%';
  });
}

/* ============================================================
   2. GHOST CHAT (Cloudflare Worker proxy)
   ============================================================ */
const chatModal = document.getElementById('chat-modal');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const vbotWrap = document.getElementById('vbot-wrap');

let chatHistory = [];

function addMessage(who, text, self){
  const msg = document.createElement('div');
  msg.className = 'msg' + (self ? ' self' : '');
  const time = new Date().toTimeString().slice(0,5);
  msg.innerHTML = `<div class="who"><span class="dot"></span>${who} · ${time}</div><div class="bubble"></div>`;
  msg.querySelector('.bubble').textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
  return msg;
}

document.getElementById('chatClose').addEventListener('click', ()=> chatModal.classList.remove('open'));
vbotWrap.addEventListener('click', ()=> chatModal.classList.toggle('open'));

/* ---- signal state: dims + flickers the V-Bot if the Worker call fails ---- */
function setBotSignal(ok){
  vbotWrap.classList.toggle('no-signal', !ok);
}
setBotSignal(!!SYX_API_ENDPOINT);

function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  chatInput.value = '';
  addMessage('USER', text, false);
  chatHistory.push({ role:'user', content:text });

  const typingMsg = document.createElement('div');
  typingMsg.className = 'msg typing';
  typingMsg.innerHTML = `<div class="who"><span class="dot"></span>SYX</div><div class="bubble">...decoding signal</div>`;
  chatBody.appendChild(typingMsg);
  chatBody.scrollTop = chatBody.scrollHeight;

  fetch(SYX_API_ENDPOINT, {
    method:'POST',
    headers:{ 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: chatHistory })
  })
    .then(async res => {
      if(!res.ok){
        let reason = "connection severed";
        if(res.status === 401 || res.status === 403) reason = "authentication failed";
        else if(res.status === 429) reason = "rate limited — please wait";
        else if(res.status >= 500) reason = "the relay is down";
        const err = new Error(reason);
        err.userMessage = reason;
        throw err;
      }
      return res.json();
    })
    .then(data => {
      typingMsg.remove();
      const reply = data?.reply?.trim() || "...signal lost.";
      addMessage('SYX', reply, true);
      chatHistory.push({ role:'assistant', content:reply });
      setBotSignal(true);
    })
    .catch(err => {
      typingMsg.remove();
      const isNetwork = !err.userMessage;
      const msg = isNetwork ? "network down — no signal reaches SYX." : err.userMessage + ".";
      addMessage('SYX', msg.charAt(0).toUpperCase() + msg.slice(1), true);
      setBotSignal(false);
    });
}
chatSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendChat(); });

/* ============================================================
   3. V-BOT — mini three.js sphere, bottom-left, blinking eyes
   ============================================================ */
(function initBot(){
  const canvas = document.getElementById('vbot-canvas');
  if(!canvas || typeof THREE === 'undefined') return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 3.2;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(78,78);

  scene.add(new THREE.PointLight(0xD4AF37, 3.6, 10).translateX(2).translateY(2).translateZ(2));
  scene.add(new THREE.PointLight(0xD4AF37, 1.6, 10).translateX(-1.5).translateY(-1).translateZ(2));
  scene.add(new THREE.AmbientLight(0x4a3a20, 0.9));

  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const vx=pos.getX(i), vy=pos.getY(i), vz=pos.getZ(i);
    const len = Math.sqrt(vx*vx+vy*vy+vz*vz);
    const spike = 1 + Math.random()*0.18;
    pos.setXYZ(i, vx/len*spike, vy/len*spike, vz/len*spike);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color:0x2a2013, emissive:0xd4af37, emissiveIntensity:0.9, flatShading:true, roughness:0.4, metalness:0.5 });
  const bot = new THREE.Mesh(geo, mat);
  scene.add(bot);

  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color:0xffffff });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.3, 0.15, 0.85);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.3, 0.15, 0.85);
  bot.add(eyeL, eyeR);

  const clock = new THREE.Clock();
  let blinkAt = 2 + Math.random()*3;
  let boomUntil = 0;
  document.addEventListener('syx:boom', ()=>{ boomUntil = clock.getElapsedTime() + 0.6; });

  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    bot.rotation.y = Math.sin(t*0.6)*0.4;
    bot.position.y = Math.sin(t*1.4)*0.08;

    if(t < boomUntil){
      // rapid excited flicker-blink when Ghost Protocol fires
      eyeL.scale.y = eyeR.scale.y = (Math.sin(t*45) > 0) ? 1 : 0.1;
      bot.rotation.z = Math.sin(t*30) * 0.06;
    } else {
      bot.rotation.z = 0;
      // regular blink
      if(t > blinkAt){
        eyeL.scale.y = eyeR.scale.y = 0.1;
        if(t > blinkAt + 0.12){ blinkAt = t + 2 + Math.random()*3; eyeL.scale.y = eyeR.scale.y = 1; }
      }
    }
    // extra rapid flicker + dimmed emissive while no-signal (CSS class drives opacity;
    // this drives the eye color itself so it reads as "glitching" rather than just faded)
    if(vbotWrap.classList.contains('no-signal')){
      const flicker = Math.random() > 0.9 ? 0.15 : 1;
      eyeMat.color.setScalar(flicker);
      mat.emissiveIntensity = 0.25 + Math.random()*0.15;
    } else {
      eyeMat.color.setScalar(1);
      mat.emissiveIntensity = 0.8 + Math.sin(t*1.6)*0.15;
    }

    renderer.render(scene, camera);
  }
  animate();
})();

/* ============================================================
   4. DAY / NIGHT VFX TOGGLE (persisted)
   ============================================================ */
const venomTrack = document.getElementById('venomTrack');
const venomThumb = document.getElementById('venomThumb');
const venomSub = document.getElementById('venomSub');
const venomEnds = document.querySelectorAll('.venom-end');

function applyMode(mode){
  venomThumb.classList.toggle('on', mode === 'online');
  venomEnds.forEach(e => e.classList.toggle('active', e.dataset.mode === mode));
  venomSub.textContent = mode === 'online' ? 'the oath holds' : 'the marker is torn';
  if(window.SYXBackground) window.SYXBackground.setRunning(mode === 'online');
  if(window.SYXCoinBackground) window.SYXCoinBackground.setRunning(mode === 'online');
  document.body.classList.toggle('vfx-off', mode === 'offline');
  localStorage.setItem('syx_mode', mode);
}

function toggleModeWithFeedback(mode){
  applyMode(mode);
  venomThumb.classList.remove('sliding'); void venomThumb.offsetWidth;
  venomThumb.classList.add('sliding');
  setTimeout(()=> venomThumb.classList.remove('sliding'), 550);
}

venomTrack.addEventListener('click', (e)=>{
  const currentlyOn = venomThumb.classList.contains('on');
  // clicking a specific end jumps straight to that state; clicking
  // empty track space just flips whichever state is currently active
  const clickedEnd = e.target.closest('.venom-end');
  const nextMode = clickedEnd ? clickedEnd.dataset.mode : (currentlyOn ? 'offline' : 'online');
  toggleModeWithFeedback(nextMode);
});

applyMode(localStorage.getItem('syx_mode') || 'online');
applyMode(localStorage.getItem('syx_mode') || 'online');

/* ============================================================
   5. HEADER STATS — live leveling since deploy, count-up numbers,
   and the Ghost Protocol button's quote + boom
   ============================================================ */

/* ---- real-time level/EXP, driven purely by wall-clock time ----
   No backend, no localStorage — every visitor sees the same level,
   because it's just "how long has SYX been live" measured from a
   fixed point in time. Set this to your actual go-live date once
   you push to GitHub; until then it'll just start counting from
   whatever this placeholder is set to. */
const SYX_GENESIS = new Date("2026-07-04T00:00:00Z"); // ← set to your real deploy date/time

const levelLabel = document.getElementById('levelLabel');
const levelFill = document.getElementById('levelFill');
const expLabel = document.getElementById('expLabel');
let lastLevel = -1;

function tickLevel(){
  const msElapsed = Math.max(0, Date.now() - SYX_GENESIS.getTime());
  const daysElapsed = msElapsed / 86400000;
  const level = Math.floor(daysElapsed);
  const frac = daysElapsed - level; // 0..1 progress through the current day

  const fracDigits = String(Math.floor(frac * 1000)).padStart(3, '0');
  levelLabel.textContent = `LEVEL ${level}.${fracDigits}`;

  const pct = (frac * 100).toFixed(2) + '%';
  levelFill.style.width = pct;

  const expVal = Math.floor(frac * 99999);
  expLabel.textContent = `EXP ${expVal.toLocaleString()} / 99,999`;

  if(lastLevel !== -1 && level > lastLevel){
    levelFill.classList.remove('level-up'); void levelFill.offsetWidth;
    levelFill.classList.add('level-up');
  }
  lastLevel = level;
}
tickLevel();
setInterval(tickLevel, 1000);

/* ---- count-up animation for the corner stats on load ---- */
function countUp(el, target, opts={}){
  const dur = opts.duration || 1300;
  const suffix = opts.suffix || '';
  const format = opts.format || (v => Math.floor(v).toLocaleString());
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = format(target * eased) + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
countUp(document.getElementById('uploadsVal'), 108);
countUp(document.getElementById('followersVal'), 8880, {
  format: v => (v/1000).toFixed(2) + 'K'
});
countUp(document.getElementById('signalVal'), 100, { suffix:'%' });

/* ---- live session uptime, ticking since this page loaded ---- */
const uptimeEl = document.getElementById('uptimeVal');
const sessionStart = performance.now();
function tickUptime(){
  const s = Math.floor((performance.now() - sessionStart) / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  uptimeEl.textContent = `${hh}:${mm}:${ss}`;
}
tickUptime();
setInterval(tickUptime, 1000);

/* ---- Ghost Protocol: click for a surprise quote + a "boom" ---- */
const GHOST_QUOTES = [
  "A marker was called. A debt was owed. I always pay my debts.",
  "The High Table does not forgive. Neither do I.",
  "Every coin has a price. Mine is steeper than most.",
  "They call me the Boogeyman. I call it a Tuesday.",
  "Excommunicado means nothing to a ghost with nothing left to lose.",
  "No business is conducted here. Only consequences.",
  "The candle is lit. The Table is watching. So am I.",
  "Rules keep us civilized. I am not always civilized.",
  "You don't find me. I find you, when the ledger comes due.",
  "Blood is the only currency the Table truly respects.",
  "I was excommunicado once. I came back anyway.",
  "The Continental has rules. I have exceptions.",
  "Somewhere, a bell tolls for whoever sent you.",
  "The Baba Yaga does not knock twice."
];
let lastQuoteIdx = -1;

const ghostBtn = document.getElementById('ghostProtocolBtn');
const boomFlash = document.getElementById('boom-flash');
const glitchOverlay = document.getElementById('glitch-overlay');
const staticOverlay = document.getElementById('static-overlay');
const crackOverlay = document.getElementById('crack-overlay');
const ghostQuote = document.getElementById('ghost-quote');
const stageEl = document.querySelector('.stage');
let quoteHideTimer = null;
let lastVariantIdx = -1;

// Each variant fires a different combination of visual effects, so
// clicking twice in a row rarely looks the same. The quote and the
// animation are randomized independently of each other.
const BOOM_VARIANTS = [
  () => { // flash + shake
    boomFlash.classList.remove('fire'); void boomFlash.offsetWidth;
    boomFlash.classList.add('fire');
    stageEl.classList.remove('shake'); void stageEl.offsetWidth;
    stageEl.classList.add('shake');
  },
  () => { // glitch bars
    glitchOverlay.classList.remove('fire'); void glitchOverlay.offsetWidth;
    glitchOverlay.classList.add('fire');
    stageEl.classList.remove('shake'); void stageEl.offsetWidth;
    stageEl.classList.add('shake');
  },
  () => { // static burst
    staticOverlay.classList.remove('fire'); void staticOverlay.offsetWidth;
    staticOverlay.classList.add('fire');
    boomFlash.classList.remove('fire'); void boomFlash.offsetWidth;
    boomFlash.classList.add('fire');
  },
  () => { // crack lines
    crackOverlay.classList.remove('fire'); void crackOverlay.offsetWidth;
    crackOverlay.classList.add('fire');
  },
];

function fireGhostProtocol(){
  // pick a quote, avoiding an immediate repeat
  let idx;
  do { idx = Math.floor(Math.random() * GHOST_QUOTES.length); } while (idx === lastQuoteIdx && GHOST_QUOTES.length > 1);
  lastQuoteIdx = idx;

  // pick a boom animation variant, also avoiding an immediate repeat
  let vIdx;
  do { vIdx = Math.floor(Math.random() * BOOM_VARIANTS.length); } while (vIdx === lastVariantIdx && BOOM_VARIANTS.length > 1);
  lastVariantIdx = vIdx;
  BOOM_VARIANTS[vIdx]();

  // let the V-Bot react, if it's listening
  document.dispatchEvent(new CustomEvent('syx:boom'));

  // show the quote toast
  clearTimeout(quoteHideTimer);
  ghostQuote.textContent = GHOST_QUOTES[idx];
  ghostQuote.classList.remove('hide');
  ghostQuote.classList.add('show');

  quoteHideTimer = setTimeout(()=>{
    ghostQuote.classList.remove('show');
    ghostQuote.classList.add('hide');
  }, 3200);
}
ghostBtn.addEventListener('click', fireGhostProtocol);
ghostQuote.addEventListener('click', ()=>{
  clearTimeout(quoteHideTimer);
  ghostQuote.classList.remove('show');
  ghostQuote.classList.add('hide');
});
