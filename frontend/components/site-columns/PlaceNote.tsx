import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
};

const BODY_KEYS = {
  loading: 'site.loading',
  typed: 'site.typedBody',
  unknown: 'site.unknownBody',
  missing: 'site.missingBody',
} as const;

// A place with nothing to draw yet: still loading, typed coordinates, an id that is not on the list,
// or a site with no data. It keeps its card so the reader sees why it is empty.
const PlaceNote = ({ column, role, children }: PlaceNoteProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const title =
    column.kind === 'typed'
      ? t('site.typedTitle')
      : column.kind === 'unknown'
        ? column.siteId // not on the list, so it has no name: show the id from the link
        : tSites(siteNameKey(column.siteId));
  const meta = column.kind === 'typed' ? position(column.lat, column.lon) : undefined;
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
      data-site-id={column.kind === 'typed' ? undefined : column.siteId}
    >
      <PlaceHeader titleId={titleId} title={title} meta={meta} role={role} />
      <p className={styles.body} role={loading ? 'status' : undefined}>
        {t(BODY_KEYS[column.kind])}
      </p>
      {children}
    </article>
  );
};

export default PlaceNote;
