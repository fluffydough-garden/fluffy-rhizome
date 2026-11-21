/* 부드러운 지층 · Soft Strata — 3D 돌 (three.js)
   - load(stone)      : 돌 모양 하나를 불러와 크기 1(가장 긴 변)로 맞춘 원본 + 물리용 외곽 점들
   - makeStone(stone) : 글 하나의 돌(재질: 광택 돌 또는 유리질 보석). group > body(덜걱거림) > mesh
   - Rattle           : 마우스를 올리면 덜걱거리며 살짝 떠오르고, 떼면 툭 내려앉는 움직임
   - thumb(stone)     : 돌을 한 번 렌더한 그림(dataURL) — 글 패널·목록용
   - overlay(...)     : 리좀 지도 위에 돌을 한 캔버스로 그려요(지도 좌표 → 화면 픽셀)
   모델: media/stones/s01~s12.glb (strange stones o88 광택본: 불투명도 0.88 · BLEND · 양면, 텍스처 1024px WebP · 삼각형 절반 · meshopt).
   보석본은 모양·텍스처가 같아서 파일을 따로 두지 않고 여기서 재질만 바꿔요(GEM). 불투명도는 OPACITY 하나로 둘 다 조정. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

export { THREE };
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 돌 불투명도: 0.88 = 단단한 광물에 빛이 살짝 비침 (0.75 = 더 유리 같음, 0.95 = 거의 불투명) — o88 세트 값
export const OPACITY = .92;
// 유리질 보석 재질 (o88 gem 세트의 값: iridescence .85 · IOR 1.5 · 180–620nm · clearcoat .75/.05 · emissive .14)
export const GEM = { opacity: OPACITY, iridescence: .85, iridescenceIOR: 1.5, thickness: [180, 620], clearcoat: .75, clearcoatRoughness: .05, emissive: .14 };

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const shapes = new Map();

/* 모양 하나: 가운데 정렬 · 가장 긴 변 = 1 로 맞춘 원본(공유) + 외곽 점(물리 충돌·마우스 판정용) */
export function load(stone) {
  if (shapes.has(stone.src)) return shapes.get(stone.src);
  const pr = loader.loadAsync(stone.src).then(gltf => {
    const root = gltf.scene; root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const k = 1 / Math.max(sz.x, sz.y, sz.z);
    const norm = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
    const meshes = [], pts = [], v = new THREE.Vector3();
    root.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm, o.matrixWorld));
      g.computeBoundingSphere(); g.computeBoundingBox();
      meshes.push({ geometry: g, material: o.material });
      const pos = g.attributes.position, step = Math.max(1, Math.floor(pos.count / 700));
      for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i); pts.push(v.clone()); }
    });
    const hull = new ConvexGeometry(pts);   // 마우스 판정용 가벼운 껍질
    hull.computeBoundingSphere();
    const hp = hull.attributes.position, hullPts = new Float32Array(hp.count * 3);
    for (let i = 0; i < hp.count; i++) { hullPts[i * 3] = hp.getX(i); hullPts[i * 3 + 1] = hp.getY(i); hullPts[i * 3 + 2] = hp.getZ(i); }
    return { meshes, hull, hullPts, size: sz.multiplyScalar(k) };
  });
  shapes.set(stone.src, pr);
  return pr;
}

/* 글마다 색조를 조금씩: 텍스처 색을 hue(도)만큼 돌리고 채도를 sat배로. 밝기는 그대로라 돌의 결은 살아 있어요 */
const HUE_GLSL = `uniform float uHue; uniform float uSat;
vec3 stoneHue(vec3 c) { const vec3 k = vec3(0.57735); float a = uHue, ca = cos(a);
  c = c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return max(mix(vec3(l), c, uSat), 0.0); }
`;
function tintable(m, hue = 0, sat = 1) {
  if (!hue && sat === 1) return m;
  m.onBeforeCompile = sh => {
    sh.uniforms.uHue = { value: hue * Math.PI / 180 }; sh.uniforms.uSat = { value: sat };
    sh.fragmentShader = HUE_GLSL + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n  diffuseColor.rgb = stoneHue(diffuseColor.rgb);");
  };
  m.customProgramCacheKey = () => "stone-hue";
  return m;
}
function materialFor(src, gem, hue, sat) {
  // 무더기에서 앞뒤 돌이 뒤엉켜 보이지 않게 깊이는 기록해요(파일 권장값은 depthWrite=false지만, 0.88이면 이 편이 깔끔)
  if (!gem) { const m = src.clone(); m.transparent = true; m.opacity = OPACITY; m.depthWrite = true; m.side = THREE.DoubleSide; return tintable(m, hue, sat); }
  return tintable(new THREE.MeshPhysicalMaterial({
    map: src.map, normalMap: src.normalMap, normalScale: src.normalScale, roughnessMap: src.roughnessMap, metalnessMap: src.metalnessMap,
    roughness: Math.min(src.roughness ?? .4, .35), metalness: src.metalness ?? 0,
    iridescence: GEM.iridescence, iridescenceIOR: GEM.iridescenceIOR, iridescenceThicknessRange: GEM.thickness,
    clearcoat: GEM.clearcoat, clearcoatRoughness: GEM.clearcoatRoughness, specularIntensity: 1,
    emissive: 0xffffff, emissiveMap: src.map, emissiveIntensity: GEM.emissive,
    transparent: true, opacity: GEM.opacity, depthWrite: true, side: THREE.DoubleSide
  }), hue, sat);
}

