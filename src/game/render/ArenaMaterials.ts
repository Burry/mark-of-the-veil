import * as THREE from 'three';

export interface ArenaMaterialLibrary {
  floor: THREE.MeshPhysicalMaterial;
  floorEdge: THREE.MeshPhysicalMaterial;
  bioStone: THREE.MeshPhysicalMaterial;
  bioStoneDark: THREE.MeshPhysicalMaterial;
  vaultWall: THREE.MeshPhysicalMaterial;
  chitin: THREE.MeshPhysicalMaterial;
  tarnishedMetal: THREE.MeshPhysicalMaterial;
  blackMetal: THREE.MeshPhysicalMaterial;
  blood: THREE.MeshPhysicalMaterial;
  water: THREE.MeshPhysicalMaterial;
  hostileGlass: THREE.MeshPhysicalMaterial;
  vein: THREE.MeshStandardMaterial;
  soot: THREE.MeshBasicMaterial;
  cityTexture: THREE.Texture;
  textures: THREE.Texture[];
}

export async function createArenaMaterials(
  renderer: THREE.WebGLRenderer,
): Promise<ArenaMaterialLibrary> {
  const [stoneColorSource, stoneNormalSource, stoneRoughnessSource, bioSource, cityTexture] =
    await Promise.all([
      loadTexture('/assets/pbr/stone_tiles_03/diffuse.jpg', true),
      loadTexture('/assets/pbr/stone_tiles_03/normal-gl.jpg', false),
      loadTexture('/assets/pbr/stone_tiles_03/roughness.jpg', false),
      loadTexture('/assets/bio-gothic-surface.jpg', true),
      loadTexture('/assets/storm-city.jpg', true),
    ]);
  const maximumAnisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());

  const floorColor = prepareTexture(stoneColorSource, 9, 9, maximumAnisotropy);
  const floorNormal = prepareTexture(stoneNormalSource, 9, 9, maximumAnisotropy);
  const floorRoughness = prepareTexture(stoneRoughnessSource, 9, 9, maximumAnisotropy);

  const bioColor = prepareTexture(bioSource, 2.25, 3.8, maximumAnisotropy);
  const bioHeight = prepareTexture(
    createSurfaceDataTexture(bioSource, 'height'),
    2.25,
    3.8,
    maximumAnisotropy,
  );
  const bioRoughness = prepareTexture(
    createSurfaceDataTexture(bioSource, 'roughness'),
    2.25,
    3.8,
    maximumAnisotropy,
  );

  const floor = new THREE.MeshPhysicalMaterial({
    color: 0x38373d,
    map: floorColor,
    roughnessMap: floorRoughness,
    normalMap: floorNormal,
    normalScale: new THREE.Vector2(1.15, 1.15),
    metalness: 0.08,
    roughness: 0.62,
    clearcoat: 0.36,
    clearcoatRoughness: 0.26,
    specularIntensity: 0.54,
    envMapIntensity: 0.56,
  });
  const floorEdge = new THREE.MeshPhysicalMaterial({
    color: 0x25242a,
    map: floorColor,
    normalMap: floorNormal,
    normalScale: new THREE.Vector2(0.82, 0.82),
    roughnessMap: floorRoughness,
    roughness: 0.7,
    metalness: 0.28,
    clearcoat: 0.18,
    envMapIntensity: 0.48,
  });
  const bioStone = new THREE.MeshPhysicalMaterial({
    color: 0x6b5e62,
    map: bioColor,
    bumpMap: bioHeight,
    bumpScale: 0.24,
    roughnessMap: bioRoughness,
    roughness: 0.68,
    metalness: 0.16,
    clearcoat: 0.2,
    clearcoatRoughness: 0.44,
    specularIntensity: 0.52,
    envMapIntensity: 0.66,
  });
  const bioStoneDark = bioStone.clone();
  bioStoneDark.color.setHex(0x3e383f);
  bioStoneDark.roughness = 0.76;
  bioStoneDark.clearcoat = 0.12;
  bioStoneDark.envMapIntensity = 0.4;
  const vaultWall = bioStoneDark.clone();
  vaultWall.color.setHex(0x292a31);
  vaultWall.roughness = 0.84;
  vaultWall.side = THREE.BackSide;
  const chitin = new THREE.MeshPhysicalMaterial({
    color: 0x3a1d25,
    map: bioColor,
    bumpMap: bioHeight,
    bumpScale: 0.19,
    roughnessMap: bioRoughness,
    roughness: 0.34,
    metalness: 0.2,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
    sheen: 0.55,
    sheenColor: new THREE.Color(0x57202a),
    envMapIntensity: 1.02,
  });
  const tarnishedMetal = new THREE.MeshPhysicalMaterial({
    color: 0x84644f,
    map: bioColor,
    bumpMap: bioHeight,
    bumpScale: 0.07,
    roughnessMap: bioRoughness,
    roughness: 0.29,
    metalness: 0.9,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.18,
  });
  const blackMetal = new THREE.MeshPhysicalMaterial({
    color: 0x29313b,
    map: floorColor,
    normalMap: floorNormal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughnessMap: floorRoughness,
    roughness: 0.26,
    metalness: 0.94,
    clearcoat: 0.35,
    clearcoatRoughness: 0.24,
    envMapIntensity: 1.24,
  });
  const blood = new THREE.MeshPhysicalMaterial({
    color: 0x360309,
    emissive: 0x180003,
    emissiveIntensity: 0.18,
    roughness: 0.13,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    specularIntensity: 0.9,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    envMapIntensity: 1.3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const water = new THREE.MeshPhysicalMaterial({
    color: 0x101823,
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    specularIntensity: 1,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    envMapIntensity: 1.45,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const hostileGlass = new THREE.MeshPhysicalMaterial({
    color: 0x16080d,
    emissive: 0x5b090b,
    emissiveIntensity: 0.34,
    roughness: 0.14,
    metalness: 0.45,
    transmission: 0.2,
    clearcoat: 0.96,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.58,
    envMapIntensity: 1.35,
  });
  const vein = new THREE.MeshStandardMaterial({
    color: 0x3c0909,
    emissive: 0xc41b0d,
    emissiveIntensity: 2.6,
    roughness: 0.24,
    metalness: 0.5,
    toneMapped: true,
  });
  const soot = new THREE.MeshBasicMaterial({
    color: 0x030405,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });

  cityTexture.anisotropy = maximumAnisotropy;
  cityTexture.colorSpace = THREE.SRGBColorSpace;

  return {
    floor,
    floorEdge,
    bioStone,
    bioStoneDark,
    vaultWall,
    chitin,
    tarnishedMetal,
    blackMetal,
    blood,
    water,
    hostileGlass,
    vein,
    soot,
    cityTexture,
    textures: [
      floorColor,
      floorNormal,
      floorRoughness,
      bioColor,
      bioHeight,
      bioRoughness,
      cityTexture,
    ],
  };
}

function prepareTexture(
  texture: THREE.Texture,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
): THREE.Texture {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createSurfaceDataTexture(
  source: THREE.Texture,
  kind: 'height' | 'roughness',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !source.image) return createFallbackTexture(false);

  context.drawImage(source.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
    const chroma =
      Math.max(data[index], data[index + 1], data[index + 2]) -
      Math.min(data[index], data[index + 1], data[index + 2]);
    const value =
      kind === 'height'
        ? THREE.MathUtils.clamp(24 + luminance * 1.22 + chroma * 0.18, 0, 255)
        : THREE.MathUtils.clamp(226 - luminance * 0.6 - chroma * 0.55, 45, 238);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

async function loadTexture(url: string, color: boolean): Promise<THREE.Texture> {
  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return texture;
  } catch {
    return createFallbackTexture(color);
  }
}

function createFallbackTexture(color: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = color ? '#17191d' : '#777';
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 420; index += 1) {
      const shade = 24 + (index % 11) * 4;
      context.fillStyle = color
        ? `rgb(${shade + 7}, ${shade + 3}, ${shade + 5})`
        : `rgb(${shade}, ${shade}, ${shade})`;
      context.fillRect((index * 73) % 256, (index * 47) % 256, 2 + (index % 9), 1 + (index % 5));
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return texture;
}
