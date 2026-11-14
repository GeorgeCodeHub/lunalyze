import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';

type TerrainSwitchProps = { terrain: boolean; onChange: (terrain: boolean) => void };

const TerrainSwitch = ({ terrain, onChange }: TerrainSwitchProps) => {
  const { t } = useTranslation('compare');

  return (
    <label>
      <input
        type="checkbox"
        role="switch"
        checked={terrain}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testIds.scenarioBar.terrainSwitch}
      />{' '}
      {t('terrain.label')} {terrain ? t('terrain.on') : t('terrain.off')}
    </label>
  );
};

export default TerrainSwitch;
