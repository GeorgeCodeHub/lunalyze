import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { BufferAttribute, BufferGeometry, type Material, RepeatWrapping, type Texture } from 'three';
import { projectPolar } from '../../../backend/lib/projectPolar';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';
import regolithUrl from './regolith.jpg?url';
import { buildTerrainMesh, EXAGGERATION, GROUND_TILE_KM, MESH_STEP } from './sceneMath';

type TerrainMeshProps = { grid: TerrainGrid; lat: number; lon: number; colour: string };

// The photo was made seamless when it was cut, so it simply repeats; anisotropic, so the ground stays sharp at a low angle.
const tile = (texture: Texture) => {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
};

// Triplanar: the photo is laid on from above, east and north and blended by slope, so steep hills are not streaked.
const triplanar: Material['onBeforeCompile'] = (shader) => {
  shader.uniforms.tileKm = { value: GROUND_TILE_KM };
  const varyings = 'varying vec3 vGroundPos;\nvarying vec3 vGroundNormal;\n';
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${varyings}`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPos = position;\nvGroundNormal = normal;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nuniform float tileKm;\n${varyings}`).replace(
    '#include <map_fragment>',
    `vec3 w = pow(abs(normalize(vGroundNormal)), vec3(4.0));
    w /= w.x + w.y + w.z;
    vec3 p = vGroundPos / tileKm;
    vec3 q = p * 16.0; // the same photo 16 times finer, so the ground at the viewer's feet is not a blur
    vec4 coarse = texture2D(map, p.zy) * w.x + texture2D(map, p.xz) * w.y + texture2D(map, p.xy) * w.z;
    vec4 fine = texture2D(map, q.zy) * w.x + texture2D(map, q.xz) * w.y + texture2D(map, q.xy) * w.z;
    diffuseColor *= coarse * mix(vec4(1.0), fine * 1.6, 0.5);`,
  );
};

// The ground around the site, built once per grid and freed when it goes. The surface detail is a photo of Moon highlands (Solar System Scope).
const TerrainMesh = ({ grid, lat, lon, colour }: TerrainMeshProps) => {
  const invalidate = useThree((state) => state.invalidate);
  const [geometry] = useState(() => new BufferGeometry());
  const map = useTexture(regolithUrl, tile);

  useEffect(() => {
    const { positions, index } = buildTerrainMesh(grid, projectPolar(lat, lon), MESH_STEP, EXAGGERATION);
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    invalidate(); // the canvas draws on demand, and this change is not a React prop
    return () => geometry.dispose();
  }, [grid, lat, lon, geometry, invalidate]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={colour} map={map} roughness={1} onBeforeCompile={triplanar} />
    </mesh>
  );
};

export default TerrainMesh;
