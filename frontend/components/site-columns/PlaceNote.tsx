import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { usePosition } from '../shared/usePosition';
import { siteNameKey } from '../site-picker/siteIds';
import ColumnHeader from './ColumnHeader';
import type { ColumnModel } from './columnModel';
import styles from './PlaceNote.module.css';

type PlaceNoteProps = { column: Exclude<ColumnModel, { kind: 'ready' }>; onRemove?: () => void };

const BODY_KEYS = {
  loading: 'site.loading',
  typed: 'site.typedBody',
  unknown: 'site.unknownBody',
  missing: 'site.missingBody',
} as const;

// A picked place with nothing to draw yet: still loading, typed coordinates, an id that is not on
// the list, or a site with no data. It keeps its column so the user sees why it is empty.
const PlaceNote = ({ column, onRemove }: PlaceNoteProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const title =
    column.kind === 'typed'
      ? t('site.typedTitle')
      : column.kind === 'unknown'
        ? column.siteId // not on the list, so it has no name: show the id from the link
        : tSites(siteNameKey(column.siteId));
  const meta = column.kind === 'typed' ? [position(column.lat, column.lon)] : [];
  const titleId = `site-column-${column.key}`;
  const loading = column.kind === 'loading';

  return (
    <article
      className={styles.note}
      aria-labelledby={titleId}
      aria-busy={loading}
      data-testid={testIds.siteColumns.column}
      data-status={column.kind}
      data-site-id={column.kind === 'typed' ? undefined : column.siteId}
    >
      <ColumnHeader titleId={titleId} title={title} meta={meta} removeLabel={t('site.remove', { site: title })} onRemove={onRemove} />
      <p className={styles.body} role={loading ? 'status' : undefined}>
        {t(BODY_KEYS[column.kind])}
      </p>
    </article>
  );
};

export default PlaceNote;
