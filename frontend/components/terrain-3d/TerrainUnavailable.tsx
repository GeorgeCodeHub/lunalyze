import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import styles from './Terrain3D.module.css';

// Shown in place of the 3D view when it cannot load or start.
const TerrainUnavailable = () => {
  const { t } = useTranslation('compare');

  return (
    <p className={styles.note} role="alert" data-testid={testIds.terrain3d.unavailable}>
      <IconAlert />
      <span>{t('terrain3d.unavailable')}</span>
    </p>
  );
};

export default TerrainUnavailable;
