import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { mapDirection, onPolarMap, POLAR_MAP, projectPolar } from './projectPolar';
import type { Site } from './types';

const sites: Site[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));

describe('projectPolar (criterion 1)', () => {
  test.each([
    [-90, 0, 0, 0],
    [-80, 90, 304005.6080198807, 0],
    [-80, 180, 0, -304005.6080198807],
    [-89.68, -166, -2347.488475043151, -9415.262017398205], // point-a
    [-84.7906, 29.1958, 77108.48237396343, 137993.135685552], // im-2
    [-45.4561, 177.5886, 59877.50953081083, -1421872.241380911], // change-4
  ])('(%s, %s) is (%s, %s) m', (lat, lon, x, y) => {
    const p = projectPolar(lat, lon);
    expect(p.x).toBeCloseTo(x, 3);
    expect(p.y).toBeCloseTo(y, 3);
  });
});

describe('mapDirection (criterion 2)', () => {
  test.each([
    [0, 0, 0, 1],
    [90, 0, 1, 0],
    [0, 90, 1, 0],
    [180, -166, 0.24192189559966773, 0.9702957262759965],
  ])('az %s at lon %s is (%s, %s)', (az, lon, dx, dy) => {
    const d = mapDirection(az, lon);
    expect(d.dx).toBeCloseTo(dx, 12);
    expect(d.dy).toBeCloseTo(dy, 12);
  });
});

describe('mapDirection agrees with the projection (orientation)', () => {
  // Local north is up-latitude (away from the south pole); local east is increasing longitude.
  const step = (lat: number, lon: number, dLat: number, dLon: number) => {
    const a = projectPolar(lat, lon);
    const b = projectPolar(lat + dLat, lon + dLon);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { dx: (b.x - a.x) / len, dy: (b.y - a.y) / len };
  };
  test.each([-166, -42.13, 0, 29.1958, 124.5])('at lon %s, az 0 is north and az 90 is east', (lon) => {
    const north = step(-85, lon, 1e-6, 0);
    const east = step(-85, lon, 0, 1e-6);
    expect(mapDirection(0, lon).dx).toBeCloseTo(north.dx, 5);
    expect(mapDirection(0, lon).dy).toBeCloseTo(north.dy, 5);
    expect(mapDirection(90, lon).dx).toBeCloseTo(east.dx, 5);
    expect(mapDirection(90, lon).dy).toBeCloseTo(east.dy, 5);
  });
});

describe('onPolarMap (criterion 3)', () => {
  test('the 11 terrain-modelled sites are on the map; apollo-11 and change-4 are not', () => {
    const on = (s: Site) => {
      const { x, y } = projectPolar(s.lat, s.lon);
      return onPolarMap(x, y);
    };
    const modeled = sites.filter((s) => s.terrainModeled);
    expect(modeled).toHaveLength(11);
    expect(modeled.every(on)).toBe(true);
    expect(sites.filter((s) => !s.terrainModeled).map((s) => [s.id, on(s)])).toEqual([
      ['apollo-11', false],
      ['change-4', false],
    ]);
  });
  test('the edge is inclusive on both axes, and either axis out of range is off', () => {
    const H = POLAR_MAP.halfWidthM;
    expect(onPolarMap(H, -H)).toBe(true);
    expect(onPolarMap(-H, H)).toBe(true);
    expect(onPolarMap(H + 1, 0)).toBe(false);
    expect(onPolarMap(0, -H - 1)).toBe(false);
  });
});

describe('south-pole-hillshade.png (criterion 4)', () => {
  const file = `backend/public/${POLAR_MAP.path}`;
  const png = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);

  // Walks the chunks (length, type, data, CRC) after the 8-byte signature.
  const chunks: { type: string; data: Buffer }[] = [];
  for (let at = 8; at + 12 <= png.length; ) {
    const len = png.readUInt32BE(at);
    chunks.push({ type: png.toString('latin1', at + 4, at + 8), data: png.subarray(at + 8, at + 8 + len) });
    at += 12 + len;
  }

  test('the file exists, has the PNG signature and is at most 1 MiB', () => {
    expect(existsSync(file)).toBe(true);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.length).toBeLessThanOrEqual(1_048_576);
  });
  test('IHDR is first: square 1024 or 512 px, 8-bit greyscale', () => {
    expect(chunks[0].type).toBe('IHDR');
    const ihdr = chunks[0].data;
    const w = ihdr.readUInt32BE(0);
    expect([1024, 512]).toContain(w);
    expect(ihdr.readUInt32BE(4)).toBe(w);
    expect([ihdr[8], ihdr[9]]).toEqual([8, 0]);
  });
  test('tEXt halfWidthM is the extent POLAR_MAP.halfWidthM names', () => {
    const text = chunks.find((c) => c.type === 'tEXt' && c.data.toString('latin1').startsWith('halfWidthM\0'));
    expect(text?.data.toString('latin1')).toBe(`halfWidthM\0${POLAR_MAP.halfWidthM}`);
    expect(String(POLAR_MAP.halfWidthM)).toBe('368640');
  });
  test('the chunks end in IEND with one IDAT between', () => {
    expect(chunks.at(-1)?.type).toBe('IEND');
    expect(chunks.filter((c) => c.type === 'IDAT')).toHaveLength(1);
  });
});
