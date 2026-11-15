import { useTranslation } from 'react-i18next';
import type { Focus } from '../../scenario';
import { siteNameKey } from '../site-picker/siteIds';

type HowChosenProps = { checked: number; leftOut: string[]; focus: Focus };

// The rule the tool ranks places by, for what matters most, and any place it left out. Shown in the
// best option's details.
const HowChosen = ({ checked, leftOut, focus }: HowChosenProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  return (
    <>
      <p>{t(`why.rules.${focus}`, { count: checked })}</p>
      {leftOut.map((id) => (
        <p key={id}>{t('why.leftOut', { site: tSites(siteNameKey(id)) })}</p>
      ))}
    </>
  );
};

export default HowChosen;
