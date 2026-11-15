import moonUrl from '../assets/moon-full-nasa-gsfc.jpg';
import styles from './MoonRise.module.css';

// The Moon rising at the foot of the Compare screen: the landing page's photo, its black sky blended
// away, in the same warm haze. Decoration only: it carries no data, and its credit is in Data sources.
const MoonRise = () => {
  return (
    <div className={styles.rise} aria-hidden="true">
      <img className={styles.moon} src={moonUrl} alt="" />
    </div>
  );
};

export default MoonRise;
