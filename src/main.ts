import * as THREE from 'three';
import './style.css';
import { advanceHistory, archaeologyRecover, createHistory, recordDistrictDamage, recordEvent, type CampaignHistory } from './history';
import { simulateDeepTime, type DeepTimeState } from './deepTime';
import { Action, createInputState, REBINDABLE_ACTIONS, type GameAction } from './input';
import { applyStructureImpact, applySupportLoad, createStructureState, type StructureState } from './destruction';
import { applyDamage, type CombatState } from './combat';
import { createBattleOutcome, type BattleOutcome } from './battleOutcome';
import { advanceCityCentury, computeActivityCounts, createCityState, markLandmarkDamaged, projectPublicMemory, rebuildLandmark, type CityState } from './city';
import { createFrameBudgetState, qualityProfile, stepFrameBudget, type FrameBudgetState, type QualityLevel, type QualityTierSetting } from './quality';
import { loadSettings, saveSettings, type PersistedSettings } from './settings';
import { createSpatialGrid, insertIntoGrid, occupiedCellCount, queryGridBounds, type SpatialGrid } from './spatialGrid';

type Building = { id: string; mesh: THREE.Mesh; x: number; z: number; width: number; depth: number; height: number; baseHeight: number; originalColor: number; wallRunnable: boolean; climbable: boolean; grapple: boolean; structure: StructureState };
type PublicMemoryVisual = { markerId: string; mesh: THREE.Mesh; x: number; z: number; inscription: string };
type MaterialLineageVisual = { parcelId: string; mesh: THREE.Mesh };
type Reconstruction = { building: Building; startHeight: number; targetHeight: number; startColor: THREE.Color; targetColor: THREE.Color; elapsed: number; duration: number };
type RubbleBody = { mesh: THREE.Mesh; velocity: THREE.Vector3; angular: THREE.Vector3; settled: boolean };
type Scar = { x: number; z: number; year: number; radius: number; mesh: THREE.Mesh };
type WallContact = { building: Building; normal: THREE.Vector3; proximity: number; signedDistance: number; tangentSpeed: number; approachSpeed: number; side: string };
type Debris = { id: string; mesh: THREE.Mesh; velocity: THREE.Vector3; surfable: boolean; age: number; active: boolean; respawn: number; origin: THREE.Vector3; initialVelocity: THREE.Vector3 };
type TraversalState = { wallRun: boolean; wallClimb: boolean; mantling: boolean; gliding: boolean; diving: boolean; surfing: boolean; rebound: boolean; impactRecovery: boolean; wallContact: boolean; wallSurfaceId: string | null; wallSide: string | null; wallTime: number; grapple: boolean; grappleTarget: boolean };

