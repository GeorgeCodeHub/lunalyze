import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { projectPolar } from '../../../backend/lib/projectPolar';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';
import { buildTerrainMesh, EXAGGERATION, MESH_STEP } from './sceneMath';

type TerrainMeshProps = { grid: TerrainGrid; lat: number; lon: number; colour: string };

// The ground around the site, built once per grid and freed when it goes.
const TerrainMesh = ({ grid, lat, lon, colour }: TerrainMeshProps) => {
  const invalidate = useThree((state) => state.invalidate);
  const [geometry] = useState(() => new BufferGeometry());

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
      <meshStandardMaterial color={colour} roughness={1} />
    </mesh>
  );
};

export default TerrainMesh;
