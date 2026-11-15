import styles from './BodyGlyph.module.css';

type BodyGlyphProps = { body: 'sun' | 'earth' | 'both' };

// The Sun is always a circle and Earth always a diamond, in every legend, chip and lane label,
// so the two are told apart by shape as well as colour. Decorative: the words sit next to it.
const BodyGlyph = ({ body }: BodyGlyphProps) => {
  const both = body === 'both';
  const earthX = both ? 17 : 6; // "both" draws the circle, then the diamond beside it

  return (
    <svg className={styles.glyph} data-body={body} width={both ? 23 : 12} height="12" viewBox={`0 0 ${both ? 23 : 12} 12`} aria-hidden="true">
      {body !== 'earth' && <circle className={styles.sun} cx="6" cy="6" r="4.6" />}
      {body !== 'sun' && <rect className={styles.earth} x={earthX - 3.3} y="2.7" width="6.6" height="6.6" transform={`rotate(45 ${earthX} 6)`} />}
    </svg>
  );
};

export default BodyGlyph;
