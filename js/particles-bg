/* ============================================================
   SYX // Shared ambient particle + vein background
   Renders on <canvas id="bg-canvas"> via 2D context (lightweight,
   used on main.html for the ONLINE / night-mode state).
   ============================================================ */

(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, running = true;
  let particles = [];

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function buildParticles(count){
    particles = Array.from({length: count}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.6 + 0.4,
      vx: (Math.random()-0.5)*0.15,
      vy: (Math.random()-0.5)*0.15,
      a: Math.random()*0.5+0.15
    }));
  }
  buildParticles(90);

  // a handful of faint, slow-drifting crack/vein lines — subtle, not busy
  function buildVeins(count){
    return Array.from({length: count}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      len: 60 + Math.random()*140,
      angle: Math.random()*Math.PI*2,
      speed: 0.03 + Math.random()*0.05,
      phase: Math.random()*Math.PI*2
    }));
  }
  let veins = buildVeins(5);

  let t0 = performance.now();

  function draw(){
    if(!running){
      // OFFLINE / day mode: static dark bg, no particles
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0,0,W,H);
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#050805';
    ctx.fillRect(0,0,W,H);

    const t = (performance.now() - t0) / 1000;
    const breathe = 0.75 + Math.sin(t*0.35)*0.25; // slow, gentle — not a strobe

    const g = ctx.createRadialGradient(W/2, H*0.32, 20, W/2, H*0.32, Math.max(W,H)*0.5);
    g.addColorStop(0, `rgba(212,175,55,${0.06*breathe})`);
    g.addColorStop(1,'rgba(212,175,55,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // faint drifting veins — a handful, slow, low opacity
    veins.forEach(v=>{
      const wobble = Math.sin(t*v.speed + v.phase) * 30;
      const x2 = v.x + Math.cos(v.angle)*v.len + wobble;
      const y2 = v.y + Math.sin(v.angle)*v.len;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(212,175,55,${0.05 + 0.03*Math.sin(t*v.speed*2 + v.phase)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(212,175,55,${p.a})`;
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 4;
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }
  draw();

  // exposed so main.js can flip VFX with the day/night toggle
  window.SYXBackground = {
    setRunning(v){ running = v; },
    isRunning(){ return running; }
  };
})();
