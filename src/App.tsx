import { useTranslation } from 'react-i18next';

// Placeholder so the build runs. Christina owns this file.
const App = () => {
  const { t } = useTranslation();

  return <h1>{t('appTitle')}</h1>;
};

export default App;
