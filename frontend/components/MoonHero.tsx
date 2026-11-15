import { useTranslation } from 'react-i18next';
import moonUrl from '../assets/moon-full-nasa-gsfc.jpg';
import { testIds } from '../test-ids';
import styles from './MoonHero.module.css';

const STAR_LAYERS = [1, 2, 3, 4, 5, 6, 7, 8]; // one star each, placed and timed in the CSS by order

// The photo is decoration with a credit; it carries no data (README rule 2).
// The SVG filter cuts the Moon out of its black sky (any pixel brighter than the sky becomes opaque),
// then lights it like a long-exposure photo: a white-hot limb, a white-to-cream bloom at the edge,
// and a wide warm haze that fades into the page.
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
          {/* Bright and a little washed, like a long exposure, while crater detail stays. */}
          <feComponentTransfer in="cutout" result="moon">
            <feFuncR type="linear" slope="1.2" intercept="0.1" />
            <feFuncG type="linear" slope="1.18" intercept="0.09" />
            <feFuncB type="linear" slope="1.14" intercept="0.07" />
          </feComponentTransfer>

          {/* 1. The limb burns white: a white band just inside the edge, fading inward. */}
          <feGaussianBlur in="cutout" stdDeviation="40" result="innerBlur" />
          <feComposite in="cutout" in2="innerBlur" operator="out" result="edgeBand" />
          <feFlood className={styles.rimColor} result="rimColor" />
          <feComposite in="rimColor" in2="edgeBand" operator="in" result="limbOnce" />
          <feComponentTransfer in="limbOnce" result="limb">
            <feFuncA type="linear" slope="2.4" />
          </feComponentTransfer>

          {/* 2. A thick white-to-cream bloom hugging the edge outside. */}
          <feGaussianBlur in="cutout" stdDeviation="9" result="bloomBlur" />
          <feComposite in="rimColor" in2="bloomBlur" operator="in" result="bloom" />
          <feGaussianBlur in="cutout" stdDeviation="24" result="bloomWideBlur" />
          <feComposite in="rimColor" in2="bloomWideBlur" operator="in" result="bloomWide" />
          <feFlood className={styles.glowColor} result="glowColor" />
          <feGaussianBlur in="cutout" stdDeviation="38" result="midBlur" />
          <feComposite in="glowColor" in2="midBlur" operator="in" result="midOnce" />
          <feComponentTransfer in="midOnce" result="mid">
            <feFuncA type="linear" slope="1.5" />
          </feComponentTransfer>

          {/* 3. A wide warm haze that spreads far into the sky. */}
          <feFlood className={styles.hazeColor} result="hazeColor" />
          <feGaussianBlur in="cutout" stdDeviation="150" result="farBlur" />
          <feComposite in="hazeColor" in2="farBlur" operator="in" result="farOnce" />
          <feComponentTransfer in="farOnce" result="far">
            <feFuncA type="linear" slope="1.3" />
          </feComponentTransfer>

          <feMerge>
            <feMergeNode in="far" />
            <feMergeNode in="mid" />
            <feMergeNode in="bloomWide" />
            <feMergeNode in="bloom" />
            <feMergeNode in="bloom" />
            <feMergeNode in="moon" />
            <feMergeNode in="limb" />
          </feMerge>
        </filter>
      </svg>
      <div className={styles.stars} aria-hidden="true">
        {STAR_LAYERS.map((n) => (
          <span key={n} className={styles.star} />
        ))}
      </div>
      <img className={styles.moon} src={moonUrl} alt={t('hero.alt')} data-testid={testIds.hero.image} />
    </aside>
  );
};

export default MoonHero;
