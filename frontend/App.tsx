import { useEffect, useState } from 'react';
import CompareNext from './components/CompareNext';
import Setup from './components/Setup';
import { readScenario, type Scenario, scenarioSearch } from './scenario';

const App = () => {
  const [scenario, setScenario] = useState(() => readScenario(window.location.search));
  const [editing, setEditing] = useState(false);

  const start = (next: Scenario) => {
    window.history.pushState(null, '', scenarioSearch(next));
    setScenario(next);
    setEditing(false);
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

  return <CompareNext onBack={() => setEditing(true)} />;
};

export default App;