/* 글 하나의 돌: group(물리·자리) > body(덜걱거림·뜨기) > mesh들. 재질은 돌마다 따로(투명도를 따로 바꾸려고) */
export async function makeStone(stone) {
  const S = await load(stone);
  const group = new THREE.Group(), body = new THREE.Group();
  group.add(body);
  const mats = [];
  S.meshes.forEach(m => { const mat = materialFor(m.material, stone.gem, stone.hue || 0, stone.sat ?? 1); mats.push(mat); const mesh = new THREE.Mesh(m.geometry, mat); mesh.castShadow = mesh.receiveShadow = true; body.add(mesh); });
  const hit = new THREE.Mesh(S.hull, new THREE.MeshBasicMaterial({ visible: false }));
  body.add(hit);
  group.userData = { stone, shape: S, body, hit, mats, rattle: new Rattle(stone.seed) };
  return group;
}
/* 포커스: v < 0 이면 어둡게 가라앉고(-1 = 가장 어둡게), v > 0 이면 밝게 떠올라요(1 = 가장 밝게). 0 = 원래대로 */
export const FOCUS = { dim: .72, lift: .35 };   // 가라앉을 때 줄이는 밝기 비율 · 떠오를 때 더하는 밝기 비율
export function setLight(group, v) {
  const { mats } = group.userData;
  if (group.userData.light === v) return; group.userData.light = v;
  const k = v < 0 ? 1 + v * FOCUS.dim : 1 + v * FOCUS.lift;
  mats.forEach(m => {
    if (!m.userData.c0) m.userData.c0 = { c: m.color.clone(), e: m.emissiveIntensity ?? 1 };
    m.color.copy(m.userData.c0.c).multiplyScalar(k);
    m.envMapIntensity = k;
    if (m.emissiveIntensity !== undefined) m.emissiveIntensity = m.userData.c0.e * Math.max(k, .2);
  });
}
export function setOpacity(group, a) {
  const { mats } = group.userData;
  mats.forEach(m => { const o = OPACITY * a; m.opacity = o; m.depthWrite = o > .5; });
}

/* 덜걱거림: hot이 되면 빠르게 좌우로 덜걱(점점 잦아듦) + 위로 살짝 떠올라 머물며 천천히 흔들려요.
   hot이 풀리면 툭 내려앉으면서 한 번 더 작게 덜걱. pose()는 body에 줄 위치·회전(돌 크기 1 기준). */
export class Rattle {
  constructor(seed = 0) { this.t = seed * 100; this.hot = false; this.lift = 0; this.kick = 0; this.ph = seed * 6.28; }
  set(h) { if (h === this.hot) return; this.hot = h; this.kick = h ? 1 : .55; }
  bump(k = .8) { this.kick = Math.max(this.kick, k); }
  step(dt) {
    this.t += dt;
    const target = this.hot ? 1 : 0;
    this.lift += (target - this.lift) * (1 - Math.exp(-dt * (this.hot ? 7 : 11)));
    this.kick *= Math.exp(-dt * 5.5);
    if (this.kick < .002) this.kick = 0;
  }
  get busy() { return this.kick > 0 || this.hot || this.lift > .002; }
  pose(out = { y: 0, rx: 0, ry: 0, rz: 0 }) {
    if (REDUCE) { out.y = this.lift * .1; out.rx = out.ry = out.rz = 0; return out; }
    const t = this.t, k = this.kick;
    // 덜걱: 두 박자가 엇갈리는 뾰족한 흔들림(사인을 각지게) — 돌이 제자리에서 부딪히는 느낌
    const sq = x => Math.tanh(Math.sin(x) * 3);
    const bob = this.lift * Math.sin(t * 2.2 + this.ph) * .012;
    out.y = this.lift * .14 + bob + k * .025 * Math.abs(Math.sin(t * 31));
    out.rx = k * .085 * sq(t * 43 + this.ph) + this.lift * .03 * Math.sin(t * 1.7 + this.ph);
    out.rz = k * .085 * sq(t * 37 + 1.3 + this.ph) + this.lift * .03 * Math.cos(t * 1.3 + this.ph);
    out.ry = k * .05 * sq(t * 29 + 2.1);
    return out;
  }
  apply(body, scale = 1) {
    const p = this.pose(_pose);
    body.position.set(0, p.y * scale, 0); body.rotation.set(p.rx, p.ry, p.rz);
  }
}
const _pose = { y: 0, rx: 0, ry: 0, rz: 0 };