const settings: PersistedSettings = loadSettings();
const input = createInputState(settings.bindings);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#09131d'); scene.fog = new THREE.Fog('#09131d', 45, 280);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 520);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; document.querySelector('#app')?.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight('#c9efff', '#18212b', 1.55)); const sun = new THREE.DirectionalLight('#ffe0a4', 2.2); sun.position.set(-45, 80, 25); sun.castShadow = true; scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 280), new THREE.MeshStandardMaterial({ color: '#17252d', roughness: .92 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const roadMaterial = new THREE.MeshStandardMaterial({ color: '#293b43', roughness: .95 });
for (const z of [-84, 0, 84]) { const road = new THREE.Mesh(new THREE.BoxGeometry(340, .08, 15), roadMaterial); road.position.set(0, .04, z); scene.add(road); }
for (const x of [-100, 0, 100]) { const road = new THREE.Mesh(new THREE.BoxGeometry(15, .08, 280), roadMaterial); road.position.set(x, .05, 0); scene.add(road); }
const buildings: Building[] = []; const rubble: RubbleBody[] = []; const colors = ['#557585', '#71838b', '#8a7564', '#526b7a'];
for (let row = -1; row <= 1; row++) for (let col = -2; col <= 2; col++) { if (row === 0 && col === 0) continue; const width = 23 + ((row + col + 8) % 3) * 5, depth = 22 + ((row * 3 + col + 12) % 3) * 4, height = 16 + ((row * 7 + col * 11 + 50) % 5) * 7, x = col * 50, z = row * 70; const color = new THREE.Color(colors[(row + col + 8) % colors.length]); const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color, roughness: .76 })); mesh.position.set(x, height / 2, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); const id = `building-${col + 2}-${row + 1}`; buildings.push({ id, mesh, x, z, width, depth, height, baseHeight: height, originalColor: color.getHex(), wallRunnable: true, climbable: true, grapple: true, structure: createStructureState(id, 100) }); }
const traversalTower = { id: 'traversal-tower', x: 0, z: 0, width: 26, depth: 22, height: 16, baseHeight: 16, originalColor: new THREE.Color('#6e8490').getHex(), wallRunnable: true, climbable: true, grapple: true, mesh: new THREE.Mesh(new THREE.BoxGeometry(26, 16, 22), new THREE.MeshStandardMaterial({ color: '#6e8490', roughness: .72 })), structure: createStructureState('traversal-tower', 100) }; traversalTower.mesh.position.set(0, 8, 0); traversalTower.mesh.castShadow = true; traversalTower.mesh.receiveShadow = true; scene.add(traversalTower.mesh); buildings.push(traversalTower);
const traversalTowerEast = { id: 'traversal-tower-east', x: 30, z: 0, width: 16, depth: 22, height: 20, baseHeight: 20, originalColor: new THREE.Color('#8c765f').getHex(), wallRunnable: true, climbable: true, grapple: true, mesh: new THREE.Mesh(new THREE.BoxGeometry(16, 20, 22), new THREE.MeshStandardMaterial({ color: '#8c765f', roughness: .72 })), structure: createStructureState('traversal-tower-east', 100) }; traversalTowerEast.mesh.position.set(30, 10, 0); traversalTowerEast.mesh.castShadow = true; traversalTowerEast.mesh.receiveShadow = true; scene.add(traversalTowerEast.mesh); buildings.push(traversalTowerEast);
// Spatial partitioning: buildings never move (even collapsed ones keep their footprint id),
// so a grid built once from the static layout lets proximity queries (wall search, shockwave
// neighbor propagation, grapple target search) scan only nearby cells instead of every
// building in the city. `activeChunkCount` in the observation hook reports the real number of
// occupied cells this grid produced, rather than a placeholder.
const buildingGrid: SpatialGrid = createSpatialGrid(40);
const buildingsById = new Map<string, Building>();
function nearbyBuildings(x: number, z: number, radius: number): Building[] {
  const ids = queryGridBounds(buildingGrid, x, z, radius);
  const result: Building[] = [];
  for (const id of ids) { const b = buildingsById.get(id); if (b) result.push(b); }
  return result;
}
const bridge = new THREE.Mesh(new THREE.BoxGeometry(70, 3, 13), new THREE.MeshStandardMaterial({ color: '#bd9861', metalness: .25, roughness: .55 })); bridge.position.set(0, 7, 108); bridge.castShadow = true; scene.add(bridge); const bridgeStructure = createStructureState('bridge', 160);
for (const b of buildings) { insertIntoGrid(buildingGrid, b.id, b.x, b.z); buildingsById.set(b.id, b); }
const districtRoutes = [-1, 1].map((direction) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(26, .12, 2), new THREE.MeshStandardMaterial({ color: '#84e4f3', emissive: '#16434d', emissiveIntensity: .35 })); mesh.position.set(direction * 75, .12, -92); scene.add(mesh); return { direction, mesh }; });
const landmark = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 28, 8), new THREE.MeshStandardMaterial({ color: '#9ac6cf', emissive: '#143b46', emissiveIntensity: .7 })); landmark.position.set(-100, 14, -112); landmark.castShadow = true; scene.add(landmark);
const LANDMARK_ID = 'landmark-1'; const landmarkStructure = createStructureState(LANDMARK_ID, 140);
// City fabric: district identity, land-use, traffic/pedestrians, landmark lifecycle, and public
// memory are all derived deterministically from a fixed seed plus the existing building layout,
// so the same seed + same relevant actions reproduce the same city fabric summary.
const CITY_SEED = 20260831;
const cityState: CityState = createCityState(CITY_SEED, buildings.map((b) => ({ id: b.id, x: b.x })), [{ id: LANDMARK_ID, name: 'The Cistern Spire', x: landmark.position.x }]);
// Shared/instanced rendering for bounded, deterministic background population: these are
// aggregate density figures for instanced meshes, not individually simulated agents (no
// per-citizen AI, no unbounded growth -- counts are always clamped by computeActivityCounts).
const TRAFFIC_CAP = 24, PEDESTRIAN_CAP = 60, CITY_DETAIL_CAP = 48;
// Traffic/service vehicle variety: three distinct instanced silhouettes (sedan, delivery van,
// transit bus) rather than one repeated box, each with its own geometry/material/cap so the
// street reads as mixed traffic instead of a single vehicle cloned everywhere. Every third
// slot is a van, every sixth is a bus, the rest are sedans -- deterministic by instance index.
const trafficSedanMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3.4, 1.6, 6.2), new THREE.MeshStandardMaterial({ color: '#d7c48a', roughness: .55, metalness: .2 }), TRAFFIC_CAP);
trafficSedanMesh.castShadow = true; trafficSedanMesh.count = 0; scene.add(trafficSedanMesh);
const trafficVanMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 2.6, 7.4), new THREE.MeshStandardMaterial({ color: '#8fb0c2', roughness: .6, metalness: .15 }), TRAFFIC_CAP);
trafficVanMesh.castShadow = true; trafficVanMesh.count = 0; scene.add(trafficVanMesh);
const trafficBusMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3.9, 3.1, 11.5), new THREE.MeshStandardMaterial({ color: '#d8895f', roughness: .65, metalness: .1 }), TRAFFIC_CAP);
trafficBusMesh.castShadow = true; trafficBusMesh.count = 0; scene.add(trafficBusMesh);
const pedestrianMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.42, 1.15, 4, 8), new THREE.MeshStandardMaterial({ color: '#c9d8dd', roughness: .8 }), PEDESTRIAN_CAP);
pedestrianMesh.castShadow = true; pedestrianMesh.count = 0; scene.add(pedestrianMesh);
const cityDetailMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .22, 4.4, 6), new THREE.MeshStandardMaterial({ color: '#3a4750', emissive: '#5c7480', emissiveIntensity: .3 }), CITY_DETAIL_CAP);
cityDetailMesh.castShadow = true; cityDetailMesh.count = 0; scene.add(cityDetailMesh);
const TRAFFIC_LANES_Z = [-84, 0, 84]; const trafficPhase = Array.from({ length: TRAFFIC_CAP }, (_, i) => i * 0.61);
const PEDESTRIAN_LANES_X = [-108, -8, 8, 108]; const pedestrianPhase = Array.from({ length: PEDESTRIAN_CAP }, (_, i) => i * 0.37);
const cityDetailPlaced = (() => { const random = mulberrySeed(CITY_SEED ^ 0x9e3779b9); return Array.from({ length: CITY_DETAIL_CAP }, () => ({ x: (random() - .5) * 300, z: (random() - .5) * 240 })); })();
function mulberrySeed(seed: number): () => number { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const debris: Debris[] = [-1, 1].map((direction, index) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 7), new THREE.MeshStandardMaterial({ color: '#a07854', roughness: .82 })); const origin = new THREE.Vector3(direction * 52, 1.2, 45 + index * 18); const initialVelocity = new THREE.Vector3(direction * 9, 0, index ? -4 : 4); mesh.position.copy(origin); mesh.castShadow = true; scene.add(mesh); return { id: `debris-${index + 1}`, mesh, velocity: initialVelocity.clone(), surfable: true, age: 0, active: true, respawn: 0, origin, initialVelocity }; });
const player = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 2.2, 6, 12), new THREE.MeshStandardMaterial({ color: '#eaf8ff', emissive: '#2e7f99', emissiveIntensity: .8 })); player.position.set(0, 2.2, 35); player.castShadow = true; scene.add(player);
const rival = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 2.4, 6, 12), new THREE.MeshStandardMaterial({ color: '#ff7187', emissive: '#721d3b', emissiveIntensity: .65 })); rival.position.set(35, 2.4, 12); rival.castShadow = true; scene.add(rival);
const velocity = new THREE.Vector3(); const rivalVelocity = new THREE.Vector3(); const grappleLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#84e4f3' })); grappleLine.visible = false; scene.add(grappleLine);
const playerCombat: CombatState = { health: 100, maxHealth: 100 };
const traversal: TraversalState = { wallRun: false, wallClimb: false, mantling: false, gliding: false, diving: false, surfing: false, rebound: false, impactRecovery: false, wallContact: false, wallSurfaceId: null, wallSide: null, wallTime: 0, grapple: false, grappleTarget: false };
let started = false, paused = false, dashCooldown = 0, mantleTimer = 0, grappleTarget: THREE.Vector3 | null = null, rivalHealth = 100, rivalAttackCooldown = 0, playerHitFlash = 0, attackCooldown = 0, history: CampaignHistory = createHistory(), deepTime: DeepTimeState | null = null, lastBattleOutcome: BattleOutcome | null = null, historyViewYear = 0, historyInspectorOpen = false, cameraYaw = 0, cameraPitch = -.2, cameraSensitivity = settings.cameraSensitivity, reducedShake = settings.accessibility.reducedShake, cameraKick = 0, last = performance.now();
let hudMode: 'full' | 'minimal' | 'hidden' = 'full', contextAlertTimer = 0, lastAutosave = 0;
const frameBudget: FrameBudgetState = createFrameBudgetState('high');
let qualityLevel: QualityLevel = 'high';
// Once a deterministic external driver (window.advanceTime, used by observation/tests) takes over
// stepping, the ordinary requestAnimationFrame loop stops double-advancing gameplay simulation with
// wall-clock time; it keeps rendering/camera fresh so the canvas stays visually current. This
// preserves the "same seed + same relevant actions = stable simulation summaries" invariant on slow
// or throttled renderers where multiple real animation frames could otherwise elapse between manual steps.
let manualStepping = false;
const scars: Scar[] = []; const SAVE_KEY = 'immortals-3d-history-v1'; const SAVE_VERSION = 3;
const status = (message: string) => { const el = document.querySelector('#status'); if (el) el.textContent = message; };
function renderHistoryInspector() { const panel = document.querySelector('#history'); if (!(panel instanceof HTMLElement)) return; panel.classList.toggle('hidden', !historyInspectorOpen); const list = document.querySelector('#history-list'); if (!(list instanceof HTMLElement)) return; list.replaceChildren(); const visibleEvents = history.events.filter((event) => event.year <= historyViewYear || historyViewYear === 0); if (!visibleEvents.length) { list.textContent = 'No recorded consequences yet.'; return; } for (const event of visibleEvents.slice(-12)) { const article = document.createElement('article'); article.className = 'history-event'; const heading = document.createElement('b'); heading.textContent = `YEAR ${event.year} // ${event.type.toUpperCase()} // ${event.siteId}`; const objective = document.createElement('div'); objective.className = 'objective'; objective.textContent = event.consequence; const account = document.createElement('div'); account.textContent = `PUBLIC ACCOUNT: ${event.publicAccount}`; const evidence = document.createElement('div'); evidence.textContent = `EVIDENCE ${(event.evidenceStrength * 100).toFixed(0)}%`; article.append(heading, objective, account, evidence); if (event.evidenceStrength < 1) { const recover = document.createElement('button'); recover.className = 'recover-evidence'; recover.type = 'button'; recover.textContent = 'RECOVER SITE EVIDENCE'; recover.addEventListener('click', () => { archaeologyRecover(history, event.id); renderHistoryInspector(); saveState(); status(`ARCHAEOLOGY // ${event.siteId.toUpperCase()} RECOVERED`); }); article.append(recover); } list.append(article); } }
const grounded = () => player.position.y <= 2.21;
function createScar(x: number, z: number, year: number, radius = 7): Scar { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.2, .12, 32), new THREE.MeshStandardMaterial({ color: '#10161b', emissive: '#402116', emissiveIntensity: .4 })); mesh.position.set(x, .08, z); scene.add(mesh); return { x, z, year, radius, mesh }; }
function updateDevelopmentVisuals() { for (const route of districtRoutes) { const transit = route.direction < 0 ? history.development.westTransit : history.development.eastTransit; const safety = route.direction < 0 ? history.development.westSafety : history.development.eastSafety; route.mesh.scale.x = .55 + transit / 100; (route.mesh.material as THREE.MeshStandardMaterial).color.set(safety < 45 ? '#d58a63' : '#84e4f3'); } }
function saveState(announce = true) { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, history, rivalHealth, battleOutcome: lastBattleOutcome, player: player.position.toArray(), bridge: { visible: bridge.visible, integrity: +bridgeStructure.integrity.toFixed(1), support: +bridgeStructure.support.toFixed(2), collapsed: bridgeStructure.collapsed }, buildings: buildings.map((b) => ({ height: b.height, visible: b.mesh.visible, integrity: +b.structure.integrity.toFixed(1), support: +b.structure.support.toFixed(2), collapsed: b.structure.collapsed })), scars: scars.map(({ x, z, year, radius }) => ({ x, z, year, radius })), city: { parcels: cityState.parcels, landmarks: cityState.landmarks, publicMemory: cityState.publicMemory }, landmarkStructure: { integrity: +landmarkStructure.integrity.toFixed(1), support: +landmarkStructure.support.toFixed(2), collapsed: landmarkStructure.collapsed } })); if (announce) status('HISTORY SAVED LOCALLY'); }
// Save schema is versioned (SAVE_VERSION) and migrated forward: a v1/v2 save (missing the
// v3 `city` block) loads with the freshly-seeded default city fabric rather than failing, an
// unsupported *future* version is rejected (falls back to a fresh game) rather than partially
// applied, and malformed/corrupt JSON is caught and the save key cleared so play can continue.
// Battle outcome, history events, and scars are always preserved across these migrations.
function loadState() { try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null'); if (!saved) return; const version = Number(saved.version ?? 1); if (!Number.isInteger(version) || version > SAVE_VERSION) throw new Error('unsupported save version'); history = saved.history?.events ? { ...createHistory(), ...saved.history, development: { ...createHistory().development, ...saved.history.development }, relics: saved.history.relics ?? [] } : createHistory(); lastBattleOutcome = saved.battleOutcome?.version === 1 && saved.battleOutcome.winner === 'immortal' ? saved.battleOutcome as BattleOutcome : null; rivalHealth = Number.isFinite(saved.rivalHealth) ? saved.rivalHealth : 100; if (Array.isArray(saved.player)) player.position.fromArray(saved.player); if (saved.bridge) { bridgeStructure.integrity = Number.isFinite(saved.bridge.integrity) ? saved.bridge.integrity : bridgeStructure.integrity; bridgeStructure.support = Number.isFinite(saved.bridge.support) ? saved.bridge.support : bridgeStructure.support; bridgeStructure.collapsed = saved.bridge.collapsed === true; bridge.visible = saved.bridge.visible !== false; bridge.scale.y = bridgeStructure.integrity / bridgeStructure.maxIntegrity; } saved.buildings?.forEach((s: { height?: number; visible?: boolean; integrity?: number; support?: number; collapsed?: boolean }, i: number) => { const b = buildings[i]; if (b) { b.height = Number.isFinite(s.height) ? s.height! : b.height; b.structure.integrity = Number.isFinite(s.integrity) ? s.integrity! : b.structure.integrity; b.structure.support = Number.isFinite(s.support) ? s.support! : b.structure.support; b.structure.collapsed = s.collapsed === true; b.mesh.visible = s.visible !== false && !b.structure.collapsed; b.mesh.scale.y = b.structure.collapsed ? .08 : b.height / (b.mesh.geometry as THREE.BoxGeometry).parameters.height; if (b.structure.collapsed) spawnRubble(b); } }); saved.scars?.forEach((s: { x: number; z: number; year: number; radius?: number }) => scars.push(createScar(s.x, s.z, s.year, s.radius))); trimScars(); if (version >= 3 && saved.city) { if (Array.isArray(saved.city.parcels)) cityState.parcels = saved.city.parcels; if (Array.isArray(saved.city.landmarks)) { cityState.landmarks = saved.city.landmarks; const landmarkSaved = cityState.landmarks.find((l) => l.id === LANDMARK_ID); if (landmarkSaved) (landmark.material as THREE.MeshStandardMaterial).color.set(landmarkSaved.status === 'intact' || landmarkSaved.status === 'rebuilt' ? '#9ac6cf' : '#6c5646'); } if (Array.isArray(saved.city.publicMemory)) cityState.publicMemory = saved.city.publicMemory; } if (saved.landmarkStructure) { landmarkStructure.integrity = Number.isFinite(saved.landmarkStructure.integrity) ? saved.landmarkStructure.integrity : landmarkStructure.integrity; landmarkStructure.support = Number.isFinite(saved.landmarkStructure.support) ? saved.landmarkStructure.support : landmarkStructure.support; landmarkStructure.collapsed = saved.landmarkStructure.collapsed === true; } if (version < SAVE_VERSION) saveState(false); } catch { localStorage.removeItem(SAVE_KEY); } }
function findWall(): WallContact | null { let best: WallContact | null = null; const search = 1.65 + Math.min(3.2, velocity.clone().setY(0).length() * .045); for (const b of nearbyBuildings(player.position.x, player.position.z, 60)) { if (!b.mesh.visible || player.position.y > b.height + 1.5) continue; const minX = b.x - b.width / 2, maxX = b.x + b.width / 2, minZ = b.z - b.depth / 2, maxZ = b.z + b.depth / 2; const cs = [{ d: minX - player.position.x, n: new THREE.Vector3(-1, 0, 0), side: 'left', valid: player.position.z >= minZ - search && player.position.z <= maxZ + search }, { d: player.position.x - maxX, n: new THREE.Vector3(1, 0, 0), side: 'right', valid: player.position.z >= minZ - search && player.position.z <= maxZ + search }, { d: minZ - player.position.z, n: new THREE.Vector3(0, 0, -1), side: 'front', valid: player.position.x >= minX - search && player.position.x <= maxX + search }, { d: player.position.z - maxZ, n: new THREE.Vector3(0, 0, 1), side: 'back', valid: player.position.x >= minX - search && player.position.x <= maxX + search }].filter((v) => v.valid && Math.abs(v.d) <= search).sort((a, z) => Math.abs(a.d) - Math.abs(z.d)); const c = cs[0]; if (!c) continue; const normalVelocity = velocity.dot(c.n); const tangent = velocity.clone().addScaledVector(c.n, -normalVelocity).setY(0).length(); const result = { building: b, normal: c.n, proximity: Math.abs(c.d), signedDistance: c.d, tangentSpeed: tangent, approachSpeed: Math.max(0, -normalVelocity), side: c.side }; if (!best || result.proximity < best.proximity) best = result; } return best; }
function resolveWall(wall: WallContact | null) { if (!wall || wall.signedDistance >= 1.2) return; player.position.addScaledVector(wall.normal, 1.2 - wall.signedDistance); const inward = velocity.dot(wall.normal); if (inward < 0) velocity.addScaledVector(wall.normal, -inward); }
function findGrapple() { const view = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)); let best: THREE.Vector3 | null = null; let score = .82; for (const b of nearbyBuildings(player.position.x, player.position.z, 80)) { if (!b.mesh.visible || !b.grapple) continue; const target = new THREE.Vector3(b.x, Math.min(player.position.y + 7, b.height - 1), b.z); const delta = target.clone().sub(player.position); const distance = delta.length(); if (distance > 78) continue; const alignment = view.dot(delta.normalize()); if (alignment < score) continue; const ray = new THREE.Raycaster(player.position, target.clone().sub(player.position).normalize(), 0, distance); if (ray.intersectObjects(buildings.filter((v) => v !== b && v.mesh.visible).map((v) => v.mesh))[0]?.distance < distance - .2) continue; score = alignment; best = target; } return best; }
function nearestDebris() { return debris.filter((item) => item.active).reduce<Debris | null>((best, item) => Math.hypot(item.mesh.position.x - player.position.x, item.mesh.position.z - player.position.z) < (best ? Math.hypot(best.mesh.position.x - player.position.x, best.mesh.position.z - player.position.z) : 9) ? item : best, null); }
function applyLookDelta() { if (!input.pointerDelta.x && !input.pointerDelta.y) return; cameraYaw -= input.pointerDelta.x * .0025 * cameraSensitivity; cameraPitch = THREE.MathUtils.clamp(cameraPitch - input.pointerDelta.y * .0022 * cameraSensitivity, -.9, .65); }
function updateCamera(dt: number) { const speed = velocity.clone().setY(0).length(); const high = THREE.MathUtils.clamp(speed / 65, 0, 1); camera.fov = THREE.MathUtils.lerp(camera.fov, 60 + high * 8, 1 - Math.pow(.0005, dt)); camera.updateProjectionMatrix(); const distance = 19 + high * 7; const offset = new THREE.Vector3(Math.sin(cameraYaw) * distance, 9 + player.position.y * .12 - cameraPitch * 5, Math.cos(cameraYaw) * distance); const desired = player.position.clone().add(offset); const ray = new THREE.Raycaster(player.position.clone().add(new THREE.Vector3(0, 2, 0)), offset.clone().normalize(), 0, distance); const hit = ray.intersectObjects(buildings.filter((b) => b.mesh.visible).map((b) => b.mesh))[0]; if (hit) desired.copy(ray.ray.origin).add(offset.normalize().multiplyScalar(Math.max(4.5, hit.distance - 1.5))); camera.position.lerp(desired, 1 - Math.pow(.0008, dt)); if (!reducedShake && cameraKick) camera.position.y += Math.sin(performance.now() * .05) * cameraKick; camera.lookAt(player.position.x, player.position.y + 2.1, player.position.z); cameraKick = Math.max(0, cameraKick - dt * 4); }
function hud() { const set = (id: string, value: string) => { const el = document.querySelector(`#${id}`); if (el) el.textContent = value; }; set('year', String(history.year)); set('district', player.position.x < 0 ? 'WESTERN QUARTER' : 'EASTERN QUARTER'); set('velocity', String(Math.round(velocity.length()))); set('rival', String(rivalHealth)); set('vitality', String(Math.round(playerCombat.health))); set('state', traversal.mantling ? 'MANTLE' : traversal.wallRun ? 'WALL RUN' : traversal.wallClimb ? 'WALL CLIMB' : traversal.grapple ? 'GRAPPLE' : traversal.gliding ? 'GLIDE' : traversal.diving ? 'DIVE' : traversal.surfing ? 'SURF' : traversal.impactRecovery ? 'RECOVERY' : 'GROUND'); }
const collapsedParcelsThisEra = new Set<string>();
const relicIdsByEventThisEra = new Map<string, string[]>();
// Century transition reconstruction sequence: a rebuilt parcel does not instantly snap back to
// full height on the century-advance keypress. Instead its mesh becomes visible again at zero
// height and grows over a few real seconds while its color eases toward the new land use's
// color, giving a visible "the city is being rebuilt" beat instead of an invisible state flip.
const LAND_USE_COLOR: Record<string, string> = { residential: '#7f97a3', commercial: '#c2965f', industrial: '#5f6b63', civic: '#8aa9c9', ruin: '#3c332c' };
const activeReconstructions: Reconstruction[] = [];
function beginReconstruction(b: Building, landUse: string): void {
  b.mesh.visible = true;
  b.height = 0.6;
  b.mesh.scale.y = 0.02;
  const startColor = new THREE.Color('#241d17');
  (b.mesh.material as THREE.MeshStandardMaterial).color.copy(startColor);
  const targetColor = new THREE.Color(LAND_USE_COLOR[landUse] ?? '#557585');
  activeReconstructions.push({ building: b, startHeight: 0.6, targetHeight: b.baseHeight, startColor, targetColor, elapsed: 0, duration: 3.2 });
}
function updateReconstructions(dt: number): void {
  for (let i = activeReconstructions.length - 1; i >= 0; i -= 1) {
    const r = activeReconstructions[i];
    r.elapsed = Math.min(r.duration, r.elapsed + dt);
    const t = r.elapsed / r.duration;
    const eased = t * t * (3 - 2 * t);
    r.building.height = r.startHeight + (r.targetHeight - r.startHeight) * eased;
    r.building.mesh.scale.y = Math.max(0.02, r.building.height / (r.building.mesh.geometry as THREE.BoxGeometry).parameters.height);
    (r.building.mesh.material as THREE.MeshStandardMaterial).color.copy(r.startColor).lerp(r.targetColor, eased);
    if (t >= 1) {
      r.building.structure.integrity = r.building.structure.maxIntegrity;
      r.building.structure.support = 1;
      r.building.structure.collapsed = false;
      r.building.originalColor = r.targetColor.getHex();
      activeReconstructions.splice(i, 1);
    }
  }
}
// Public memory becomes visible architecture: every projectPublicMemory() call also spawns a
// small plaque mesh at the site, and a material-lineage indicator once a relic is folded into
// a rebuilt parcel -- these are real, inspectable world objects, not just aggregate counters.
// Older markers are never deleted (a corrective marker after archaeology recovery is added
// alongside the original, matching city.ts's own "never delete the first" contract).
const publicMemoryVisuals: PublicMemoryVisual[] = [];
const materialLineageVisuals: MaterialLineageVisual[] = [];
function districtOf(x: number): 'west' | 'east' | 'central' { return x < -20 ? 'west' : x > 20 ? 'east' : 'central'; }
// The plaque/marker *meshes* are a bounded rendering convenience, not the historical record --
// cityState.publicMemory / parcel.materialLineageIds (persisted in the save) keep every entry
// forever. If a very long play session mints more plaques than this visual cap, the oldest
// mesh is disposed (freeing GPU resources) while its underlying data stays intact and is still
// reported via publicMemoryCount/materialLineageCount.
const PUBLIC_MEMORY_VISUAL_CAP = 48;
const MATERIAL_LINEAGE_VISUAL_CAP = 48;
function spawnPublicMemoryPlaque(markerId: string, x: number, z: number, inscription: string): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, .3), new THREE.MeshStandardMaterial({ color: '#c7a35c', emissive: '#4a3413', emissiveIntensity: .5, roughness: .5, metalness: .3 }));
  mesh.position.set(x + 3.2, 1.05, z + 3.2);
  mesh.castShadow = true;
  scene.add(mesh);
  publicMemoryVisuals.push({ markerId, mesh, x, z, inscription });
  while (publicMemoryVisuals.length > PUBLIC_MEMORY_VISUAL_CAP) { const oldest = publicMemoryVisuals.shift(); if (oldest) disposeMesh(oldest.mesh); }
}
function spawnMaterialLineageMarker(parcelId: string, x: number, z: number): void {
  if (materialLineageVisuals.some((v) => v.parcelId === parcelId)) return;
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshStandardMaterial({ color: '#b98b5e', emissive: '#5c3a1c', emissiveIntensity: .4, roughness: .6 }));
  mesh.position.set(x - 3.2, 1.4, z - 3.2);
  mesh.castShadow = true;
  scene.add(mesh);
  materialLineageVisuals.push({ parcelId, mesh });
  while (materialLineageVisuals.length > MATERIAL_LINEAGE_VISUAL_CAP) { const oldest = materialLineageVisuals.shift(); if (oldest) disposeMesh(oldest.mesh); }
}
function collapseBuilding(b: Building) { if (!b.mesh.visible) return false; b.mesh.visible = false; b.height = 0; b.mesh.scale.y = .08; spawnRubble(b); const event = recordEvent(history, { year: history.year, type: 'collapse', siteId: b.id, consequence: 'A structure collapses and becomes an inherited ruin.', publicAccount: 'The collapse is attributed to an old construction fault.', evidenceStrength: .45 }); collapsedParcelsThisEra.add(b.id); const relicId = history.relics[history.relics.length - 1]?.originEventId === event.id ? history.relics[history.relics.length - 1].id : null; if (relicId) relicIdsByEventThisEra.set(b.id, [...(relicIdsByEventThisEra.get(b.id) ?? []), relicId]); const marker = projectPublicMemory(cityState, event.id, event.siteId, districtOf(b.x), event.publicAccount, event.evidenceStrength); spawnPublicMemoryPlaque(marker.id, b.x, b.z, marker.inscription); return true; }
function shockwave() { const scar = createScar(player.position.x, player.position.z, history.year); scars.push(scar); trimScars(); recordDistrictDamage(history, player.position.x); updateDevelopmentVisuals(); recordEvent(history, { year: history.year, type: 'collapse', siteId: `scar-${scars.length}`, consequence: 'A terrain scar becomes a permanent geographic reference.', publicAccount: 'Later maps call the depression natural.', evidenceStrength: .7 }); const collapsed: Building[] = []; for (const b of nearbyBuildings(player.position.x, player.position.z, 18)) if (b.mesh.visible && Math.hypot(b.x - player.position.x, b.z - player.position.z) < 18) { const impact = applyStructureImpact(b.structure, 28); b.height = Math.max(0, b.height - 12); b.mesh.scale.y = Math.max(.08, b.height / (b.mesh.geometry as THREE.BoxGeometry).parameters.height); if ((impact.collapsed || !b.height) && collapseBuilding(b)) collapsed.push(b); } for (const source of collapsed) { const bridgeLoad = applySupportLoad(bridgeStructure, 18); bridge.scale.y = bridgeStructure.integrity / bridgeStructure.maxIntegrity; if (bridgeLoad.collapsed) bridge.visible = false; for (const neighbor of nearbyBuildings(source.x, source.z, 56)) if (neighbor !== source && neighbor.mesh.visible && Math.hypot(neighbor.x - source.x, neighbor.z - source.z) < 56) { const load = applySupportLoad(neighbor.structure, 18); neighbor.height = Math.max(0, neighbor.height - 5); neighbor.mesh.scale.y = Math.max(.08, neighbor.height / (neighbor.mesh.geometry as THREE.BoxGeometry).parameters.height); if (load.collapsed && collapseBuilding(neighbor)) recordEvent(history, { year: history.year, type: 'collapse', siteId: `${neighbor.id}-support`, consequence: 'A neighboring structure fails after inherited support load.', publicAccount: 'The second collapse is recorded as unrelated damage.', evidenceStrength: .4 }); } } if (landmark.visible && Math.hypot(landmark.position.x - player.position.x, landmark.position.z - player.position.z) < 34) { const impact = applyStructureImpact(landmarkStructure, 16); if (impact.damage > 0) { markLandmarkDamaged(cityState, LANDMARK_ID, history.year); (landmark.material as THREE.MeshStandardMaterial).color.set('#6c5646'); const landmarkEvent = recordEvent(history, { year: history.year, type: 'collapse', siteId: LANDMARK_ID, consequence: 'The landmark sustains structural damage from a shockwave.', publicAccount: 'Officials describe the damage as routine weathering.', evidenceStrength: .5 }); const marker = projectPublicMemory(cityState, landmarkEvent.id, landmarkEvent.siteId, districtOf(landmark.position.x), landmarkEvent.publicAccount, landmarkEvent.evidenceStrength); spawnPublicMemoryPlaque(marker.id, landmark.position.x, landmark.position.z, marker.inscription); } } saveState(); status(collapsed.length ? 'SHOCKWAVE // SUPPORT LOAD PROPAGATED' : 'SHOCKWAVE // TERRAIN SCAR RECORDED'); }
function update(dt: number) { if (!started || paused) return; mantleTimer = Math.max(0, mantleTimer - dt); const analogScale = input.moveMagnitude; const move = new THREE.Vector3(input.moveVector.x, 0, input.moveVector.z); if (move.lengthSq() > 1) move.normalize(); const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)); const right = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw)); const wish = forward.multiplyScalar(-move.z).add(right.multiplyScalar(move.x)); if (wish.lengthSq() > 1) wish.normalize(); wish.multiplyScalar(analogScale); const sprint = input.down.has(Action.Sprint); const maxSpeed = sprint ? 66 : 27; const accel = grounded() ? sprint ? 150 : 100 : 52; if (wish.lengthSq()) velocity.addScaledVector(wish, accel * dt); const horizontal = velocity.clone().setY(0); if (horizontal.length() > maxSpeed) { const y = velocity.y; velocity.copy(horizontal.normalize().multiplyScalar(maxSpeed)); velocity.y = y; } const drag = grounded() ? wish.lengthSq() ? .96 : .82 : .995; velocity.x *= Math.pow(drag, dt * 60); velocity.z *= Math.pow(drag, dt * 60);
  const wall = findWall(); traversal.wallContact = !!wall; traversal.wallSurfaceId = wall?.building.id ?? null; traversal.wallSide = wall?.side ?? null; traversal.wallRun = traversal.wallClimb = traversal.gliding = traversal.diving = traversal.rebound = false; traversal.mantling = mantleTimer > 0;
  if (input.pressed.has(Action.Jump) && grounded()) { velocity.y = sprint ? 28 : 23; status('LONG JUMP // MOMENTUM CARRIED'); }
  if (input.pressed.has(Action.Jump) && !grounded() && wall && wall.tangentSpeed > 10 && wall.approachSpeed < 10) { velocity.addScaledVector(wall.normal, 24); velocity.y = 19; traversal.rebound = true; status('REBOUND // WALL EXIT'); }
  if (!grounded() && wall && input.down.has(Action.Jump) && wall.building.climbable && wish.dot(wall.normal) < -.25) { if (player.position.y >= wall.building.height - 2) { player.position.y = wall.building.height + 2.2; velocity.y = 5; velocity.addScaledVector(wall.normal, 8); mantleTimer = .35; traversal.mantling = true; status('MANTLE // ROOFTOP ACCESS'); } else { traversal.wallClimb = true; velocity.y = Math.max(velocity.y, 14); status('WALL CLIMB // CONTACT LOCKED'); } } else if (!grounded() && wall && input.down.has(Action.Jump) && wall.tangentSpeed > 10) { traversal.wallRun = true; traversal.wallTime += dt; velocity.y = Math.max(velocity.y, 3.5); velocity.addScaledVector(wall.normal, -velocity.dot(wall.normal)); status('WALL RUN // CONTACT LOCKED'); } else traversal.wallTime = Math.max(0, traversal.wallTime - dt * 2);
  if (!grounded() && input.down.has(Action.Glide) && !traversal.wallClimb && !traversal.diving) { traversal.gliding = true; velocity.y = Math.max(velocity.y - 9 * dt, -6); if (wish.lengthSq()) velocity.addScaledVector(wish, 26 * dt); }
  if (!grounded() && input.down.has(Action.Dive)) { traversal.diving = true; traversal.gliding = false; velocity.y = Math.max(-78, velocity.y - 105 * dt); if (wish.lengthSq()) velocity.addScaledVector(wish, 18 * dt); }
  const ride = nearestDebris(); if (input.down.has(Action.Surf) && grounded() && ride && Math.hypot(ride.mesh.position.x - player.position.x, ride.mesh.position.z - player.position.z) < 8) { traversal.surfing = true; velocity.x = ride.velocity.x; velocity.z = ride.velocity.z; status('DEBRIS SURF // RIDING'); } if (!input.down.has(Action.Surf)) traversal.surfing = false;
  if (input.pressed.has(Action.Dash) && dashCooldown <= 0) { velocity.add(wish.lengthSq() ? wish.multiplyScalar(42) : forward.multiplyScalar(42)); dashCooldown = .72; status('AIR DASH // MOMENTUM PRESERVED'); } dashCooldown = Math.max(0, dashCooldown - dt); attackCooldown = Math.max(0, attackCooldown - dt); rivalAttackCooldown = Math.max(0, rivalAttackCooldown - dt); playerHitFlash = Math.max(0, playerHitFlash - dt);
  if (input.pressed.has(Action.Grapple)) { grappleTarget = findGrapple(); if (grappleTarget) { grappleLine.visible = true; status('GRAPPLE LOCKED // HOLD E TO SWING'); } else status('NO VALID GRAPPLE ANCHOR'); } traversal.grapple = traversal.grappleTarget = !!grappleTarget; if (grappleTarget && input.down.has(Action.Grapple)) { const pull = grappleTarget.clone().sub(player.position); velocity.addScaledVector(pull.normalize(), (pull.length() > 18 ? 58 : 30) * dt); grappleLine.geometry.setFromPoints([player.position, grappleTarget]); } else if (!input.down.has(Action.Grapple)) { grappleTarget = null; grappleLine.visible = false; }
  if (input.pressed.has(Action.Shockwave)) { velocity.y = 18; cameraKick = 1.2; shockwave(); }
  if (input.pressed.has(Action.Attack) && attackCooldown <= 0 && player.position.distanceTo(rival.position) < 14 && rivalHealth > 0) { const hit = applyDamage({ health: rivalHealth, maxHealth: 100 }, 25); rivalHealth = hit.remaining; attackCooldown = .35; if (!hit.defeated) rivalVelocity.add(player.position.clone().sub(rival.position).normalize().multiplyScalar(-18)); recordEvent(history, { year: history.year, type: 'strike', siteId: 'rival-impact-zone', consequence: hit.defeated ? 'The rival falls and the battle is won.' : 'The rival is driven back through the city.', publicAccount: 'Witnesses disagree about who started the fight.', evidenceStrength: .55 }); if (hit.defeated) { rival.visible = false; saveState(); } status(hit.defeated ? 'RIVAL DOWN // BATTLE WON' : 'STRIKE // RIVAL STAGGERED'); }
  if (rivalHealth <= 0 && !lastBattleOutcome) { lastBattleOutcome = createBattleOutcome({ year: history.year, playerVitality: playerCombat.health, collapsedStructureIds: buildings.filter((b) => b.structure.collapsed).map((b) => b.id), scarCount: scars.length, eventIds: history.events.map((event) => event.id) }); saveState(false); status('BATTLE OUTCOME // SEALED'); }
  if (input.pressed.has(Action.History)) { historyInspectorOpen = !historyInspectorOpen; renderHistoryInspector(); status(historyInspectorOpen ? 'HISTORY // OBJECTIVE LEDGER OPEN' : 'HISTORY // LEDGER CLOSED'); } if (input.pressed.has(Action.Century) && rivalHealth <= 0) { advanceHistory(history); updateDevelopmentVisuals(); const rebuiltIds = new Set(collapsedParcelsThisEra); advanceCityCentury(cityState, history, collapsedParcelsThisEra, relicIdsByEventThisEra); for (const id of rebuiltIds) { const b = buildingsById.get(id); const parcel = cityState.parcels.find((p) => p.id === id); if (b && parcel) { beginReconstruction(b, parcel.landUse); if (parcel.materialLineageIds.length) spawnMaterialLineageMarker(parcel.id, b.x, b.z); } } collapsedParcelsThisEra.clear(); relicIdsByEventThisEra.clear(); if (cityState.landmarks[0]?.status === 'damaged') { rebuildLandmark(cityState, LANDMARK_ID); landmarkStructure.integrity = landmarkStructure.maxIntegrity; landmarkStructure.support = 1; landmarkStructure.collapsed = false; (landmark.material as THREE.MeshStandardMaterial).color.set('#9ac6cf'); } activityCounts = computeActivityCounts(cityState, history, qualityProfile(qualityLevel).cityDetailDensity); rivalHealth = 100; rival.visible = true; rival.position.copy(player.position).add(new THREE.Vector3(28, 0, -24)); renderHistoryInspector(); saveState(); status(`YEAR ${history.year} // THE CITY REMEMBERS // RECONSTRUCTION UNDERWAY`); } if (input.pressed.has(Action.Save)) saveState(); if (input.pressed.has(Action.Archaeology)) { const event = history.events.find((v) => v.evidenceStrength < .5); if (event) { archaeologyRecover(history, event.id); const recovered = history.events.find((v) => v.id === event.id); const priorMarker = cityState.publicMemory.find((m) => m.eventId === event.id); if (recovered && priorMarker) { const marker = projectPublicMemory(cityState, recovered.id, recovered.siteId, priorMarker.district, recovered.publicAccount, recovered.evidenceStrength); const site = buildingsById.get(recovered.siteId); if (site) spawnPublicMemoryPlaque(marker.id, site.x, site.z, marker.inscription); } renderHistoryInspector(); saveState(); status('ARCHAEOLOGY // OBJECTIVE HISTORY RECOVERED'); } } if (input.pressed.has(Action.DeepTime)) { const campaignSeed = 1701 + history.events.length * 97 + Math.round(history.development.adaptation) * 13 + Math.round(history.development.returnAwareness) * 7; deepTime = simulateDeepTime(campaignSeed); status(`DEEP TIME // YEAR 100,000 REACHED // SEED ${campaignSeed}`); }
  velocity.y -= (traversal.wallRun ? 8 : traversal.wallClimb ? 2 : traversal.gliding ? 6 : 42) * dt; player.position.addScaledVector(velocity, dt); if (traversal.surfing && ride) { player.position.addScaledVector(ride.velocity, dt); player.position.y = Math.max(player.position.y, ride.mesh.position.y + 2.2); } player.position.y = Math.max(2.2, player.position.y); if (grounded()) { if (velocity.y < -24) { traversal.impactRecovery = true; velocity.multiply(new THREE.Vector3(.55, 0, .55)); status('HARD LANDING // IMPACT RECOVERY'); } else traversal.impactRecovery = false; velocity.y = Math.max(0, velocity.y); } player.position.x = THREE.MathUtils.clamp(player.position.x, -158, 158); player.position.z = THREE.MathUtils.clamp(player.position.z, -128, 128); if (rivalHealth > 0) { const toPlayer = player.position.clone().sub(rival.position); if (toPlayer.length() > 7) rivalVelocity.add(toPlayer.normalize().multiplyScalar(4 * dt)); rivalVelocity.multiplyScalar(Math.pow(.02, dt)); rival.position.addScaledVector(rivalVelocity, dt); rival.position.y = 2.4; } else rival.visible = false; if (rivalHealth > 0 && player.position.distanceTo(rival.position) < 7 && rivalAttackCooldown <= 0) { const hit = applyDamage(playerCombat, 8); rivalAttackCooldown = 1.1; playerHitFlash = settings.accessibility.reducedFlash ? .1 : .22; cameraKick = Math.max(cameraKick, .45); triggerContextAlert(); status("RIVAL STRIKE // PLAYER HIT"); } if (playerCombat.health <= 0) { playerCombat.health = playerCombat.maxHealth; player.position.set(0, 2.2, 35); velocity.set(0, 0, 0); status("RECOVERED // IMMORTAL BODY RESTORED"); } resolveWall(wall); updateReconstructions(dt); updateWorldAffordances(); hud(); }
