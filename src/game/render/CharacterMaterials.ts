import * as THREE from 'three';

export interface MarkMaterials {
  fur: THREE.MeshPhysicalMaterial;
  shortFur: THREE.MeshPhysicalMaterial;
  darkFur: THREE.MeshPhysicalMaterial;
  mane: THREE.MeshPhysicalMaterial;
  skin: THREE.MeshPhysicalMaterial;
  armor: THREE.MeshPhysicalMaterial;
  armorEdge: THREE.MeshPhysicalMaterial;
  bronze: THREE.MeshPhysicalMaterial;
  leather: THREE.MeshPhysicalMaterial;
  cloth: THREE.MeshStandardMaterial;
  horn: THREE.MeshPhysicalMaterial;
  eye: THREE.MeshStandardMaterial;
}

export interface WeaponMaterials {
  bronze: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshPhysicalMaterial;
  steel: THREE.MeshPhysicalMaterial;
  leather: THREE.MeshPhysicalMaterial;
  energy: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
}

export interface HiveMaterials {
  carapace: THREE.MeshPhysicalMaterial;
  edge: THREE.MeshPhysicalMaterial;
  tendon: THREE.MeshPhysicalMaterial;
  membrane: THREE.MeshPhysicalMaterial;
  teeth: THREE.MeshPhysicalMaterial;
  core: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
}

const sharedTextures = new Map<string, THREE.Texture>();

export function createMarkMaterials(): MarkMaterials {
  const furAtlas = loadSharedTexture(
    '/assets/materials/mark-fur-albedo-v2.webp',
    'srgb',
    1.15,
    1.15,
  );
  const furHeight = loadSharedTexture(
    '/assets/materials/mark-fur-height.webp',
    'linear',
    1.15,
    1.15,
  );
  const furRoughness = loadSharedTexture(
    '/assets/materials/mark-fur-roughness.webp',
    'linear',
    1.15,
    1.15,
  );
  const fiberNoise = getProceduralTexture('fiber-noise', 256, createFiberNoise);
  const armorAtlas = loadSharedTexture(
    '/assets/materials/mark-armor-albedo.webp',
    'srgb',
    1.65,
    1.65,
  );
  const armorHeight = loadSharedTexture(
    '/assets/materials/mark-armor-height.webp',
    'linear',
    1.65,
    1.65,
  );
  const armorRoughness = loadSharedTexture(
    '/assets/materials/mark-armor-roughness.webp',
    'linear',
    1.65,
    1.65,
  );
  const grit = getProceduralTexture('character-grit', 256, createGrit);
  const brushed = getProceduralTexture('brushed-metal', 256, createBrushedMetal);

  const fur = new THREE.MeshPhysicalMaterial({
    color: 0x8c788f,
    map: furAtlas,
    roughness: 0.98,
    roughnessMap: furRoughness,
    metalness: 0,
    bumpMap: furHeight,
    bumpScale: 0.055,
    sheen: 0.24,
    sheenColor: new THREE.Color(0x9179a1),
    sheenRoughness: 0.94,
    envMapIntensity: 0.36,
  });
  const shortFur = fur.clone();
  shortFur.color.setHex(0x746078);
  shortFur.bumpScale = 0.045;
  shortFur.sheen = 0.18;
  const darkFur = fur.clone();
  darkFur.color.setHex(0x493b4e);
  darkFur.bumpScale = 0.05;

  const mane = new THREE.MeshPhysicalMaterial({
    color: 0x4e1b6f,
    map: furAtlas,
    roughness: 0.96,
    roughnessMap: furRoughness,
    bumpMap: furHeight,
    bumpScale: 0.065,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x8d4dac),
    sheenRoughness: 0.82,
    clearcoat: 0,
    envMapIntensity: 0.42,
  });
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0x251b27,
    roughness: 0.72,
    bumpMap: grit,
    bumpScale: 0.055,
    clearcoat: 0.08,
  });
  const armor = new THREE.MeshPhysicalMaterial({
    color: 0xb6b9bc,
    map: armorAtlas,
    metalness: 0.86,
    roughness: 0.72,
    roughnessMap: armorRoughness,
    bumpMap: armorHeight,
    bumpScale: 0.045,
    clearcoat: 0.12,
    clearcoatRoughness: 0.56,
    envMapIntensity: 1.35,
  });
  const armorEdge = armor.clone();
  armorEdge.color.setHex(0xd2d5d6);
  armorEdge.roughness = 0.58;
  armorEdge.bumpScale = 0.032;
  const bronze = new THREE.MeshPhysicalMaterial({
    color: 0x76502e,
    metalness: 0.94,
    roughness: 0.36,
    bumpMap: brushed,
    bumpScale: 0.026,
    clearcoat: 0.22,
    clearcoatRoughness: 0.34,
    envMapIntensity: 1.8,
  });
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x201713,
    roughness: 0.88,
    metalness: 0.02,
    bumpMap: grit,
    bumpScale: 0.09,
    sheen: 0.12,
    sheenColor: new THREE.Color(0x7b4935),
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x100e12,
    roughness: 1,
    bumpMap: fiberNoise,
    bumpScale: 0.12,
  });
  const horn = new THREE.MeshPhysicalMaterial({
    color: 0x8f789e,
    roughness: 0.3,
    metalness: 0.04,
    bumpMap: grit,
    bumpScale: 0.04,
    clearcoat: 0.52,
    clearcoatRoughness: 0.24,
    iridescence: 0.18,
    iridescenceIOR: 1.32,
    emissive: new THREE.Color(0x1c0b29),
    emissiveIntensity: 0.22,
  });
  const eye = new THREE.MeshStandardMaterial({
    color: 0xe5dcff,
    emissive: 0x8357ff,
    emissiveIntensity: 2.7,
    metalness: 0.08,
    roughness: 0.08,
  });

  return {
    fur,
    shortFur,
    darkFur,
    mane,
    skin,
    armor,
    armorEdge,
    bronze,
    leather,
    cloth,
    horn,
    eye,
  };
}

