import { useTranslation } from 'react-i18next';
import { onPolarMap, POLAR_MAP, projectPolar } from '../../../backend/lib/projectPolar';
import type { SiteView } from '../../../backend/lib/types';
import type { SiteId } from '../../i18n';
import { testIds } from '../../test-ids';
import MapPin from './MapPin';
import { useBoxSize } from '../shared/useBoxSize';
import { MAP_BOX_FALLBACK, MAP_HALF, mapView, toMapUnits } from './mapUnits';
import styles from './PolarMap.module.css';

// legend: the map's own key under it. Off in the live view, which shows one legend for every picture.
// credit: the ground image's credit under the map. Off in the live view, whose footer credits the height maps.
type PolarMapProps = { views: SiteView[]; legend?: boolean; credit?: boolean };

const H = MAP_HALF;


const PolarMap = ({ views, legend = true, credit = true }: PolarMapProps) => {
  const { t } = useTranslation('compare');
  const [boxRef, box] = useBoxSize<SVGSVGElement>(MAP_BOX_FALLBACK);

  const placed = views.map((view) => {
    const metres = projectPolar(view.site.lat, view.site.lon);
    return { view, onMap: onPolarMap(metres.x, metres.y), ...toMapUnits(metres) };
  });
  const pins = placed.filter(({ onMap }) => onMap);
  const offMap = placed.filter(({ onMap }) => !onMap);
  const anyProxy = pins.some(({ view }) => view.site.precision === 'proxy');
  const leftmost = Math.min(...pins.map(({ x }) => x));
  // The map fills its box, centred on the places; marks keep their size on screen (k: map units per pixel).
  const shown = mapView(pins.map(({ y }) => -y), box.w, box.h); // SVG y runs down

  const nameOf = (view: SiteView) => t(`${view.site.id as SiteId}.name`, { ns: 'sites' });
  const status = (hidden: boolean) => t(hidden ? 'map.hidden' : 'map.visible');

  return (
    <figure className={styles.figure} data-testid={testIds.polarMap.root}>
      <svg
        className={styles.svg}
        data-testid={testIds.polarMap.svg}
        ref={boxRef}
        viewBox={`${shown.x} ${shown.y} ${shown.width} ${shown.height}`}
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
          <MapPin key={view.site.id} view={view} x={x} y={y} k={shown.k} labelEnd={pins.length > 1 ? x === leftmost : undefined} />
        ))}
      </svg>
      <figcaption className={styles.caption}>
        {offMap.map(({ view }) => (
          <p key={view.site.id} data-testid={testIds.polarMap.offMap} data-site-id={view.site.id}>
            {t('map.offMap', { site: nameOf(view) })}
          </p>
        ))}
        {legend && pins.length > 0 && (
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
        {credit && <p data-testid={testIds.polarMap.credit}>{t('map.credit')}</p>}
      </figcaption>
    </figure>
  );
};

export default PolarMap;
