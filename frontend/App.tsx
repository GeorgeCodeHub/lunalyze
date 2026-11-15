import { useState } from 'react';
import Compare from './components/Compare';
import Setup from './components/Setup';
import type { Scenario } from './scenario';
import { usePlaybackStore } from './stores/compare';
import { useScenarioLink } from './useScenarioLink';

const App = () => {
  const { scenario, write } = useScenarioLink();
  const resetPlayback = usePlaybackStore((s) => s.reset);
  const [editing, setEditing] = useState(false); // Back from Compare: the setup step, with its answers kept

  // A setup answer: a new entry in the browser history, so Back returns to the setup step.
  const start = (next: Scenario) => {
    resetPlayback();
    setEditing(false);
    write('push', next);
  };

  if (!scenario || editing) return <Setup initial={scenario} onSubmit={start} />;

  // An edit on the Compare screen: the link follows along, without filling the history.
  return <Compare scenario={scenario} onChange={(next) => write('replace', next)} onBack={() => setEditing(true)} />;
};

export default App;