export function createWeaponMaterials(): WeaponMaterials {
  const grit = getProceduralTexture('character-grit', 256, createGrit);
  const brushed = getProceduralTexture('brushed-metal', 256, createBrushedMetal);
  const armorAtlas = loadSharedTexture(
    '/assets/materials/mark-armor-albedo.webp',
    'srgb',
    1.85,
    1.85,
  );
  const armorHeight = loadSharedTexture(
    '/assets/materials/mark-armor-height.webp',
    'linear',
    1.85,
    1.85,
  );
  const armorRoughness = loadSharedTexture(
    '/assets/materials/mark-armor-roughness.webp',
    'linear',
    1.85,
    1.85,
  );
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x9da2a5,
    map: armorAtlas,
    metalness: 0.9,
    roughness: 0.66,
    roughnessMap: armorRoughness,
    bumpMap: armorHeight,
    bumpScale: 0.038,
    clearcoat: 0.14,
    clearcoatRoughness: 0.5,
    envMapIntensity: 1.45,
  });
  const bronze = new THREE.MeshPhysicalMaterial({
    color: 0x76502e,
    metalness: 0.96,
    roughness: 0.32,
    bumpMap: brushed,
    bumpScale: 0.022,
    clearcoat: 0.2,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.95,
  });
  const steel = dark.clone();
  steel.color.setHex(0x4d565a);
  steel.roughness = 0.2;
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x2b1e18,
    roughness: 0.92,
    bumpMap: grit,
    bumpScale: 0.1,
  });
  const energy = new THREE.MeshStandardMaterial({
    color: 0xe7dcff,
    emissive: 0x7952ff,
    emissiveIntensity: 4.8,
    metalness: 0.05,
    roughness: 0.08,
    toneMapped: false,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xa997ff,
    emissive: 0x39257e,
    emissiveIntensity: 1.4,
    metalness: 0.05,
    roughness: 0.08,
    transmission: 0.22,
    thickness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  return { bronze, dark, steel, leather, energy, glass };
}

export function createHiveMaterials(coreColor = 0xff4b2f): HiveMaterials {
  const chitinAtlas = loadSharedTexture(
    '/assets/materials/hive-chitin-albedo.webp',
    'srgb',
    1.25,
    1.25,
  );
  const chitinHeight = loadSharedTexture(
    '/assets/materials/hive-chitin-height.webp',
    'linear',
    1.25,
    1.25,
  );
  const chitinRoughness = loadSharedTexture(
    '/assets/materials/hive-chitin-roughness.webp',
    'linear',
    1.25,
    1.25,
  );
  const tissueHeight = getProceduralTexture('tissue-height', 256, createTissueHeight);

  const carapace = new THREE.MeshPhysicalMaterial({
    color: 0x879095,
    map: chitinAtlas,
    metalness: 0.58,
    roughness: 0.3,
    roughnessMap: chitinRoughness,
    bumpMap: chitinHeight,
    bumpScale: 0.13,
    clearcoat: 0.66,
    clearcoatRoughness: 0.3,
    iridescence: 0.38,
    iridescenceIOR: 1.62,
    iridescenceThicknessRange: [110, 430],
    envMapIntensity: 1.85,
  });
  const edge = carapace.clone();
  edge.color.setHex(0x4a5359);
  edge.metalness = 0.74;
  edge.roughness = 0.2;
  edge.bumpScale = 0.075;
  const tendon = new THREE.MeshPhysicalMaterial({
    color: 0x40151c,
    roughness: 0.5,
    roughnessMap: tissueHeight,
    bumpMap: tissueHeight,
    bumpScale: 0.16,
    clearcoat: 0.82,
    clearcoatRoughness: 0.22,
    sheen: 0.32,
    sheenColor: new THREE.Color(0x8f2732),
    envMapIntensity: 1.25,
  });
  const membrane = new THREE.MeshPhysicalMaterial({
    color: 0x172322,
    metalness: 0.06,
    roughness: 0.44,
    bumpMap: tissueHeight,
    bumpScale: 0.08,
    clearcoat: 0.46,
    clearcoatRoughness: 0.36,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const teeth = new THREE.MeshPhysicalMaterial({
    color: 0x7e7967,
    roughness: 0.47,
    bumpMap: chitinHeight,
    bumpScale: 0.05,
    clearcoat: 0.18,
  });
  const core = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: coreColor,
    emissiveIntensity: 4.4,
    metalness: 0.18,
    roughness: 0.08,
    toneMapped: false,
  });
  const eye = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: coreColor,
    emissiveIntensity: 3.6,
    metalness: 0.05,
    roughness: 0.05,
    toneMapped: false,
  });
  return { carapace, edge, tendon, membrane, teeth, core, eye };
}

