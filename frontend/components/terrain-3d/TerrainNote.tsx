import IconAlert from '../shared/IconAlert';
import styles from './Terrain3D.module.css';

type TerrainNoteProps = { text: string; testId?: string; siteId?: string };

// A caveat under a place's terrain view: a warning mark and words, never colour alone.
const TerrainNote = ({ text, testId, siteId }: TerrainNoteProps) => {
  return (
    <p className={styles.note} data-testid={testId} data-site-id={siteId}>
      <IconAlert />
      <span>{text}</span>
    </p>
  );
};

export default TerrainNote;
