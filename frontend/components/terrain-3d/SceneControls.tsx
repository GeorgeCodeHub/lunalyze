import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import Compass from './Compass';
import type { LookAction } from './lookTurn';
import ZoomPill from './ZoomPill';
import styles from './Terrain3D.module.css';

type SceneControlsProps = {
  heading: number;
  onFace: (body: 'sun' | 'earth') => void;
  onNorth: () => void;
  onLook: (action: LookAction) => void;
  onTurn: (degrees: number) => void; // a free turn from dragging the compass: left positive
};

// The controls drawn over a ready 3D picture, in opposite corners so they never meet: small Face the Sun /
// Face Earth pills in the top-left (in the sky), and a map's zoom and compass in the bottom-right.
const SceneControls = ({ heading, onFace, onNorth, onLook, onTurn }: SceneControlsProps) => {
  const { t } = useTranslation('compare');

  return (
    <>
      <div className={styles.faceButtons}>
        {(['sun', 'earth'] as const).map((body) => (
          <button key={body} type="button" className={styles.faceButton} data-testid={testIds.terrain3d.face} data-body={body} onClick={() => onFace(body)}>
            <BodyGlyph body={body} />
            {t(body === 'sun' ? 'terrain3d.faceSun' : 'terrain3d.faceEarth')}
          </button>
        ))}
      </div>
      <div className={styles.lookControls}>
        <ZoomPill onZoom={onLook} />
        <Compass heading={heading} onNorth={onNorth} onLook={onLook} onTurn={onTurn} />
      </div>
    </>
  );
};

export default SceneControls;
