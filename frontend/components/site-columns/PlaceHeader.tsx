import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import type { Role } from './pickPlaces';
import styles from './PlaceHeader.module.css';

type PlaceHeaderProps = {
  titleId: string;
  title: string;
  meta?: string; // one short fact under the name: the place's coordinates
  role: Role;
  alsoYours?: boolean; // the best option is also the place chosen in setup
  risky?: boolean; // the place does not fit the stay
};

// A place's name with what it is on this screen: the best option, or what it is compared with, and a
// Risky tag beside it when the place does not fit the stay. The best option's badge is solid and the
// others are outlined; the Risky tag is dashed, with a warning mark. So they differ by more than words.
const PlaceHeader = ({ titleId, title, meta, role, alsoYours = false, risky = false }: PlaceHeaderProps) => {
  const { t } = useTranslation('compare');

  return (
    <header className={styles.header}>
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
      {meta && <p className={styles.meta}>{meta}</p>}
    </header>
  );
};

export default PlaceHeader;
