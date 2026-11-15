import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import Segmented from '../shared/Segmented';
import { siteShortKey } from '../site-picker/siteIds';
import PlaceSlot from './PlaceSlot';
import styles from './SidePanel.module.css';

/** One place in the side panel: everything its card needs except how big it is drawn. */
export type SideEntry = Omit<Parameters<typeof PlaceSlot>[0], 'compact'>;

type SidePanelProps = {
  entries: SideEntry[]; // the best option first, then the places compared with it
  pending?: ReactNode; // shown in the best option's place while there is none
};

type Mode = 'compare' | 'single';

// The places in one panel. Compare: every card small, to see them all at once; when the panel is
// dragged wider, the small cards stand in columns, side by side. Single: one full card, with its
// details, and a switch to the others.
const SidePanel = ({ entries, pending }: SidePanelProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const [mode, setMode] = useState<Mode>('compare');
  const [chosen, setChosen] = useState<string | null>(null);

  const keyOf = (entry: SideEntry) => entry.column.key;
  const shown = entries.find((entry) => keyOf(entry) === chosen) ?? entries[0];
  const modes = [
    { value: 'compare' as const, label: t('side.compare') },
    { value: 'single' as const, label: t('side.single') },
  ];
  // The switch names each place briefly: typed coordinates have no name, an unlisted id shows as it is.
  const places = entries.map(({ column }) => ({
    value: column.key,
    label:
      column.kind === 'typed'
        ? t('site.typedTitle')
        : column.kind === 'unknown'
          ? column.siteId
          : tSites(siteShortKey(column.kind === 'ready' ? column.view.site.id : column.siteId)),
  }));

  return (
    <>
      <div className={styles.head}>
        <Segmented label={t('side.mode')} options={modes} value={mode} onChange={setMode} testId={testIds.compare.sideMode} />
        {mode === 'single' && shown && places.length > 1 && (
          <Segmented label={t('side.place')} options={places} value={keyOf(shown)} onChange={setChosen} testId={testIds.compare.sidePlace} />
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