// Rubble and scars accumulate every collapse/shockwave across potentially many centuries of
// play. Without a bound they would leak GPU geometry/material resources and grow the save blob
// forever. Both arrays are capped: once over the cap, the OLDEST entry is disposed (geometry +
// material freed, mesh removed from the scene) before the new one is added, so the *history
// record* (history.events) stays complete and causally meaningful while only the incidental
// decorative meshes are bounded -- objective history is never touched by this trimming.
const RUBBLE_CAP = 140;
const SCAR_CAP = 60;
function disposeMesh(mesh: THREE.Mesh): void { scene.remove(mesh); mesh.geometry.dispose(); const material = mesh.material; if (Array.isArray(material)) material.forEach((m) => m.dispose()); else material.dispose(); }
function trimRubble(): void { while (rubble.length > RUBBLE_CAP) { const oldest = rubble.shift(); if (oldest) disposeMesh(oldest.mesh); } }
function trimScars(): void { while (scars.length > SCAR_CAP) { const oldest = scars.shift(); if (oldest) disposeMesh(oldest.mesh); } }
function spawnRubble(b: Building) { for (let i = 0; i < 4; i += 1) { const chunk = new THREE.Mesh(new THREE.BoxGeometry(3 + i, 1.2 + i * .3, 2.5), new THREE.MeshStandardMaterial({ color: '#765c49', roughness: .95 })); chunk.position.set(b.x + (i - 1.5) * 3, .7 + i * .25, b.z + (i % 2 ? 3 : -3)); chunk.rotation.y = i * .7; chunk.castShadow = true; scene.add(chunk); rubble.push({ mesh: chunk, velocity: new THREE.Vector3((i - 1.5) * 3, 5 + i * 1.5, i % 2 ? 3 : -3), angular: new THREE.Vector3(.2 * (i + 1), .35 * (i - 1), .15 * (i + 1)), settled: false }); } trimRubble(); }
function updateRubble(dt: number) { for (const body of rubble) { if (body.settled) continue; body.velocity.y -= 36 * dt; body.mesh.position.addScaledVector(body.velocity, dt); body.mesh.rotation.x += body.angular.x * dt; body.mesh.rotation.y += body.angular.y * dt; body.mesh.rotation.z += body.angular.z * dt; if (body.mesh.position.y <= .7) { body.mesh.position.y = .7; body.velocity.y = -body.velocity.y * .24; body.velocity.x *= .72; body.velocity.z *= .72; body.angular.multiplyScalar(.72); if (body.velocity.length() < .5) body.settled = true; } } }
function updateDebris(dt: number) { for (const d of debris) { if (!d.active) { d.respawn -= dt; if (d.respawn <= 0) { d.active = true; d.surfable = true; d.age = 0; d.mesh.visible = true; d.mesh.position.copy(d.origin); d.velocity.copy(d.initialVelocity); } continue; } d.age += dt; if (d.age >= 30) { d.active = d.surfable = false; d.mesh.visible = false; d.respawn = 2; if (traversal.surfing) traversal.surfing = false; continue; } d.mesh.position.addScaledVector(d.velocity, dt); if (Math.abs(d.mesh.position.x) > 125) d.velocity.x *= -1; if (Math.abs(d.mesh.position.z) > 115) d.velocity.z *= -1; } }
let activityCounts = computeActivityCounts(cityState, history, qualityProfile(qualityLevel).cityDetailDensity);
const cityDetailMatrix = new THREE.Object3D();
function applyQualityLevel(level: QualityLevel) {
  qualityLevel = level;
  const profile = qualityProfile(level);
  renderer.setPixelRatio(Math.min(devicePixelRatio, profile.pixelRatioCap));
  renderer.shadowMap.enabled = profile.shadowsEnabled;
  scene.fog = new THREE.Fog('#09131d', 45, profile.drawDistance);
  camera.far = profile.drawDistance + 40; camera.updateProjectionMatrix();
  activityCounts = computeActivityCounts(cityState, history, profile.cityDetailDensity);
  cityDetailMesh.count = Math.min(CITY_DETAIL_CAP, Math.round(CITY_DETAIL_CAP * profile.cityDetailDensity));
  for (let i = 0; i < cityDetailMesh.count; i += 1) { const spot = cityDetailPlaced[i]; cityDetailMatrix.position.set(spot.x, 2.2, spot.z); cityDetailMatrix.updateMatrix(); cityDetailMesh.setMatrixAt(i, cityDetailMatrix.matrix); }
  cityDetailMesh.instanceMatrix.needsUpdate = true;
  const el = document.querySelector('#quality-tier'); if (el) el.textContent = level.toUpperCase();
}
function updateCityActivity(now: number) {
  const activeTraffic = Math.min(TRAFFIC_CAP, activityCounts.trafficCount);
  let sedanCount = 0, vanCount = 0, busCount = 0;
  for (let i = 0; i < activeTraffic; i += 1) {
    const laneIndex = i % TRAFFIC_LANES_Z.length; const z = TRAFFIC_LANES_Z[laneIndex];
    const direction = laneIndex % 2 === 0 ? 1 : -1;
    const x = (((now * 0.012 * direction) + trafficPhase[i] * 40) % 320) - 160;
    cityDetailMatrix.position.set(x, i % 6 === 5 ? 1.55 : i % 3 === 2 ? 1.3 : .9, z + (i % 3 - 1) * 3.4);
    cityDetailMatrix.rotation.set(0, direction > 0 ? 0 : Math.PI, 0);
    cityDetailMatrix.updateMatrix();
    if (i % 6 === 5) trafficBusMesh.setMatrixAt(busCount++, cityDetailMatrix.matrix);
    else if (i % 3 === 2) trafficVanMesh.setMatrixAt(vanCount++, cityDetailMatrix.matrix);
    else trafficSedanMesh.setMatrixAt(sedanCount++, cityDetailMatrix.matrix);
  }
  trafficSedanMesh.count = sedanCount; trafficVanMesh.count = vanCount; trafficBusMesh.count = busCount;
  trafficSedanMesh.instanceMatrix.needsUpdate = true; trafficVanMesh.instanceMatrix.needsUpdate = true; trafficBusMesh.instanceMatrix.needsUpdate = true;
  pedestrianMesh.count = Math.min(PEDESTRIAN_CAP, activityCounts.pedestrianCount);
  for (let i = 0; i < pedestrianMesh.count; i += 1) {
    const laneIndex = i % PEDESTRIAN_LANES_X.length; const x = PEDESTRIAN_LANES_X[laneIndex];
    const z = (((now * 0.006) + pedestrianPhase[i] * 30) % 260) - 130;
    cityDetailMatrix.position.set(x + Math.sin(pedestrianPhase[i]) * 2, 1.05, z);
    cityDetailMatrix.rotation.set(0, 0, 0);
    cityDetailMatrix.updateMatrix();
    pedestrianMesh.setMatrixAt(i, cityDetailMatrix.matrix);
  }
  pedestrianMesh.instanceMatrix.needsUpdate = true;
}
function updateHudMode() {
  const speed = velocity.length();
  contextAlertTimer = Math.max(0, contextAlertTimer - (1 / 60));
  const alert = contextAlertTimer > 0;
  const explorationLike = speed < 2 && grounded() && !historyInspectorOpen && rivalHealth > 0 === rivalHealth > 0 && !paused;
  hudMode = alert ? 'full' : explorationLike && speed < 1 ? 'hidden' : speed > 30 ? 'minimal' : 'full';
  const hudEl = document.querySelector('#hud');
  if (hudEl instanceof HTMLElement) {
    hudEl.classList.toggle('hud-minimal', hudMode === 'minimal');
    hudEl.classList.toggle('hud-hidden-exploration', hudMode === 'hidden');
    hudEl.classList.toggle('hud-context-alert', alert);
  }
}
function triggerContextAlert() { contextAlertTimer = 2.4; }
function frame(now: number) {
  const dt = Math.min(.05, (now - last) / 1000);
  const frameMs = now - last;
  last = now;
  if (!manualStepping) {
    input.pollGamepad(); input.syncMove();
    update(dt); updateDebris(dt); updateRubble(dt); applyLookDelta(); input.consumeFrame();
    updateCityActivity(now);
    updateHudMode();
    if (frameMs > 0 && frameMs < 500) { const nextBudget = stepFrameBudget(frameBudget, frameMs, settings.qualityTier); Object.assign(frameBudget, nextBudget); if (nextBudget.level !== qualityLevel) applyQualityLevel(nextBudget.level); }
    if (now - lastAutosave > 45000 && started) { lastAutosave = now; saveState(false); }
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function persistSettings() { settings.bindings = input.bindings; settings.cameraSensitivity = cameraSensitivity; settings.accessibility.reducedShake = reducedShake; saveSettings(settings); }
addEventListener('keydown', (event) => { const key = event.key === ' ' ? 'space' : event.key.toLowerCase(); if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault(); input.keyDown(key); if (input.pressed.has(Action.Pause) && started) { paused = !paused; document.querySelector('#pause')?.classList.toggle('hidden', !paused); if (paused && document.pointerLockElement) document.exitPointerLock(); } if (input.pressed.has(Action.CameraFaster)) cameraSensitivity = Math.min(2, cameraSensitivity + .1); if (input.pressed.has(Action.CameraSlower)) cameraSensitivity = Math.max(.5, cameraSensitivity - .1); if (input.pressed.has(Action.ReducedShake)) reducedShake = !reducedShake; if (input.pressed.has(Action.CameraFaster) || input.pressed.has(Action.CameraSlower) || input.pressed.has(Action.ReducedShake)) persistSettings(); });
addEventListener('keyup', (event) => input.keyUp(event.key === ' ' ? 'space' : event.key)); renderer.domElement.addEventListener('click', () => { if (started && !paused) renderer.domElement.requestPointerLock?.(); }); addEventListener('mousemove', (event) => { if (document.pointerLockElement === renderer.domElement && started && !paused) { input.setMode('mouse'); cameraYaw -= event.movementX * .0025 * cameraSensitivity; cameraPitch = THREE.MathUtils.clamp(cameraPitch - event.movementY * .0022 * cameraSensitivity, -.9, .65); } }); addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
// Input-mode tracking follows the most recent meaningful interaction (Pointer Events), never a
// one-time device classification: a touchscreen laptop can switch between mouse/keyboard and
// touch within the same session, and this keeps the touch control overlay and HUD affordances
// in sync with whatever the player is actually using right now.
addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch' || event.pointerType === 'pen') { input.setMode('touch'); updateTouchControlsVisibility(); } else if (event.pointerType === 'mouse' && !(event.target instanceof HTMLElement && event.target.closest('#touch-controls'))) { input.setMode('mouse'); updateTouchControlsVisibility(); } });
addEventListener('gamepadconnected', () => { input.setMode('gamepad'); updateTouchControlsVisibility(); });
function updateTouchControlsVisibility() { const el = document.querySelector('#touch-controls'); if (el instanceof HTMLElement) el.classList.toggle('hidden', input.mode !== 'touch'); }
document.querySelector('#enter')?.addEventListener('click', () => { loadState(); updateDevelopmentVisuals(); started = true; document.querySelector('#title')?.classList.add('hidden'); document.querySelector('#hud')?.classList.remove('hidden'); document.querySelector('#help')?.classList.remove('hidden'); updateTouchControlsVisibility(); status('TRAVERSAL ONLINE // POINTER LOCK READY'); showOnboardingHint('welcome', 'The city remembers what you do to it. WASD/stick to move, Space/JUMP to traverse, F/HIT to fight.'); });
document.querySelector('#timeline')?.addEventListener('input', (event) => { historyViewYear = Number((event.target as HTMLInputElement).value); const output = document.querySelector('#timeline-year'); if (output) output.textContent = String(historyViewYear); renderHistoryInspector(); });

// --- Settings dialog: quality tier, accessibility toggles, and live key rebinding. ---
const settingsDialog = document.querySelector('#settings');
function openSettings() { if (settingsDialog instanceof HTMLDialogElement && !settingsDialog.open) settingsDialog.showModal(); renderBindingList(); }
document.querySelector('#open-settings')?.addEventListener('click', openSettings);
document.querySelector('#settings-toggle')?.addEventListener('click', openSettings);
document.querySelector('#close-settings')?.addEventListener('click', () => { if (settingsDialog instanceof HTMLDialogElement) settingsDialog.close(); });
const qualitySelect = document.querySelector('#quality-select');
if (qualitySelect instanceof HTMLSelectElement) { qualitySelect.value = settings.qualityTier; qualitySelect.addEventListener('change', () => { settings.qualityTier = qualitySelect.value as QualityTierSetting; saveSettings(settings); if (settings.qualityTier === 'auto') { frameBudget.auto = true; } else { frameBudget.auto = false; frameBudget.level = settings.qualityTier; applyQualityLevel(settings.qualityTier); } }); }
function bindAccessibilityToggle(id: string, get: () => boolean, set: (value: boolean) => void) { const el = document.querySelector(id); if (!(el instanceof HTMLInputElement)) return; el.checked = get(); el.addEventListener('change', () => { set(el.checked); saveSettings(settings); }); }
bindAccessibilityToggle('#setting-reduced-shake', () => settings.accessibility.reducedShake, (v) => { settings.accessibility.reducedShake = v; reducedShake = v; });
bindAccessibilityToggle('#setting-reduced-flash', () => settings.accessibility.reducedFlash, (v) => { settings.accessibility.reducedFlash = v; });
bindAccessibilityToggle('#setting-high-contrast', () => settings.accessibility.highContrastHud, (v) => { settings.accessibility.highContrastHud = v; document.querySelector('#hud')?.classList.toggle('high-contrast', v); });
bindAccessibilityToggle('#setting-hold-toggle', () => settings.accessibility.holdToggleAssist, (v) => { settings.accessibility.holdToggleAssist = v; });
bindAccessibilityToggle('#setting-haptics', () => settings.hapticsEnabled, (v) => { settings.hapticsEnabled = v; });
function renderBindingList() {
  const list = document.querySelector('#binding-list');
  if (!(list instanceof HTMLElement)) return;
  list.replaceChildren();
  for (const action of REBINDABLE_ACTIONS) {
    const currentKey = Object.entries(input.bindings).find(([, actions]) => actions.includes(action))?.[0] ?? '—';
    const label = document.createElement('span'); label.textContent = action;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = currentKey.toUpperCase();
    button.addEventListener('click', () => {
      button.textContent = 'PRESS A KEY'; button.classList.add('listening');
      const capture = (event: KeyboardEvent) => {
        event.preventDefault();
        const key = event.key === ' ' ? 'space' : event.key.toLowerCase();
        const next: Record<string, GameAction[]> = {}; for (const existingKey of Object.keys(input.bindings)) next[existingKey] = input.bindings[existingKey].filter((a) => a !== action);
        next[key] = [...(next[key] ?? []), action];
        input.setBindings(next); persistSettings(); renderBindingList();
        removeEventListener('keydown', capture, true);
      };
      addEventListener('keydown', capture, true);
    });
    list.append(label, button);
  }
}
document.querySelector('#reset-bindings')?.addEventListener('click', () => { input.resetBindings(); persistSettings(); renderBindingList(); });

// --- World-space affordances: contextual labels anchored to world positions (the grapple
// anchor, the landmark) instead of a static always-on-screen prompt list. ---
const worldAffordanceLayer = document.querySelector('#world-affordances');
function projectAffordance(id: string, worldPosition: THREE.Vector3, text: string) {
  if (!(worldAffordanceLayer instanceof HTMLElement)) return;
  const projected = worldPosition.clone().project(camera);
  if (projected.z > 1) { document.querySelector(`[data-affordance="${id}"]`)?.remove(); return; }
  const x = (projected.x * .5 + .5) * innerWidth; const y = (projected.y * -.5 + .5) * innerHeight;
  let label = worldAffordanceLayer.querySelector(`[data-affordance="${id}"]`);
  if (!(label instanceof HTMLElement)) { label = document.createElement('div'); label.className = 'world-affordance-label'; label.setAttribute('data-affordance', id); worldAffordanceLayer.append(label); }
  label.textContent = text; label.style.left = `${x}px`; label.style.top = `${y}px`;
  label.style.display = x < -40 || x > innerWidth + 40 || y < -40 || y > innerHeight + 40 ? 'none' : 'block';
}
function updateWorldAffordances() {
  if (!(worldAffordanceLayer instanceof HTMLElement)) return;
  worldAffordanceLayer.classList.toggle('hidden', !started || paused);
  if (!started || paused) return;
  if (landmark.visible) projectAffordance('landmark', landmark.position.clone().add(new THREE.Vector3(0, 16, 0)), 'THE CISTERN SPIRE');
  if (grappleTarget) projectAffordance('grapple', grappleTarget, 'GRAPPLE ANCHOR');
  else document.querySelector('[data-affordance="grapple"]')?.remove();
}

// --- Adaptive onboarding: bounded, non-repeating hints shown once per settings-persisted id. ---
function showOnboardingHint(id: string, text: string) {
  if (settings.onboardingSeen.includes(id)) return;
  settings.onboardingSeen.push(id); saveSettings(settings);
  const el = document.querySelector('#onboarding');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = text; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}

// --- Touch controls: movement zone (virtual joystick), look zone (drag to orbit), action cluster. ---
function setupTouchZone(zoneId: string, onMove: (x: number, z: number) => void, onEnd?: () => void) {
  const zone = document.querySelector(zoneId);
  if (!(zone instanceof HTMLElement)) return;
  let activePointer: number | null = null; let originX = 0, originY = 0;
  const radius = 64;
  zone.addEventListener('pointerdown', (event) => { activePointer = event.pointerId; originX = event.clientX; originY = event.clientY; zone.setPointerCapture(event.pointerId); });
  zone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointer) return;
    const dx = event.clientX - originX, dy = event.clientY - originY;
    const clampedX = Math.max(-radius, Math.min(radius, dx)) / radius;
    const clampedY = Math.max(-radius, Math.min(radius, dy)) / radius;
    onMove(clampedX, clampedY);
  });
  const end = (event: PointerEvent) => { if (event.pointerId !== activePointer) return; activePointer = null; onEnd?.(); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('pointerleave', end);
}
setupTouchZone('#touch-move-zone', (x, y) => { input.setAnalogMove(x, y, 'touch'); const stick = document.querySelector('#touch-move-stick'); if (stick instanceof HTMLElement) stick.style.transform = `translate(${x * 34}px, ${y * 34}px)`; }, () => { input.setAnalogMove(0, 0, 'touch'); const stick = document.querySelector('#touch-move-stick'); if (stick instanceof HTMLElement) stick.style.transform = 'translate(0, 0)'; });
// The look zone provides drag-to-orbit camera assistance for touch: no hard lock-on is applied
// (per the "do not implement hard lock-on unless clearly justified" constraint) -- it is a
// direct, player-driven analog drag, identical in kind to a mouse-look delta.
(() => {
  const zone = document.querySelector('#touch-look-zone');
  if (!(zone instanceof HTMLElement)) return;
  let activePointer: number | null = null; let lastX = 0, lastY = 0;
  zone.addEventListener('pointerdown', (event) => { activePointer = event.pointerId; lastX = event.clientX; lastY = event.clientY; zone.setPointerCapture(event.pointerId); });
  zone.addEventListener('pointermove', (event) => { if (event.pointerId !== activePointer) return; input.addLookDelta((event.clientX - lastX) * 2.1, (event.clientY - lastY) * 2.1, 'touch'); lastX = event.clientX; lastY = event.clientY; });
  const end = (event: PointerEvent) => { if (event.pointerId !== activePointer) return; activePointer = null; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
})();
function bindTouchButton(id: string, action: GameAction) {
  const button = document.querySelector(id);
  if (!(button instanceof HTMLElement)) return;
  const holdToggle = () => settings.accessibility.holdToggleAssist;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); if (holdToggle()) { const held = input.down.has(action); input.setAction(action, !held, 'touch'); button.classList.toggle('active', !held); } else { input.setAction(action, true, 'touch'); button.classList.add('active'); } vibrate(8); });
  button.addEventListener('pointerup', () => { if (!holdToggle()) { input.setAction(action, false, 'touch'); button.classList.remove('active'); } });
  button.addEventListener('pointercancel', () => { if (!holdToggle()) { input.setAction(action, false, 'touch'); button.classList.remove('active'); } });
}
bindTouchButton('#touch-jump', Action.Jump); bindTouchButton('#touch-attack', Action.Attack); bindTouchButton('#touch-sprint', Action.Sprint);
bindTouchButton('#touch-dash', Action.Dash); bindTouchButton('#touch-grapple', Action.Grapple); bindTouchButton('#touch-glide', Action.Glide);
function vibrate(ms: number) { if (settings.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) { try { navigator.vibrate(ms); } catch { /* haptics are best-effort and optional */ } } }

