/* ============================================================
   SYX // Ambient 3D backdrop — "The Continental Coin"
   A huge, dim, slowly-rotating gold coin sitting far behind the
   whole page. It drifts on its own, and gently tilts toward the
   mouse (or device tilt on touch) for a subtle parallax feel.
   Pauses when the Blood Oath toggle goes to EXILED (offline),
   matching the existing SYXBackground running-state pattern.
   ============================================================ */
(function(){
  const mount = document.getElementById('coin-canvas');
  if(!mount || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({ canvas: mount, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.AmbientLight(0x3a2c14, 0.9));
  const key = new THREE.PointLight(0xD4AF37, 3.2, 40);
  key.position.set(6, 5, 10);
  scene.add(key);
  const rim = new THREE.PointLight(0x9c1218, 1.4, 40);
  rim.position.set(-7, -4, 6);
  scene.add(rim);

  /* ---- build the coin: flat cylinder body + raised rim ring + inner sigil ring ---- */
  const coin = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2013, metalness: 0.85, roughness: 0.32,
    emissive: 0x3d2a06, emissiveIntensity: 0.35, transparent:true, opacity:0.16
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, metalness: 0.9, roughness: 0.25,
    emissive: 0xD4AF37, emissiveIntensity: 0.25, transparent:true, opacity:0.20
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.35, 72), bodyMat);
  body.rotation.x = Math.PI/2;
  coin.add(body);

  const outerRim = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.16, 16, 72), rimMat);
  coin.add(outerRim);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.045, 12, 64), rimMat);
  innerRing.position.z = 0.19;
  coin.add(innerRing);

  // a simple engraved "sigil" on the coin face — a hooded silhouette echo,
  // built from primitives so it reads at a distance without needing a texture
  const sigilMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, metalness:0.8, roughness:0.35, transparent:true, opacity:0.22
  });
  const sigilGroup = new THREE.Group();
  const hood = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.1, 32, 1, true), sigilMat);
  hood.rotation.x = Math.PI;
  hood.position.set(0, 0.15, 0.2);
  sigilGroup.add(hood);
  const hoodBase = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), sigilMat);
  hoodBase.position.set(0, -0.9, 0.2);
  sigilGroup.add(hoodBase);
  coin.add(sigilGroup);

  // twelve small tick marks around the rim, like a clock/compass — reinforces
  // the "High Table ledger" feel without needing an actual texture map
  const tickMat = new THREE.MeshBasicMaterial({ color:0xD4AF37, transparent:true, opacity:0.28 });
  for(let i=0;i<12;i++){
    const a = (i/12) * Math.PI*2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.4,0.06), tickMat);
    tick.position.set(Math.cos(a)*4.1, Math.sin(a)*4.1, 0.05);
    tick.rotation.z = a;
    coin.add(tick);
  }

  coin.scale.setScalar(1.9);
  coin.position.set(2.4, -0.6, -6);
  scene.add(coin);

  /* ---- interaction: mouse / touch parallax + idle auto-rotation ---- */
  let running = true;
  let mx = 0, my = 0;       // normalized -1..1
  let tmx = 0, tmy = 0;     // smoothed target

  function onPointer(x, y){
    tmx = (x / window.innerWidth - 0.5) * 2;
    tmy = (y / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener('mousemove', e => onPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if(e.touches && e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive:true });

  function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    if(!running){ renderer.render(scene, camera); return; }
    const t = clock.getElapsedTime();

    mx += (tmx - mx) * 0.03;
    my += (tmy - my) * 0.03;

    coin.rotation.y = t * 0.12 + mx * 0.35;
    coin.rotation.x = Math.sin(t*0.25) * 0.06 - my * 0.25;
    coin.position.x = 2.4 + mx * 0.6;
    coin.position.y = -0.6 - my * 0.4;

    const pulse = 0.9 + Math.sin(t*0.6)*0.1;
    key.intensity = 3.2 * pulse;

    renderer.render(scene, camera);
  }
  animate();

  // exposed so the Blood Oath toggle can pause/resume this layer too
  window.SYXCoinBackground = {
    setRunning(v){
      running = v;
      mount.style.opacity = v ? '1' : '0';
    }
  };
})();
