import { useTranslation } from 'react-i18next';
import moonUrl from '../assets/moon-full-nasa-gsfc.jpg';
import { testIds } from '../test-ids';
import styles from './MoonHero.module.css';

// The photo is decoration with a credit; it carries no data (README rule 2).
// The SVG filter cuts the Moon out of its black sky (any pixel brighter than the sky becomes opaque),
// then wraps the cut-out in a tight bright rim and a wide warm halo that fades into the page.
const MoonHero = () => {
  const { t } = useTranslation('compare');

  return (
    <aside className={styles.hero}>
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <filter id="moon-glow" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  7 7 7 0 -1.4"
            result="cutout"
          />
          {/* Bright, with a faint warm cast from the glow, but not blown out: crater detail stays. */}
          <feComponentTransfer in="cutout" result="moon">
            <feFuncR type="linear" slope="1.16" intercept="0.07" />
            <feFuncG type="linear" slope="1.14" intercept="0.05" />
            <feFuncB type="linear" slope="1.1" intercept="0.03" />
          </feComponentTransfer>
          <feFlood className={styles.glowColor} result="glowColor" />
          <feGaussianBlur in="moon" stdDeviation="10" result="rimBlur" />
          <feComposite in="glowColor" in2="rimBlur" operator="in" result="rim" />
          <feGaussianBlur in="moon" stdDeviation="34" result="midBlur" />
          <feComposite in="glowColor" in2="midBlur" operator="in" result="mid" />
          <feGaussianBlur in="moon" stdDeviation="120" result="farBlur" />
          <feComposite in="glowColor" in2="farBlur" operator="in" result="far" />
          <feComponentTransfer in="far" result="farSoft">
            <feFuncA type="linear" slope="0.7" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="farSoft" />
            <feMergeNode in="mid" />
            <feMergeNode in="rim" />
            <feMergeNode in="rim" />
            <feMergeNode in="moon" />
          </feMerge>
        </filter>
      </svg>
      <div className={styles.stars} aria-hidden="true" />
      <img className={styles.moon} src={moonUrl} alt={t('hero.alt')} data-testid={testIds.hero.image} />
    </aside>
  );
};

export default MoonHero;
