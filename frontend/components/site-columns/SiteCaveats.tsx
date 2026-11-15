import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import { caveatKinds } from './caveats';
import styles from './SiteCaveats.module.css';

type SiteCaveatsProps = { view: SiteView; terrain: boolean };

// The caveats in two or three words each, on the face of the card: a drawn mark and a name.
// "Approximate location" is not here: it sits beside the coordinates, in the card's header.
// The full sentence for each is in the card's details.
const SiteCaveats = ({ view, terrain }: SiteCaveatsProps) => {
  const { t } = useTranslation('compare');

  const kinds = caveatKinds(view, terrain).filter((kind) => kind !== 'approximate');

  if (kinds.length === 0) return null;

  return (
    <ul className={styles.caveats}>
      {kinds.map((kind) => (
        <li key={kind} className={styles.caveat} data-testid={testIds.siteColumns.caveat} data-kind={kind}>
          <IconAlert />
          {t(`caveatShort.${kind}`)}
        </li>
      ))}
    </ul>
  );
};

export default SiteCaveats;
