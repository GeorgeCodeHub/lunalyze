import { useTexture } from '@react-three/drei';
import { useState } from 'react';
import { Color, SRGBColorSpace, type Texture } from 'three';
import earthDayUrl from './earthDay.jpg?url';
import earthNightUrl from './earthNight.jpg?url';

type EarthBodyProps = { radius: number; sunDirection: [number, number, number]; colour: string; hidden: boolean };

// Day and night maps from Solar System Scope (NASA Blue Marble, with clouds). The lit half faces the Sun, so the phase is real.
const VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const FRAGMENT = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform vec3 sunDirection;
uniform vec3 glow;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  float day = smoothstep(-0.08, 0.12, dot(n, sunDirection));
  float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 3.0); // the thin atmosphere at the edge
  vec3 colour = texture2D(dayMap, vUv).rgb * day + texture2D(nightMap, vUv).rgb * (1.0 - day) * 0.8 + glow * rim * (0.1 + 0.9 * day);
  gl_FragColor = vec4(colour, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Shader uniforms, which R3F does not mark as colour the way it does a material's map.
const asColour = (textures: Texture[]) => {
  for (const texture of textures) texture.colorSpace = SRGBColorSpace;
};

// Earth as a small globe lit by the Sun, its night side showing city lights. Hidden behind the hills: a wireframe ghost.
const EarthBody = ({ radius, sunDirection, colour, hidden }: EarthBodyProps) => {
  const [dayMap, nightMap] = useTexture([earthDayUrl, earthNightUrl], asColour);
  const [glow] = useState(() => new Color(colour)); // the theme colour is fixed for the scene's life

  const uniforms = {
    dayMap: { value: dayMap },
    nightMap: { value: nightMap },
    sunDirection: { value: sunDirection }, // a vec3 uniform takes a plain [x, y, z]
    glow: { value: glow },
  };

  return (
    <mesh renderOrder={2}>
      {/* A hidden Earth is a sparse wireframe: dense lines at this size would fill in to a solid disc. */}
      <sphereGeometry args={hidden ? [radius, 12, 8] : [radius, 48, 24]} />
      {hidden ? (
        <meshBasicMaterial color={colour} wireframe transparent opacity={0.6} depthTest={false} depthWrite={false} />
      ) : (
        <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} depthTest={false} depthWrite={false} />
      )}
    </mesh>
  );
};

export default EarthBody;
