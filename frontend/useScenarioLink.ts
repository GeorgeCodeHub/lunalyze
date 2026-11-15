import { useSyncExternalStore } from 'react';
import { readScenario, type Scenario, scenarioSearch, writeScenarioUrl } from './scenario';

// The address bar is the store: the scenario on screen is whatever its link says. React hears about
// a change in two ways: the browser's Back and Forward buttons (popstate), and this module's own writes.
const listeners = new Set<() => void>();
// A link the browser refused to write (see writeScenarioUrl). The screen still shows it, until Back or Forward.
let refused: string | null = null;

const emit = () => listeners.forEach((notify) => notify());

const onPop = () => {
  refused = null;
  emit();
};

const subscribe = (notify: () => void) => {
  if (listeners.size === 0) window.addEventListener('popstate', onPop);
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) window.removeEventListener('popstate', onPop);
  };
};

const currentSearch = () => refused ?? window.location.search;

/**
 * Writes the scenario's link and tells React. 'push' adds a browser-history entry, so Back returns to
 * where the person was; 'replace' rewrites the current entry, for edits on the Compare screen.
 */
const write = (mode: 'push' | 'replace', next: Scenario) => {
  refused = writeScenarioUrl(mode, next) ? null : scenarioSearch(next);
  emit();
};

/** The scenario in the address bar (null: no place picked yet, the setup step), and the way to change it. */
export const useScenarioLink = (): { scenario: Scenario | null; write: typeof write } => {
  const search = useSyncExternalStore(subscribe, currentSearch);

  return { scenario: readScenario(search), write };
};
