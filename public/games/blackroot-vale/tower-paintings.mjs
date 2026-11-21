import * as T from './vendor/three.module.js';

export const THRONE_PAINTINGS = ['court', 'dungeon', 'battlefield', 'storm'];

const frame = new T.MeshStandardMaterial({ color: '#38221d', roughness: .83 });
const gilt = new T.MeshStandardMaterial({ color: '#9a6c48', roughness: .58, metalness: .31 });
const backing = new T.BoxGeometry();

export async function loadTowerPaintings(loader, anisotropy) {
  const textures = await Promise.all(THRONE_PAINTINGS.map(async (name) => {
    const url = new URL('./art/paintings/' + name + '.webp', import.meta.url);
    try {
      const texture = await loader.loadAsync(url.href);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      return [name, texture];
    } catch (error) {
      console.warn('Blackroot Vale could not load the ' + name + ' painting.', error);
      return [name, null];
    }
  }));
  return Object.fromEntries(textures);
}

export function hangPainting(scene, textures, name, x, y, z, yaw = 0, height = 1.52) {
  const texture = textures?.[name];
  if (!texture) return;
  const width = height * 2 / 3;
  const group = new T.Group();
  group.name = 'Tower painting — ' + name;
  group.position.set(x, y, z);
  group.rotation.y = yaw;
  scene.add(group);
  function molding(material, x, y, z, w, h, d) {
    const piece = new T.Mesh(backing, material);
    piece.position.set(x, y, z);
    piece.scale.set(w, h, d);
    group.add(piece);
  }
  molding(frame, 0, 0, 0, width + .18, height + .19, .10);
  molding(gilt, 0, 0, .056, width + .079, height + .079, .021);
  const panel = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshStandardMaterial({
    color: '#c5b3aa', map: texture, roughness: .98,
    emissive: '#d2bdb5', emissiveMap: texture, emissiveIntensity: .56,
  }));
  panel.position.z = .072;
  group.add(panel);
  for (const sign of [-1, 1]) {
    molding(frame, sign * (width / 2 + .073), 0, .070, .047, height + .17, .044);
    molding(frame, 0, sign * (height / 2 + .073), .071, width + .18, .046, .044);
  }
}
