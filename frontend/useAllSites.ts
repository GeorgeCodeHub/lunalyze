import type { SiteView } from '../backend/lib/types';
import { useScenario } from '../backend/lib/useScenario';
import { PICKER_GROUPS } from './components/site-picker/siteIds';

const IDS: string[] = PICKER_GROUPS.flatMap(({ ids }) => ids);

/** useScenario takes up to 3 sites at a time (DATA_CONTRACT), so the whole list is asked for 3 at a time. */
export const SITE_BATCHES = [IDS.slice(0, 3), IDS.slice(3, 6), IDS.slice(6, 9), IDS.slice(9, 12), IDS.slice(12, 15)];

/**
 * Every listed place over the Moon day that starts at `start` (the landing time), so the tool can rank
 * them. The Moon-day lanes also cover every stay offered. Files are fetched once and cached, and a
 * place shown on screen reuses its view from here.
 */
export const useAllSites = (start: Date, terrain: boolean): { views: SiteView[]; loading: boolean; error: Error | null } => {
  const opts = { terrain };
  const a = useScenario(SITE_BATCHES[0], start, 'lunarDay', opts);
  const b = useScenario(SITE_BATCHES[1], start, 'lunarDay', opts);
  const c = useScenario(SITE_BATCHES[2], start, 'lunarDay', opts);
  const d = useScenario(SITE_BATCHES[3], start, 'lunarDay', opts);
  const e = useScenario(SITE_BATCHES[4], start, 'lunarDay', opts);

  const parts = [a, b, c, d, e];

  return {
    views: parts.flatMap((part) => part.views),
    loading: parts.some((part) => part.loading),
    error: parts.find((part) => part.error)?.error ?? null,
  };
};
