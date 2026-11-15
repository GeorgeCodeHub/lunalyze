import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import styles from './TerrainSwitch.module.css';

type TerrainSwitchProps = { terrain: boolean; onChange: (terrain: boolean) => void };

// The flat-or-terrain switch: a native checkbox with the switch role. The words beside it say the
// state, so it never depends on the thumb's position or colour alone.
const TerrainSwitch = ({ terrain, onChange }: TerrainSwitchProps) => {
  const { t } = useTranslation('compare');

  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={terrain}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testIds.scenarioBar.terrainSwitch}
      />
      <span className={styles.text}>
        <span className={styles.label}>{t('terrain.label')}</span>
        <span className={styles.state}>{terrain ? t('terrain.on') : t('terrain.off')}</span>
      </span>
    </label>
  );
};

export default TerrainSwitch;
