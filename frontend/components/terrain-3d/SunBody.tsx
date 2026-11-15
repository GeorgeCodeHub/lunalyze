import { Billboard, useTexture } from '@react-three/drei';
import { useState } from 'react';
import { AdditiveBlending, Color } from 'three';
import sunUrl from './sun.jpg?url';

type SunBodyProps = { radius: number; colour: string; hidden: boolean };

// A soft glare, brightest at the centre, so a Sun only a few pixels wide is still easy to find.
const GLARE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLARE_FRAGMENT = /* glsl */ `
uniform vec3 colour;
varying vec2 vUv;
void main() {
  float r = clamp(1.0 - length(vUv * 2.0 - 1.0), 0.0, 1.0);
  gl_FragColor = vec4(colour * (pow(r, 6.0) + 0.35 * pow(r, 2.0)), 1.0);
  #include <colorspace_fragment>
}`;

// The Sun's surface (Solar System Scope) in its glare. Hidden behind the hills: a wireframe ghost with no glare.
// Drawn over the terrain whatever the mesh says, since whether it is hidden comes from the horizon mask.
const SunBody = ({ radius, colour, hidden }: SunBodyProps) => {
  const map = useTexture(sunUrl);
  const [uniforms] = useState(() => ({ colour: { value: new Color(colour) } })); // the theme colour is fixed for the scene's life

  return (
    <>
      <mesh renderOrder={2}>
        <sphereGeometry args={hidden ? [radius, 12, 8] : [radius, 32, 16]} />
        {hidden ? (
          <meshBasicMaterial color={colour} wireframe transparent opacity={0.6} depthTest={false} depthWrite={false} />
        ) : (
          <meshBasicMaterial map={map} toneMapped={false} depthTest={false} depthWrite={false} />
        )}
      </mesh>
      {!hidden && (
        <Billboard renderOrder={1}>
          <mesh scale={radius * 16}>
            <planeGeometry />
            <shaderMaterial
              vertexShader={GLARE_VERTEX}
              fragmentShader={GLARE_FRAGMENT}
              uniforms={uniforms}
              blending={AdditiveBlending}
              transparent
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}
    </>
  );
};

export default SunBody;
