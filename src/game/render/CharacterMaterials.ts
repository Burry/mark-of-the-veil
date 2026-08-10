import * as THREE from 'three';

export interface MarkMaterials {
  fur: THREE.MeshPhysicalMaterial;
  shortFur: THREE.MeshPhysicalMaterial;
  darkFur: THREE.MeshPhysicalMaterial;
  guardFur: THREE.MeshPhysicalMaterial;
  mane: THREE.MeshPhysicalMaterial;
  maneEdge: THREE.MeshPhysicalMaterial;
  skin: THREE.MeshPhysicalMaterial;
  armor: THREE.MeshPhysicalMaterial;
  armorEdge: THREE.MeshPhysicalMaterial;
  armorWear: THREE.MeshPhysicalMaterial;
  bronze: THREE.MeshPhysicalMaterial;
  leather: THREE.MeshPhysicalMaterial;
  cloth: THREE.MeshStandardMaterial;
  horn: THREE.MeshPhysicalMaterial;
  hornGroove: THREE.MeshPhysicalMaterial;
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
    2.35,
    2.65,
  );
  const furHeight = loadSharedTexture(
    '/assets/materials/mark-fur-height.webp',
    'linear',
    2.35,
    2.65,
  );
  const furRoughness = loadSharedTexture(
    '/assets/materials/mark-fur-roughness.webp',
    'linear',
    2.35,
    2.65,
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
    color: 0xe7dce9,
    map: furAtlas,
    emissive: new THREE.Color(0x34253a),
    emissiveMap: furAtlas,
    emissiveIntensity: 0.22,
    roughness: 0.82,
    roughnessMap: furRoughness,
    metalness: 0,
    bumpMap: furHeight,
    bumpScale: 0.13,
    sheen: 0.64,
    sheenColor: new THREE.Color(0xd7bfe8),
    sheenRoughness: 0.76,
    anisotropy: 0.34,
    anisotropyRotation: Math.PI / 2,
    specularIntensity: 0.32,
    specularColor: new THREE.Color(0xd8c3e4),
    envMapIntensity: 0.72,
  });
  tagMaterial(fur, 'Mark fur | long coat', 'mapped-coat');
  const shortFur = fur.clone();
  shortFur.color.setHex(0xc7b8cd);
  shortFur.bumpScale = 0.105;
  shortFur.emissiveIntensity = 0.17;
  shortFur.sheen = 0.48;
  shortFur.sheenRoughness = 0.82;
  tagMaterial(shortFur, 'Mark fur | short coat', 'mapped-coat');
  const darkFur = fur.clone();
  darkFur.color.setHex(0x8c788f);
  darkFur.bumpScale = 0.115;
  darkFur.emissiveIntensity = 0.11;
  darkFur.sheen = 0.38;
  darkFur.envMapIntensity = 0.58;
  tagMaterial(darkFur, 'Mark fur | shadow coat', 'mapped-coat');
  const guardFur = fur.clone();
  guardFur.color.setHex(0x715c78);
  guardFur.map = null;
  guardFur.bumpMap = null;
  guardFur.roughnessMap = null;
  guardFur.emissiveMap = null;
  guardFur.emissive.setHex(0x140b19);
  guardFur.emissiveIntensity = 0.08;
  guardFur.roughness = 0.85;
  guardFur.sheen = 0.52;
  guardFur.sheenRoughness = 0.76;
  guardFur.envMapIntensity = 0.58;
  tagMaterial(guardFur, 'Mark fur | guard hairs', 'silhouette-fiber');

  const mane = new THREE.MeshPhysicalMaterial({
    color: 0xbc6bd1,
    map: furAtlas,
    emissive: new THREE.Color(0x2c1038),
    emissiveMap: furAtlas,
    emissiveIntensity: 0.24,
    roughness: 0.82,
    roughnessMap: furRoughness,
    bumpMap: furHeight,
    bumpScale: 0.095,
    sheen: 0.74,
    sheenColor: new THREE.Color(0xd28ee5),
    sheenRoughness: 0.66,
    anisotropy: 0.58,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0,
    envMapIntensity: 0.88,
  });
  tagMaterial(mane, 'Mark mane | primary locks', 'mapped-mane');
  const maneEdge = mane.clone();
  maneEdge.color.setHex(0x673176);
  maneEdge.map = null;
  maneEdge.bumpMap = null;
  maneEdge.roughnessMap = null;
  maneEdge.roughness = 0.7;
  maneEdge.sheen = 0.94;
  maneEdge.sheenRoughness = 0.55;
  maneEdge.emissiveMap = null;
  maneEdge.emissive.setHex(0x120719);
  maneEdge.emissiveIntensity = 0.1;
  tagMaterial(maneEdge, 'Mark mane | flyaways', 'silhouette-fiber');
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0x4a3548,
    roughness: 0.64,
    bumpMap: grit,
    bumpScale: 0.085,
    clearcoat: 0.16,
    clearcoatRoughness: 0.72,
    sheen: 0.08,
    sheenColor: new THREE.Color(0x9d728f),
    specularIntensity: 0.38,
    specularColor: new THREE.Color(0x9b7a90),
    envMapIntensity: 0.54,
  });
  tagMaterial(skin, 'Mark skin | muzzle and ears', 'porous-skin');
  const armor = new THREE.MeshPhysicalMaterial({
    color: 0xe0e4e5,
    map: armorAtlas,
    emissive: new THREE.Color(0x22272a),
    emissiveMap: armorAtlas,
    emissiveIntensity: 0.16,
    metalness: 0.82,
    roughness: 0.56,
    roughnessMap: armorRoughness,
    bumpMap: armorHeight,
    bumpScale: 0.075,
    clearcoat: 0.16,
    clearcoatRoughness: 0.48,
    anisotropy: 0.2,
    envMapIntensity: 1.62,
  });
  tagMaterial(armor, 'Mark armor | oxidized plate', 'worn-metal');
  const armorEdge = armor.clone();
  armorEdge.color.setHex(0xf1f1ed);
  armorEdge.roughness = 0.38;
  armorEdge.bumpScale = 0.052;
  armorEdge.clearcoat = 0.24;
  armorEdge.envMapIntensity = 1.94;
  tagMaterial(armorEdge, 'Mark armor | exposed edges', 'polished-metal-edge');
  const armorWear = armor.clone();
  armorWear.color.setHex(0xb79a7b);
  armorWear.roughness = 0.44;
  armorWear.bumpScale = 0.064;
  armorWear.clearcoat = 0.08;
  armorWear.envMapIntensity = 1.45;
  tagMaterial(armorWear, 'Mark armor | abraded inlay', 'battle-wear');
  const bronze = new THREE.MeshPhysicalMaterial({
    color: 0x8c613d,
    metalness: 0.9,
    roughness: 0.46,
    bumpMap: brushed,
    bumpScale: 0.038,
    clearcoat: 0.16,
    clearcoatRoughness: 0.42,
    anisotropy: 0.48,
    envMapIntensity: 1.72,
  });
  tagMaterial(bronze, 'Mark armor | aged bronze', 'brushed-metal');
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x38251e,
    roughness: 0.86,
    metalness: 0.02,
    bumpMap: grit,
    bumpScale: 0.12,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x8b5642),
    sheenRoughness: 0.88,
    clearcoat: 0.04,
  });
  tagMaterial(leather, 'Mark harness | scarred leather', 'organic-harness');
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x17131a,
    roughness: 1,
    bumpMap: fiberNoise,
    bumpScale: 0.15,
  });
  tagMaterial(cloth, 'Mark blindfold | woven cloth', 'woven-cloth');
  const horn = new THREE.MeshPhysicalMaterial({
    color: 0xb9a7c1,
    roughness: 0.38,
    metalness: 0.04,
    bumpMap: grit,
    bumpScale: 0.07,
    clearcoat: 0.32,
    clearcoatRoughness: 0.31,
    iridescence: 0.12,
    iridescenceIOR: 1.32,
    emissive: new THREE.Color(0x13091b),
    emissiveIntensity: 0.16,
    envMapIntensity: 1.12,
  });
  tagMaterial(horn, 'Mark horn | keratin', 'layered-keratin');
  const hornGroove = horn.clone();
  hornGroove.color.setHex(0x4d3d55);
  hornGroove.roughness = 0.61;
  hornGroove.clearcoat = 0.12;
  hornGroove.iridescence = 0.04;
  hornGroove.emissiveIntensity = 0.06;
  tagMaterial(hornGroove, 'Mark horn | growth grooves', 'layered-keratin');
  const eye = new THREE.MeshStandardMaterial({
    color: 0xc8b9cf,
    emissive: 0x4f2d76,
    emissiveIntensity: 1.05,
    metalness: 0.04,
    roughness: 0.16,
  });
  tagMaterial(eye, 'Mark eyes | veiled glow', 'subtle-emissive');

  installCoatMicrodetail(fur, new THREE.Color(0xd7bedf), 0.14, 1.7);
  installCoatMicrodetail(shortFur, new THREE.Color(0xc9b1d2), 0.12, 3.1);
  installCoatMicrodetail(darkFur, new THREE.Color(0x91779b), 0.1, 5.3);
  installCoatMicrodetail(mane, new THREE.Color(0xd386e3), 0.16, 7.9);

  return {
    fur,
    shortFur,
    darkFur,
    guardFur,
    mane,
    maneEdge,
    skin,
    armor,
    armorEdge,
    armorWear,
    bronze,
    leather,
    cloth,
    horn,
    hornGroove,
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

function installCoatMicrodetail(
  material: THREE.MeshPhysicalMaterial,
  fiberTint: THREE.Color,
  strength: number,
  seed: number,
): void {
  const tint = `${fiberTint.r.toFixed(5)}, ${fiberTint.g.toFixed(5)}, ${fiberTint.b.toFixed(5)}`;
  const shaderKey = `mark-coat-microdetail:${tint}:${strength}:${seed}`;
  material.userData.markCoatMicrodetail = { strength, seed };
  material.customProgramCacheKey = () => shaderKey;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float markFiberWave = sin((vMapUv.y * 238.0 + sin(vMapUv.x * 51.0 + ${seed.toFixed(
        2,
      )}) * 5.5) * 6.2831853);
      float markCrossFiber = sin((vMapUv.x * 97.0 - vMapUv.y * 31.0 + ${seed.toFixed(
        2,
      )}) * 6.2831853);
      float markFiber = smoothstep(0.78, 0.99, abs(markFiberWave)) *
        (0.72 + 0.28 * abs(markCrossFiber));
      float markClump = 0.5 + 0.5 * sin((vMapUv.x * 17.0 + vMapUv.y * 23.0 + ${seed.toFixed(
        2,
      )}) * 6.2831853);
      float markCoatDetail = clamp(markFiber * 0.75 + markClump * 0.25, 0.0, 1.0);
      diffuseColor.rgb *= mix(${(1 - strength).toFixed(4)}, ${(1 + strength).toFixed(
        4,
      )}, markCoatDetail);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${tint}), markFiber * ${(
        strength * 0.28
      ).toFixed(4)});`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor *= mix(${(1 + strength * 0.4).toFixed(4)}, ${(1 - strength * 0.75).toFixed(
        4,
      )}, markFiber);`,
    );
  };
}

function tagMaterial<TMaterial extends THREE.Material>(
  material: TMaterial,
  name: string,
  layer: string,
): TMaterial {
  material.name = name;
  material.userData.markMaterialLayer = layer;
  return material;
}
