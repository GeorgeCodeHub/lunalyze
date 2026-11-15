import { useEffect, useState } from 'react';
import Compare from './components/Compare';
import Setup from './components/Setup';
import { readScenario, type Scenario, scenarioSearch } from './scenario';
import { usePlaybackStore } from './stores/compare';

const App = () => {
  const [scenario, setScenario] = useState(() => readScenario(window.location.search));
  const [editing, setEditing] = useState(false);
  const resetPlayback = usePlaybackStore((s) => s.reset);

  // A setup answer: a new entry in the browser history, so Back returns to the setup step.
  const start = (next: Scenario) => {
    window.history.pushState(null, '', scenarioSearch(next));
    resetPlayback();
    setScenario(next);
    setEditing(false);
  };

  // An edit on the Compare screen: the link follows along, without filling the history.
  const change = (next: Scenario) => {
    window.history.replaceState(window.history.state, '', scenarioSearch(next));
    setScenario(next);
  };

  useEffect(() => {
    const onPop = () => {
      setScenario(readScenario(window.location.search));
      setEditing(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!scenario || editing) return <Setup initial={scenario} onSubmit={start} />;

  return <Compare scenario={scenario} onChange={change} onBack={() => setEditing(true)} />;
};

export default App;