/* 조명: 방 반사(neutral 환경광) + 위 왼쪽에서 비치는 차가운 별빛 + 아래 오른쪽의 따뜻한 반사광 */
export function lights(renderer, scene, o = {}) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = o.env ?? .75;
  const key = new THREE.DirectionalLight(0xdfe6ff, o.key ?? 2.2); key.position.set(-3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb48a, o.rim ?? .9); rim.position.set(4, -1, -3); scene.add(rim);
  return { key, rim };
}
export function makeRenderer(canvas, o = {}) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance", ...o });
  r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.setClearColor(0x000000, 0);
  return r;
}

/* ---------- 썸네일: 돌을 한 번 렌더한 그림 ---------- */
let TR = null;
const thumbs = new Map();
let queue = Promise.resolve();
export function thumb(stone, px = 256) {
  const key = stone.src + (stone.gem ? ":gem" : "") + ":" + (stone.hue || 0) + ":" + (stone.sat ?? 1) + ":" + px;
  if (thumbs.has(key)) return thumbs.get(key);
  const pr = queue = queue.then(async () => {
    if (!TR) {
      const cv = document.createElement("canvas");
      const renderer = makeRenderer(cv, { preserveDrawingBuffer: true });
      const scene = new THREE.Scene(); lights(renderer, scene, { env: .85 });
      const cam = new THREE.PerspectiveCamera(26, 1, .1, 20); cam.position.set(0, .5, 2.15); cam.lookAt(0, 0, 0);
      TR = { renderer, scene, cam };
    }
    const g = await makeStone(stone);
    g.rotation.set(.35 + stone.seed * .5, stone.seed * 6.28, .15);
    TR.renderer.setPixelRatio(1); TR.renderer.setSize(px, px, false);
    TR.scene.add(g); TR.renderer.render(TR.scene, TR.cam); TR.scene.remove(g);
    g.userData.mats.forEach(m => m.dispose());
    return TR.renderer.domElement.toDataURL("image/png");
  });
  queue = pr.catch(() => {});
  thumbs.set(key, pr);
  return pr;
}

/* ---------- 리좀 지도 위의 돌 ----------
   overlay(canvas, items): 매 프레임 items()가 [{ id, stone, x, y, px, hot, alpha }]를 돌려주면(화면 픽셀),
   돌마다 그 자리·크기로 그려요. 돌은 저마다 천천히 자전하고, hot이면 덜걱거리며 떠올라요. */
export function overlay(canvas, items) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); lights(renderer, scene);
  let W = 0, H = 0;
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -4000, 4000);
  const size = () => { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix(); };
  size(); addEventListener("resize", size);
  const live = new Map(), pending = new Set();
  let last = performance.now(), raf = 0;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const list = items(), seen = new Set();
    list.forEach((it, i) => {
      seen.add(it.id);
      const g = live.get(it.id);
      if (!g) { if (!pending.has(it.id)) { pending.add(it.id); makeStone(it.stone).then(s => { s.userData.born = performance.now(); live.set(it.id, s); scene.add(s); }).catch(() => {}).finally(() => pending.delete(it.id)); } return; }
      const u = g.userData, R = u.rattle, st = it.stone;
      const off = it.x < -it.px || it.x > W + it.px || it.y < -it.px || it.y > H + it.px;
      g.visible = !off; if (off) return;
      R.set(!!it.hot); R.step(dt);
      const grow = Math.min(1, (now - u.born) / 900), e = 1 - Math.pow(1 - grow, 3);
      const px = it.px * (.6 + .4 * e) * (1 + R.lift * .12);
      g.position.set(it.x, -it.y, it.hot ? 600 : i);
      g.scale.setScalar(px);
      if (!REDUCE) { g.rotation.y += dt * st.spin * (1 - R.lift * .85); g.rotation.x = .35 + Math.sin(now / 1000 * st.spin * .7 + st.seed * 6) * .25; }
      else if (!u.r0) { u.r0 = 1; g.rotation.set(.35, st.seed * 6.28, 0); }
      R.apply(u.body, 1);
      u.lv = (u.lv || 0) + ((it.light || 0) - (u.lv || 0)) * (1 - Math.exp(-dt * 8));
      setLight(g, Math.abs(u.lv) < .002 ? 0 : +u.lv.toFixed(3));
      setOpacity(g, (it.alpha ?? 1) * e);
    });
    live.forEach((g, id) => { if (!seen.has(id)) { scene.remove(g); live.delete(id); } });
    renderer.render(scene, cam);
  };
  raf = requestAnimationFrame(loop);
  return { renderer, scene, stop: () => cancelAnimationFrame(raf), get(id) { return live.get(id); } };
}
