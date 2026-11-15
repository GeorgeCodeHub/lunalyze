import { useTranslation } from 'react-i18next';
import { onPolarMap, POLAR_MAP, projectPolar } from '../../../backend/lib/projectPolar';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { useSiteName } from '../shared/useSiteName';
import MapPin from './MapPin';
import { MAP_HALF, toMapUnits } from './mapUnits';
import styles from './PolarMap.module.css';

type PolarMapProps = { views: SiteView[] };

const H = MAP_HALF;

const PolarMap = ({ views }: PolarMapProps) => {
  const { t } = useTranslation('compare');
  const name = useSiteName();

  const placed = views.map((view) => {
    const metres = projectPolar(view.site.lat, view.site.lon);
    return { view, onMap: onPolarMap(metres.x, metres.y), ...toMapUnits(metres) };
  });
  const pins = placed.filter(({ onMap }) => onMap);
  const offMap = placed.filter(({ onMap }) => !onMap);
  const anyProxy = pins.some(({ view }) => view.site.precision === 'proxy');
  const leftmost = Math.min(...pins.map(({ x }) => x));

  const nameOf = (view: SiteView) => name(view.site);
  const status = (hidden: boolean) => t(hidden ? 'map.hidden' : 'map.visible');

  return (
    <figure className={styles.figure} data-testid={testIds.polarMap.root}>
      <svg
        className={styles.svg}
        data-testid={testIds.polarMap.svg}
        viewBox={`${-H} ${-H} ${2 * H} ${2 * H}`}
        role="img"
        aria-label={views.length === 0 ? t('map.labelEmpty') : t('map.label')}
      >
        <image
          data-testid={testIds.polarMap.image}
          href={import.meta.env.BASE_URL + POLAR_MAP.path}
          x={-H}
          y={-H}
          width={2 * H}
          height={2 * H}
        >
          <title>{t('map.image')}</title>
        </image>
        {pins.map(({ view, x, y }) => (
          <MapPin key={view.site.id} view={view} x={x} y={y} labelEnd={pins.length > 1 ? x === leftmost : undefined} />
        ))}
      </svg>
      <figcaption className={styles.caption}>
        {offMap.map(({ view }) => (
          <p key={view.site.id} data-testid={testIds.polarMap.offMap} data-site-id={view.site.id}>
            {t('map.offMap', { site: nameOf(view) })}
          </p>
        ))}
        {pins.length > 0 && (
          <ul className={styles.legend} data-testid={testIds.polarMap.legend}>
            <li>
              <span className={styles.sun} aria-hidden="true">
                ●
              </span>{' '}
              {t('map.sun')}
            </li>
            <li>
              <span className={styles.earth} aria-hidden="true">
                ◆
              </span>{' '}
              {t('map.earth')}
            </li>
            <li>{t('map.legendSolid')}</li>
            <li>{t('map.legendDashed')}</li>
            {anyProxy && <li>{t('map.legendApproximate')}</li>}
          </ul>
        )}
        <ul className={styles.visuallyHidden}>
          {pins.map(({ view }) => (
            <li key={view.site.id}>
              {t('map.summary', {
                site: nameOf(view),
                sun: status(view.sky.sun.hidden),
                earth: status(view.sky.earth.hidden),
              })}
              {view.site.precision === 'proxy' && ` ${t('map.approximateNote')}`}
              {view.horizonIncomplete && ` ${t('map.lowerBound')}`}
            </li>
          ))}
        </ul>
        <p data-testid={testIds.polarMap.credit}>{t('map.credit')}</p>
      </figcaption>
    </figure>
  );
};

export default PolarMap;
