import { useTranslation } from 'react-i18next';
import { testIds } from '../test-ids';
import BodyGlyph from './shared/BodyGlyph';
import styles from './LiveLegend.module.css';

type LiveLegendProps = { approximate: boolean }; // a pin on the map is hollow: say what that means

// The one legend for every picture in the live view: the Sun's and Earth's marks, and what a solid or a
// dashed mark means. The map, the sky and the timelines all draw them the same way.
const LiveLegend = ({ approximate }: LiveLegendProps) => {
  const { t } = useTranslation('compare');

  return (
    <ul className={styles.legend} aria-label={t('live.legend')} data-testid={testIds.compare.legend}>
      <li>
        <BodyGlyph body="sun" />
        {t('map.sun')}
      </li>
      <li>
        <BodyGlyph body="earth" />
        {t('map.earth')}
      </li>
      <li>
        <span className={styles.solid} aria-hidden="true" />
        {t('live.legendInView')}
      </li>
      <li>
        <span className={styles.dashed} aria-hidden="true" />
        {t('live.legendHidden')}
      </li>
      {approximate && <li>{t('map.legendApproximate')}</li>}
    </ul>
  );
};

export default LiveLegend;