// --- Frame-budget-driven resource lifecycle: page-visibility suspension and WebGL context loss. ---
let wasPausedBeforeHidden = false;
document.addEventListener('visibilitychange', () => { if (document.hidden) { wasPausedBeforeHidden = paused; paused = true; } else if (started && !wasPausedBeforeHidden) { paused = false; last = performance.now(); } document.querySelector('#pause')?.classList.toggle('hidden', !paused); });
renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); paused = true; status('RENDERER // CONTEXT LOST, RECOVERING'); });
renderer.domElement.addEventListener('webglcontextrestored', () => { applyQualityLevel(qualityLevel); paused = false; status('RENDERER // CONTEXT RESTORED'); });
window.render_game_to_text = () => JSON.stringify({ coordinateSystem: 'Three.js world: x east, y up, z south', mode: paused ? 'paused' : started ? 'explore' : 'title', saveVersion: SAVE_VERSION, year: history.year, player: { x: +player.position.x.toFixed(2), y: +player.position.y.toFixed(2), z: +player.position.z.toFixed(2), vx: +velocity.x.toFixed(2), vy: +velocity.y.toFixed(2), vz: +velocity.z.toFixed(2) }, rival: { health: rivalHealth, visible: rival.visible, attackCooldown: +rivalAttackCooldown.toFixed(2) }, playerCombat: { health: playerCombat.health, hitFlash: +playerHitFlash.toFixed(2), attackCooldown: +attackCooldown.toFixed(2) }, battleOutcome: lastBattleOutcome, bridge: { visible: bridge.visible, integrity: +bridgeStructure.integrity.toFixed(1), support: +bridgeStructure.support.toFixed(2), collapsed: bridgeStructure.collapsed }, development: history.development, districtPolicies: districtRoutes.map((route) => ({ district: route.direction < 0 ? 'west' : 'east', routeLength: +route.mesh.scale.x.toFixed(2), safety: route.direction < 0 ? history.development.westSafety : history.development.eastSafety, transit: route.direction < 0 ? history.development.westTransit : history.development.eastTransit })), historyInspectorOpen, history: history.events.slice(-12), historyViewYear, deepTime, scars: scars.map(({ x, z, year, radius }) => ({ x, z, year, radius })), traversal: { ...traversal, wallTime: +traversal.wallTime.toFixed(2), dashCooldown: +dashCooldown.toFixed(2), cameraYaw: +cameraYaw.toFixed(2), cameraPitch: +cameraPitch.toFixed(2), cameraSensitivity, reducedShake, debris: debris.map((d) => ({ id: d.id, x: +d.mesh.position.x.toFixed(1), z: +d.mesh.position.z.toFixed(1), active: d.active, age: +d.age.toFixed(1) })) }, performance: { pixelRatio: renderer.getPixelRatio(), drawCalls: renderer.info.render.calls, frameBudgetState: { level: frameBudget.level, auto: frameBudget.auto, averageFrameMs: +frameBudget.averageFrameMs.toFixed(2) } }, buildings: buildings.map((b) => ({ id: b.id, x: b.x, z: b.z, height: b.height, visible: b.mesh.visible, integrity: +b.structure.integrity.toFixed(1), support: +b.structure.support.toFixed(2), collapsed: b.structure.collapsed })), rubbleCount: rubble.length,
  inputMode: input.mode, qualityMode: settings.qualityTier, qualityTier: qualityLevel, hudMode, cityEra: Math.floor(history.year / 100),
  districtStates: (['west', 'central', 'east'] as const).map((district) => ({ district, parcelCount: cityState.parcels.filter((p) => p.district === district).length })),
  landUseCounts: cityState.parcels.reduce<Record<string, number>>((acc, parcel) => { acc[parcel.landUse] = (acc[parcel.landUse] ?? 0) + 1; return acc; }, {}),
  trafficCount: trafficSedanMesh.count + trafficVanMesh.count + trafficBusMesh.count, trafficVehicleTypes: { sedan: trafficSedanMesh.count, van: trafficVanMesh.count, bus: trafficBusMesh.count }, pedestrianCount: pedestrianMesh.count, streetActivityCount: activityCounts.streetActivityCount,
  activeChunkCount: occupiedCellCount(buildingGrid), cityDetailCount: cityDetailMesh.count,
  landmarkStates: cityState.landmarks.map((landmarkState) => ({ id: landmarkState.id, name: landmarkState.name, status: landmarkState.status, district: landmarkState.district })),
  publicMemoryCount: cityState.publicMemory.length,
  materialLineageCount: cityState.parcels.reduce((total, parcel) => total + parcel.materialLineageIds.length, 0) + history.relics.length,
});
window.advanceTime = (ms: number) => { manualStepping = true; const steps = Math.max(1, Math.round(ms / (1000 / 60))); for (let i = 0; i < steps; i += 1) { input.syncMove(); update(1 / 60); updateDebris(1 / 60); updateRubble(1 / 60); applyLookDelta(); input.consumeFrame(); } last = performance.now(); updateCamera(0); renderer.render(scene, camera); };
camera.position.set(0, 17, 62); camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
applyQualityLevel(settings.qualityTier === 'auto' ? 'high' : settings.qualityTier);
if (settings.qualityTier !== 'auto') { frameBudget.auto = false; frameBudget.level = settings.qualityTier; }
requestAnimationFrame(frame);
