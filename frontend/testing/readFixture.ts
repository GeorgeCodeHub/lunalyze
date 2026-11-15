// File reads for tests only: nothing in the app imports this module.
import { readFileSync } from 'node:fs';
import type { Site } from '../../backend/lib/types';

const SITES_PATH = 'backend/public/data/sites.json';

/** A project file as text. A missing file fails the test with a message that names the file. */
export const readText = (path: string): string => {
  try {
    return readFileSync(path, 'utf8');
  } catch (cause) {
    throw new Error(`could not read ${path}`, { cause });
  }
};

/** The site list the app ships. A missing or broken file fails the test with a message that names the file. */
export const readSites = (): Site[] => {
  try {
    return JSON.parse(readText(SITES_PATH));
  } catch (cause) {
    throw new Error(`could not read the site list at ${SITES_PATH}`, { cause });
  }
};
