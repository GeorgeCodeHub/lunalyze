import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_PICKS, type Scenario, siteIdsOf, STAYS } from '../../scenario';
import { testIds } from '../../test-ids';
import SelectField from '../shared/SelectField';
import { STAY_KEY } from '../shared/stayKeys';
import WhenFields from '../shared/WhenFields';
import CoordsField from '../site-picker/CoordsField';
import PlacePicker from '../site-picker/PlacePicker';
import TerrainSwitch from './TerrainSwitch';
import styles from './ScenarioBar.module.css';

type ScenarioBarProps = { scenario: Scenario; onChange: (next: Scenario) => void };

const TITLE_ID = 'scenario-bar-title';

// The setup answers, editable in place: every change redraws the comparison and rewrites the link in
// the address bar, which is how the comparison is shared.
const ScenarioBar = ({ scenario, onChange }: ScenarioBarProps) => {
  const { t } = useTranslation('compare');
  // What the date field holds while it is not a full date (the user is part-way through typing one).
  const [dateDraft, setDateDraft] = useState<string | null>(null);

  const startIso = scenario.start.toISOString();
  const date = startIso.slice(0, 10);
  const hour = startIso.slice(11, 13);
  const stayOptions = STAYS.map((s) => ({ value: String(s), label: t(`setup.stay.${STAY_KEY[s]}`) }));
  // The places picked: up to 2 listed sites or typed coordinates. A typed place shows in its own field.
  const places = scenario.places.slice(0, MAX_PICKS);
  const typed = places.find((place) => place.kind === 'coords');
  const coordsText = typed ? `${typed.lat}, ${typed.lon}` : '';

  const setStart = (nextDate: string, nextHour: string) => {
    const start = new Date(`${nextDate}T${nextHour}:00:00Z`);
    if (Number.isNaN(start.getTime())) {
      setDateDraft(nextDate); // keep showing what was typed; the comparison stays on the last full date
      return;
    }
    setDateDraft(null);
    onChange({ ...scenario, start });
  };

  return (
    <section className={styles.bar} aria-labelledby={TITLE_ID} data-testid={testIds.scenarioBar.root}>
      <h2 id={TITLE_ID} className={styles.title}>
        {t('bar.title')}
      </h2>
      <div className={styles.fields}>
        <PlacePicker places={places} onChange={(next) => onChange({ ...scenario, places: next })} />
        {/* A new field each time the places change, so text typed earlier does not linger beside them.
            Typed coordinates take the place of earlier ones, first, with the listed sites after them. */}
        <CoordsField
          key={siteIdsOf(places).join(',') + coordsText}
          value={coordsText}
          onPick={(coords) =>
            onChange({
              ...scenario,
              places: [{ kind: 'coords' as const, ...coords }, ...places.filter((place) => place.kind === 'site')].slice(0, MAX_PICKS),
            })
          }
        />
        <WhenFields
          date={dateDraft ?? date}
          hour={hour}
          onDate={(next) => setStart(next, hour)}
          onHour={(next) => setStart(date, next)}
          dateTestId={testIds.scenarioBar.date}
          hourTestId={testIds.scenarioBar.hour}
        />
        <SelectField
          label={t('bar.stay')}
          value={String(scenario.stay)}
          options={stayOptions}
          testId={testIds.scenarioBar.stay}
          onChange={(value) => onChange({ ...scenario, stay: STAYS.find((s) => String(s) === value) ?? scenario.stay })}
        />
      </div>
      <div className={styles.actions}>
        <TerrainSwitch terrain={scenario.terrain} onChange={(terrain) => onChange({ ...scenario, terrain })} />
      </div>
    </section>
  );
};

export default ScenarioBar;
