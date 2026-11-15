import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import type { Role } from './pickPlaces';
import styles from './PlaceHeader.module.css';

type PlaceHeaderProps = {
  titleId: string;
  title: string;
  meta?: string; // one short fact under the name, when the card has no details to put it in
  role: Role;
  alsoYours?: boolean; // the best option is also the place chosen in setup
};

// A place's name with what it is on this screen: the best option, or what it is compared with.
// The best option's badge is solid and the others are outlined, so the roles differ by more than words.
const PlaceHeader = ({ titleId, title, meta, role, alsoYours = false }: PlaceHeaderProps) => {
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
        </p>
      </div>
      {meta && <p className={styles.meta}>{meta}</p>}
    </header>
  );
};

export default PlaceHeader;
