import type { Site } from '../../../backend/lib/types';
import sites from '../../locales/en/sites.json';

// Stopgap: useScenario returns views for picked sites only, so the picker lists places from this
// fixed table. siteIds.test.ts checks it against backend/public/data/sites.json, so the two cannot
// drift. Replace with a site-list hook from backend/lib when one exists (design brief, requests for George).
export type SiteId = Exclude<keyof typeof sites, 'groups'>;

/** Picker order: south-pole candidates first, then the comparison sites further away. */
export const PICKER_GROUPS: { group: Site['group']; ids: SiteId[] }[] = [
  { group: 'Artemis regions', ids: ['haworth', 'malapert-m1', 'cabeus-b', 'slater', 'point-c'] },
  { group: 'Reference points', ids: ['point-a', 'point-b'] },
  { group: 'CLPS', ids: ['im-2', 'nobile', 'im-1'] },
  { group: 'International', ids: ['point-d', 'change-4'] },
  { group: 'Apollo', ids: ['apollo-11'] },
];

/** The `sites` copy key for a site's name. Ids from the URL may be unknown; t() then shows the key. */
export const siteNameKey = (id: string) => `${id as SiteId}.name` as const;

/** The `sites` copy key for a group's label. */
export const groupLabelKey = (group: Site['group']) => `groups.${group}` as const;