function loadSharedTexture(
  url: string,
  colorSpace: 'srgb' | 'linear',
  repeatX: number,
  repeatY: number,
): THREE.Texture {
  const key = `${url}:${colorSpace}:${repeatX}:${repeatY}`;
  const cached = sharedTextures.get(key);
  if (cached) return cached;
  const texture = new THREE.TextureLoader().load(url);
  texture.name = url.split('/').at(-1) ?? 'character-atlas';
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = colorSpace === 'srgb' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.userData.shared = true;
  sharedTextures.set(key, texture);
  return texture;
}

function getProceduralTexture(
  key: string,
  size: number,
  sampler: (x: number, y: number, size: number) => number,
): THREE.DataTexture {
  const cached = sharedTextures.get(key);
  if (cached instanceof THREE.DataTexture) return cached;
  const pixels = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      pixels[y * size + x] = Math.round(THREE.MathUtils.clamp(sampler(x, y, size), 0, 1) * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  texture.name = key;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.NoColorSpace;
  texture.userData.shared = true;
  texture.needsUpdate = true;
  sharedTextures.set(key, texture);
  return texture;
}

function createFiberNoise(x: number, y: number, size: number): number {
  const nx = x / size;
  const ny = y / size;
  const direction = Math.sin((nx * 52 + Math.sin(ny * 13) * 1.8) * Math.PI);
  const clump = fbm(nx * 8.4, ny * 8.4, 17);
  const fiber = Math.pow(Math.abs(direction), 7) * 0.42;
  return 0.24 + clump * 0.42 + fiber;
}

function createTissueHeight(x: number, y: number, size: number): number {
  const nx = x / size;
  const ny = y / size;
  const sinew = Math.abs(Math.sin((nx * 19 + Math.sin(ny * 5) * 1.4) * Math.PI));
  return 0.16 + sinew * 0.47 + fbm(nx * 12, ny * 12, 73) * 0.31;
}

function createGrit(x: number, y: number, size: number): number {
  const nx = x / size;
  const ny = y / size;
  const scratches = Math.pow(Math.abs(Math.sin((nx * 61 + ny * 3.2) * Math.PI)), 20);
  return 0.2 + fbm(nx * 14, ny * 14, 101) * 0.62 + scratches * 0.18;
}

function createBrushedMetal(x: number, y: number, size: number): number {
  const nx = x / size;
  const ny = y / size;
  const brush = Math.abs(Math.sin((ny * 93 + Math.sin(nx * 12) * 0.7) * Math.PI));
  return 0.28 + brush * 0.23 + fbm(nx * 21, ny * 8, 149) * 0.46;
}

function fbm(x: number, y: number, seed: number): number {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    value += smoothNoise(x * frequency, y * frequency, seed + octave * 19) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.48;
  }
  return value / 1.03;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, sx), THREE.MathUtils.lerp(c, d, sx), sy);
}

function hash(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}
