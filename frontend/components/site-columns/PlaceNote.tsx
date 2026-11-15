import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { placeId } from '../../scenario';
import { testIds } from '../../test-ids';
import { usePosition } from '../shared/usePosition';
import { siteNameKey } from '../site-picker/siteIds';
import type { ColumnModel } from './columnModel';
import type { Role } from './pickPlaces';
import PlaceHeader from './PlaceHeader';
import styles from './PlaceNote.module.css';

type PlaceNoteProps = {
  column: Exclude<ColumnModel, { kind: 'ready' }>;
  role: Role;
  children?: ReactNode; // a last line for the card, when it has one
  onRemove?: () => void; // takes a picked place out of the comparison
};

const BODY_KEYS = {
  loading: 'site.loading',
  unknown: 'site.unknownBody',
  missing: 'site.missingBody',
} as const;

// A place with nothing to draw yet: still loading, an id that is not on the list, or a place with no
// data. It keeps its card so the reader sees why it is empty.
const PlaceNote = ({ column, role, children, onRemove }: PlaceNoteProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const place = column.kind === 'unknown' ? null : column.place;
  const title =
    place === null
      ? column.key // not on the list, so it has no name: show the id from the link
      : place.kind === 'coords'
        ? t('site.typedTitle')
        : tSites(siteNameKey(place.id));
  const meta = place?.kind === 'coords' ? position(place.lat, place.lon) : undefined;
  const titleId = `place-card-${column.key}`;
  const loading = column.kind === 'loading';

  return (
    <article
      className={styles.note}
      aria-labelledby={titleId}
      aria-busy={loading}
      data-testid={testIds.siteColumns.column}
      data-status={column.kind}
      data-role={role}
      data-site-id={column.kind === 'unknown' ? column.siteId : placeId(column.place)}
    >
      <PlaceHeader titleId={titleId} title={title} meta={meta} role={role} onRemove={onRemove} />
      <p className={styles.body} role={loading ? 'status' : undefined}>
        {t(BODY_KEYS[column.kind])}
      </p>
      {children}
    </article>
  );
};

export default PlaceNote;
