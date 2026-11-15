import { useTranslation } from 'react-i18next';
import { siteNameKey } from '../site-picker/siteIds';

type HowChosenProps = { checked: number; leftOut: string[] };

// The rule the tool ranks places by, and any place it left out. Shown in the best option's details.
const HowChosen = ({ checked, leftOut }: HowChosenProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  return (
    <>
      <p>{t('why.rules', { count: checked })}</p>
      {leftOut.map((id) => (
        <p key={id}>{t('why.leftOut', { site: tSites(siteNameKey(id)) })}</p>
      ))}
    </>
  );
};

export default HowChosen;
