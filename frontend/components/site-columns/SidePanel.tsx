import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import Segmented from '../shared/Segmented';
import { siteShortKey } from '../site-picker/siteIds';
import type { ColumnModel } from './columnModel';
import { type SideView, shownKey } from './sideView';
import PlaceSlot from './PlaceSlot';
import styles from './SidePanel.module.css';

/** One place in the side panel: everything its card needs except how big it is drawn. */
export type SideEntry = Omit<Parameters<typeof PlaceSlot>[0], 'compact'>;

type SidePanelProps = {
  entries: SideEntry[]; // the best option first, then the places compared with it
  pending?: ReactNode; // shown in the best option's place while there is none
  view: SideView; // compare or single, and the place chosen; the Compare screen keeps it so the live view follows
  onView: (view: SideView) => void;
};

// Where a card's short name comes from: typed coordinates, a listed site, or an id that is not on the list.
const nameSource = (column: ColumnModel): { kind: 'typed' } | { kind: 'site' | 'unknown'; id: string } => {
  if (column.kind === 'unknown') return { kind: 'unknown', id: column.siteId };
  if (column.kind === 'ready') return column.view.site.kind === 'typed' ? { kind: 'typed' } : { kind: 'site', id: column.view.site.id };
  return column.place.kind === 'coords' ? { kind: 'typed' } : { kind: 'site', id: column.place.id };
};

// The places in one panel. Compare: every card small, to see them all at once; when the panel is
// dragged wider, the small cards stand in columns, side by side. Single: one full card, with its
// details, and a switch to the others; the live view then shows only that place.
const SidePanel = ({ entries, pending, view, onView }: SidePanelProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  const keyOf = (entry: SideEntry) => entry.column.key;
  const { mode } = view;
  const shownAt = shownKey(entries.map(keyOf), view.chosen);
  const shown = entries.find((entry) => keyOf(entry) === shownAt);
  const modes = [
    { value: 'compare' as const, label: t('side.compare') },
    { value: 'single' as const, label: t('side.single') },
  ];
  // The switch names each place briefly: typed coordinates are "Your coordinates", an unlisted id shows as it is.
  const places = entries.map(({ column }) => {
    const source = nameSource(column);
    const label = source.kind === 'typed' ? t('site.typedTitle') : source.kind === 'unknown' ? source.id : tSites(siteShortKey(source.id));
    return { value: column.key, label };
  });

  return (
    <>
      <div className={styles.head}>
        <Segmented label={t('side.mode')} options={modes} value={mode} onChange={(next) => onView({ ...view, mode: next })} testId={testIds.compare.sideMode} />
        {mode === 'single' && shown && places.length > 1 && (
          <Segmented label={t('side.place')} options={places} value={keyOf(shown)} onChange={(key) => onView({ ...view, chosen: key })} testId={testIds.compare.sidePlace} />
        )}
      </div>
      <div className={styles.cards} data-mode={mode}>
        {pending}
        {mode === 'compare'
          ? entries.map((entry) => <PlaceSlot key={keyOf(entry)} {...entry} compact />)
          : shown && <PlaceSlot key={keyOf(shown)} {...shown} />}
      </div>
    </>
  );
};

export default SidePanel;
