import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import Caveat from '../shared/Caveat';
import styles from './SiteCaveats.module.css';

type SiteCaveatsProps = { view: SiteView; terrain: boolean };

// Where this place's numbers stop being exact: hills switched off or not mapped, an approximate
// location, or a height map that ends before the hills do.
const SiteCaveats = ({ view, terrain }: SiteCaveatsProps) => {
  const { t } = useTranslation('compare');

  const { site, horizonIncomplete } = view;
  const kinds = [
    ...(terrain ? [] : (['terrainOff'] as const)),
    ...(terrain && !site.terrainModeled ? (['terrainNotModeled'] as const) : []),
    ...(site.precision === 'proxy' ? (['approximate'] as const) : []),
    ...(horizonIncomplete ? (['horizonIncomplete'] as const) : []),
  ];

  if (kinds.length === 0) return null;

  return (
    <div className={styles.caveats}>
      {kinds.map((kind) => (
        <Caveat key={kind} kind={kind} testId={testIds.siteColumns.caveat}>
          {t(`caveat.${kind}`)}
        </Caveat>
      ))}
    </div>
  );
};

export default SiteCaveats;
