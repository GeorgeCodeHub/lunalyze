import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Scenario, siteIdsOf, STAYS, ZOOMS } from '../../scenario';
import { testIds } from '../../test-ids';
import SelectField from '../shared/SelectField';
import { STAY_KEY } from '../shared/stayKeys';
import WhenFields from '../shared/WhenFields';
import PlaceSelect from '../site-picker/PlaceSelect';
import CopyLinkButton from './CopyLinkButton';
import TerrainSwitch from './TerrainSwitch';
import styles from './ScenarioBar.module.css';

type ScenarioBarProps = { scenario: Scenario; onChange: (next: Scenario) => void };

const TITLE_ID = 'scenario-bar-title';
const ZOOM_KEYS = { day: 'bar.zoomDay', lunarDay: 'bar.zoomLunarDay', year: 'bar.zoomYear' } as const;

// The setup answers, editable in place: every change redraws the comparison and rewrites the link.
const ScenarioBar = ({ scenario, onChange }: ScenarioBarProps) => {
  const { t } = useTranslation('compare');
  // What the date field holds while it is not a full date (the user is part-way through typing one).
  const [dateDraft, setDateDraft] = useState<string | null>(null);

  const startIso = scenario.start.toISOString();
  const date = startIso.slice(0, 10);
  const hour = startIso.slice(11, 13);
  const stayOptions = STAYS.map((s) => ({ value: String(s), label: t(`setup.stay.${STAY_KEY[s]}`) }));
  const zoomOptions = ZOOMS.map((z) => ({ value: z, label: t(ZOOM_KEYS[z]) }));
  // The person's place: the one chosen last. A link can carry a second place after the setup one.
  const [placeId = ''] = siteIdsOf([scenario.places[1] ?? scenario.places[0]]);

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
        <PlaceSelect value={placeId} onPick={(id) => onChange({ ...scenario, places: [{ kind: 'site', id }] })} />
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
        <SelectField
          label={t('bar.zoom')}
          value={scenario.zoom}
          options={zoomOptions}
          testId={testIds.scenarioBar.zoom}
          onChange={(value) => onChange({ ...scenario, zoom: ZOOMS.find((z) => z === value) ?? scenario.zoom })}
        />
      </div>
      <div className={styles.actions}>
        <TerrainSwitch terrain={scenario.terrain} onChange={(terrain) => onChange({ ...scenario, terrain })} />
        <CopyLinkButton />
      </div>
    </section>
  );
};

export default ScenarioBar;
