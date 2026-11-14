import { useState } from 'react';
import { parseScenario, serializeScenario, type Scenario } from '../backend/lib/scenarioUrl';
import { resources } from './i18n';

// Site ids come from the sites copy keys (they match sites.json); 'groups' is the group-label table.
const SITE_IDS = Object.keys(resources.en.sites).filter((k) => k !== 'groups');

// update merges one patch per event; two calls in the same handler would lose the first.
export const useScenarioUrl = (): { scenario: Scenario; update: (patch: Partial<Scenario>) => void } => {
  const [scenario, setScenario] = useState(() => parseScenario(window.location.search, SITE_IDS));

  const update = (patch: Partial<Scenario>) => {
    const next = { ...scenario, ...patch };
    setScenario(next);
    const url = new URL(window.location.href);
    url.search = serializeScenario(next);
    window.history.replaceState(window.history.state, '', url.href);
  };

  return { scenario, update };
};
