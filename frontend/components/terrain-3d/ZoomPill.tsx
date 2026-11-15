import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import type { ZoomDirection } from './lookTurn';
import styles from './Terrain3D.module.css';

type ZoomPillProps = { onZoom: (direction: ZoomDirection) => void };

const LABELS = { out: 'terrain3d.zoomOut', in: 'terrain3d.zoomIn' } as const;

// − and + side by side, like a map's zoom: the same as scrolling on the picture.
const ZoomPill = ({ onZoom }: ZoomPillProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.zoom} role="group" aria-label={t('terrain3d.zoom')}>
      {(['out', 'in'] as const).map((direction) => (
        <button
          key={direction}
          type="button"
          className={styles.zoomButton}
          data-direction={direction}
          aria-label={t(LABELS[direction])}
          title={t(LABELS[direction])}
          onClick={() => onZoom(direction)}
          data-testid={testIds.terrain3d.zoom}
        />
      ))}
    </div>
  );
};

export default ZoomPill;
