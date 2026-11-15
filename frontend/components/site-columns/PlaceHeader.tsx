import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import IconClose from '../shared/IconClose';
import type { Role } from './pickPlaces';
import styles from './PlaceHeader.module.css';

type PlaceHeaderProps = {
  titleId: string;
  title: string;
  meta?: string; // one short fact under the name: the place's coordinates
  role: Role;
  alsoYours?: boolean; // the best option is also the place chosen in setup
  risky?: boolean; // the place does not fit the stay
  onRemove?: () => void; // takes a picked place out of the comparison; absent when it cannot be removed
  approximate?: boolean; // the point stands for a larger region: said beside the coordinates
  compact?: boolean; // a smaller name, for the Compare view
};

// A place's name with what it is on this screen: the best option, or what it is compared with, and a
// Risky tag beside it when the place does not fit the stay. The best option's badge is solid and the
// others are outlined; the Risky tag is dashed, with a warning mark. So they differ by more than words.
const PlaceHeader = ({ titleId, title, meta, role, alsoYours = false, risky = false, onRemove, approximate = false, compact = false }: PlaceHeaderProps) => {
  const { t } = useTranslation('compare');

  return (
    <header className={styles.header} data-removable={onRemove !== undefined} data-compact={compact}>
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          aria-label={t('site.remove', { site: title })}
          title={t('site.remove', { site: title })}
          onClick={onRemove}
          data-testid={testIds.siteColumns.remove}
        >
          <IconClose />
        </button>
      )}
      <div className={styles.row}>
        <h2 id={titleId} className={styles.name}>
          {title}
        </h2>
        <p className={styles.badges}>
          <span className={styles.badge} data-role={role} data-testid={testIds.siteColumns.role}>
            {t(`role.${role}`)}
          </span>
          {alsoYours && (
            <span className={styles.badge} data-role="yourChoice">
              {t('role.yourChoice')}
            </span>
          )}
          {risky && (
            <span className={styles.risky} data-testid={testIds.siteColumns.risky}>
              <IconAlert />
              {t('fit.risky')}
            </span>
          )}
        </p>
      </div>
      {(meta || approximate) && (
        <p className={styles.meta}>
          {meta && <span>{meta}</span>}
          {approximate && (
            <span className={styles.approximate} data-testid={testIds.siteColumns.caveat} data-kind="approximate">
              <IconAlert />
              {t('caveatShort.approximate')}
            </span>
          )}
        </p>
      )}
    </header>
  );
};

export default PlaceHeader;
