/* ============================================================
   SYX // Page 1 — "The Boogeyman Awakens"
   Blood drips → Baba Yaga's cloaked form (spiky icosahedron,
   mouse-tracking, breathing pulse) → Reveal text → Click → Shatter
   ============================================================ */

/* ---------- vein drips ---------- */
const veinsEl = document.getElementById('veins');
const dripCount = 26;
for(let i=0;i<dripCount;i++){
  const d = document.createElement('div');
  d.className = 'drip';
  d.style.left = (Math.random()*100) + 'vw';
  d.style.width = (1 + Math.random()*2.5) + 'px';
  d.style.animationDuration = (1.4 + Math.random()*1.4) + 's';
  d.style.animationDelay = (Math.random()*0.6) + 's';
  veinsEl.appendChild(d);
}

/* ---------- three.js scene ---------- */
let scene, camera, renderer, symbiote, clock;
let mouseX = 0, mouseY = 0;
let shattered = false;
let particleSystem = null;

function initScene(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene-canvas'), antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const key = new THREE.PointLight(0xD4AF37, 3.2, 20);
  key.position.set(3, 3, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xb3141c, 1.2, 20);
  rim.position.set(-4, -2, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x0a0a0a));

  const geo = new THREE.IcosahedronGeometry(1.7, 4);
  const posAttr = geo.attributes.position;
  for(let i=0;i<posAttr.count;i++){
    const vx = posAttr.getX(i), vy = posAttr.getY(i), vz = posAttr.getZ(i);
    const len = Math.sqrt(vx*vx+vy*vy+vz*vz);
    const spike = 1 + (Math.random()*0.22) * (Math.sin(i*12.9898)*0.5+0.5);
    posAttr.setXYZ(i, vx/len*1.7*spike, vy/len*1.7*spike, vz/len*1.7*spike);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d, metalness: 0.75, roughness: 0.35,
    emissive: 0x3d2a06, emissiveIntensity: 0.6, flatShading: true
  });

  symbiote = new THREE.Mesh(geo, mat);
  scene.add(symbiote);

  const wireGeo = new THREE.IcosahedronGeometry(1.85, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color:0xD4AF37, wireframe:true, transparent:true, opacity:0.12 });
  symbiote.add(new THREE.Mesh(wireGeo, wireMat));

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, {passive:true});
  window.addEventListener('click', onBond);
  window.addEventListener('touchstart', onBond, {passive:true});

  animate();
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function onMouseMove(e){
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}
function onTouchMove(e){
  if(!e.touches || !e.touches[0]) return;
  mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
}

function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if(symbiote && !shattered){
    symbiote.rotation.y += (mouseX*0.6 - symbiote.rotation.y) * 0.04;
    symbiote.rotation.x += (-mouseY*0.4 - symbiote.rotation.x) * 0.04;
    const breathe = 1 + Math.sin(t*1.1)*0.035;
    symbiote.scale.set(breathe, breathe, breathe);
    symbiote.material.emissiveIntensity = 0.5 + Math.sin(t*1.1)*0.25;
    symbiote.rotation.z = Math.sin(t*0.2)*0.05;
  }

  if(particleSystem){
    const posArr = particleSystem.geometry.attributes.position.array;
    const velArr = particleSystem.userData.velocities;
    for(let i=0;i<posArr.length;i+=3){
      velArr[i]   *= 1.01;
      velArr[i+1] *= 1.01;
      velArr[i+2] *= 1.01;
      posArr[i]   += velArr[i];
      posArr[i+1] += velArr[i+1];
      posArr[i+2] += velArr[i+2];
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.material.opacity *= 0.965;
  }

  renderer.render(scene, camera);
}

/* ---------- shatter + redirect ---------- */
function onBond(){
  if(shattered) return;
  shattered = true;

  const srcPos = symbiote.geometry.attributes.position;
  const count = srcPos.count;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count*3);
  const velocities = new Float32Array(count*3);
  const m = symbiote.matrixWorld;

  for(let i=0;i<count;i++){
    const v = new THREE.Vector3(srcPos.getX(i), srcPos.getY(i), srcPos.getZ(i));
    v.applyMatrix4(m);
    positions[i*3] = v.x; positions[i*3+1] = v.y; positions[i*3+2] = v.z;
    const dir = v.clone().normalize();
    const speed = 0.03 + Math.random()*0.05;
    velocities[i*3]   = dir.x*speed + (Math.random()-0.5)*0.02;
    velocities[i*3+1] = dir.y*speed + (Math.random()-0.5)*0.02;
    velocities[i*3+2] = dir.z*speed + (Math.random()-0.5)*0.02;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pMat = new THREE.PointsMaterial({
    color: 0xD4AF37, size: 0.045, transparent:true, opacity:1,
    blending: THREE.AdditiveBlending, depthWrite:false
  });

  particleSystem = new THREE.Points(pGeo, pMat);
  particleSystem.userData.velocities = velocities;
  scene.add(particleSystem);
  scene.remove(symbiote);

  document.getElementById('flash').classList.add('hit');
  document.getElementById('textLayer').classList.remove('show');

  // Carries the user gesture forward: main.js sees this flag and knows
  // it's safe to attempt audio playback immediately (with a muted->unmuted
  // fallback if the browser still blocks it after navigation).
  sessionStorage.setItem('syx_bonded', '1');

  setTimeout(()=>{ window.location.href = 'main.html'; }, 850);
}

/* ---------- sequence timing ---------- */
setTimeout(()=>{
  document.getElementById('scene-canvas').classList.add('visible');
  initScene();
}, 1600);

setTimeout(()=>{ document.getElementById('veins').classList.add('fade'); }, 1600);
setTimeout(()=>{ document.getElementById('textLayer').classList.add('show'); }, 2900);

/* ---------- mobile fallback ---------- */
if(window.innerWidth < 768){
  document.getElementById('headline').textContent = 'THE BOOGEYMAN STIRS';
  document.getElementById('subtext').textContent = 'TAP THE COIN TO ENTER';
}
