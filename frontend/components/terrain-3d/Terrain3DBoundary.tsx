import { Component, type ReactNode } from 'react';
import TerrainUnavailable from './TerrainUnavailable';

type Terrain3DBoundaryProps = { children: ReactNode };
type Terrain3DBoundaryState = { failed: boolean };

// A failed chunk load or a canvas that cannot start (no WebGL) must not take the whole screen down.
// Kept free of three, r3f and drei so LiveView can import it without loading them.
// Error boundaries can only be classes.
class Terrain3DBoundary extends Component<Terrain3DBoundaryProps, Terrain3DBoundaryState> {
  state: Terrain3DBoundaryState = { failed: false };

  static getDerivedStateFromError(): Terrain3DBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <TerrainUnavailable /> : this.props.children;
  }
}

export default Terrain3DBoundary;
