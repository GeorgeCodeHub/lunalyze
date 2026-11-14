# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy"]
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Write horizon masks and 500x500 terrain crops for every terrainModeled site from the LOLA polar DEMs."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

R = 1737400.0  # lunar sphere radius, m
MAST_M = 2.0
AZ_STEP = 0.5
N_AZ = 720
DEMS = [("ldem_85s_20m", 15168, 20), ("ldem_80s_80m", 7600, 80), ("ldem_75s_240m", 3812, 240)]
NEAR_M, NEAR_STEP_M = 5000.0, 20.0  # a 80 m DEM step skips peaks near the observer, so sample 20 m out to 5 km
FINE_SITES = {"point-a", "point-b", "point-c", "point-d"}  # 20 m band only here

Dem = tuple[np.ndarray, float]  # (int16 N x N, scale m/px); pixel centre of (j, i) at integer (j, i), off = (N-1)/2


def to_xy(lat_deg, lon_deg):
    """South polar stereographic: x toward 90E, y toward 0 longitude, metres."""
    rho = 2 * R * np.tan(np.radians(90 + np.asarray(lat_deg, dtype=float)) / 2)
    lon = np.radians(lon_deg)
    return rho * np.sin(lon), rho * np.cos(lon)


def sample(dem: Dem, x, y):
    """Bilinear height in metres (DN * 0.5) and a mask of points inside the DEM."""
    a, scale = dem
    n = a.shape[0]
    off = (n - 1) / 2
    i = off + np.asarray(x, dtype=float) / scale
    j = off - np.asarray(y, dtype=float) / scale
    inside = (i >= 0) & (i <= n - 1) & (j >= 0) & (j <= n - 1)
    i, j = np.where(inside, i, 0.0), np.where(inside, j, 0.0)
    i0, j0 = np.minimum(np.floor(i).astype(np.int64), n - 2), np.minimum(np.floor(j).astype(np.int64), n - 2)
    fi, fj = i - i0, j - j0
    h = (
        a[j0, i0] * (1 - fi) * (1 - fj) + a[j0, i0 + 1] * fi * (1 - fj) + a[j0 + 1, i0] * (1 - fi) * fj + a[j0 + 1, i0 + 1] * fi * fj
    ) * 0.5
    return h, inside


def elevation_deg(ro, rt, theta):
    """Elevation of a target at radius rt, central angle theta, seen from radius ro."""
    return np.degrees(np.arctan2(rt * np.cos(theta) - ro, rt * np.sin(theta)))


def _unit(x, y):
    d = 4 * R * R + x * x + y * y
    return np.stack([4 * R * x / d, 4 * R * y / d, (4 * R * R - x * x - y * y) / d], axis=-1)


def _sample_from(bands, first, x, y):
    """Height from DEM `first`, falling back to each coarser listed DEM; NaN where none contains the point."""
    h = np.full(np.shape(x), np.nan)
    for k in range(first, len(bands)):
        todo = np.isnan(h)
        hk, ok = sample(bands[k][0], np.asarray(x)[todo], np.asarray(y)[todo])
        h[np.flatnonzero(todo)[ok]] = hk[ok]
    return h


def horizon(lat, lon, bands: list[tuple[Dem, float]]):
    """(elevDeg[720], incomplete[720]) for a 2 m mast; bands run fine to coarse, each out to its reach in metres."""
    x0, y0 = (float(v) for v in to_xy(lat, lon))
    ro = R + _sample_from(bands, 0, np.array([x0]), np.array([y0]))[0] + MAST_M
    d, band = [], []
    start = 0.0
    for k, ((_, step), reach) in enumerate(bands):
        ds = np.arange(start + step, reach + step / 2, step)
        if start < NEAR_M:
            near = np.arange(start + NEAR_STEP_M, min(reach, NEAR_M) + NEAR_STEP_M / 2, NEAR_STEP_M)
            ds = np.concatenate([near, ds[ds > NEAR_M]])
        d.append(ds)
        band.append(np.full(ds.size, k))
        start = reach
    d, band = np.concatenate(d), np.concatenate(band)

    beta = np.radians(AZ_STEP * np.arange(N_AZ) + lon)[:, None]  # bearing = azimuth + longitude
    X, Y = x0 + np.sin(beta) * d, y0 + np.cos(beta) * d
    H = np.full(X.shape, np.nan)
    for k in range(len(bands)):
        for r in range(N_AZ):
            todo = np.isnan(H[r]) & (band <= k)
            hk, ok = sample(bands[k][0], X[r, todo], Y[r, todo])
            H[r, np.flatnonzero(todo)[ok]] = hk[ok]

    u0, u = _unit(x0, y0), _unit(X, Y)
    theta = np.arctan2(np.linalg.norm(np.cross(u0, u), axis=-1), u @ u0)
    elev = elevation_deg(ro, R + H, theta)
    missing = np.isnan(H)
    first_missing = np.where(missing.any(1), missing.argmax(1), d.size)
    elev = np.where(np.arange(d.size) < first_missing[:, None], elev, -np.inf)
    return np.round(elev.max(1), 3), missing.any(1)


def terrain_crop(lat, lon, dem80: Dem, dem240: Dem, size: int = 500):
    """size x size int16 crop of the 80 m DEM around the site, 240 m values outside it; returns (crop, origin_x, origin_y)."""
    a80, s80 = dem80
    a240, s240 = dem240
    n80, n240 = a80.shape[0], a240.shape[0]
    off80, off240 = (n80 - 1) / 2, (n240 - 1) / 2
    x, y = (float(v) for v in to_xy(lat, lon))
    i0 = int(np.floor(off80 + x / s80)) - (size // 2 - 1)
    j0 = int(np.floor(off80 - y / s80)) - (size // 2 - 1)
    jj, ii = np.mgrid[j0 : j0 + size, i0 : i0 + size]
    inside = (ii >= 0) & (ii < n80) & (jj >= 0) & (jj < n80)
    crop = a80[np.where(inside, jj, 0), np.where(inside, ii, 0)]
    i240 = np.clip(np.rint(off240 + (ii - off80) * s80 / s240).astype(np.int64), 0, n240 - 1)
    j240 = np.clip(np.rint(off240 - (off80 - jj) * s80 / s240).astype(np.int64), 0, n240 - 1)
    crop = np.where(inside, crop, a240[j240, i240]).astype(np.int16)
    return crop, (i0 - off80) * s80, (off80 - j0) * s80


def load_dems(dem_dir: Path) -> list[Dem]:
    out = []
    for name, n, scale in DEMS:
        path = dem_dir / f"{name}.img"
        if not path.exists() or path.stat().st_size != n * n * 2:
            sys.exit(f"{path} missing or not {n * n * 2} bytes; run backend/scripts/download_dems.py first")
        out.append((np.memmap(path, dtype="<i2", mode="r", shape=(n, n)), float(scale)))
    return out


def self_check(dems: list[Dem]) -> tuple[float, float, list[float]]:
    """Nested DEMs agree and the polar axes are the right way round, or exit before writing anything."""
    g = np.random.default_rng(0)
    x, y = to_xy(g.uniform(-89.5, -85.5, 500), g.uniform(-180, 180, 500))
    h20, h80, h240 = (sample(d, x, y)[0] for d in dems)
    m1, m2 = float(np.median(abs(h20 - h80))), float(np.median(abs(h80 - h240)))
    shackleton = [float(sample(d, *to_xy(-89.67, 129.78))[0]) for d in dems]
    if m1 >= 3 or m2 >= 3 or max(shackleton) >= -2500:
        sys.exit(f"DEM self-check failed: nested medians {m1:.2f}, {m2:.2f} m; Shackleton heights {shackleton}")
    return m1, m2, shackleton


def default_dem_dir() -> Path:
    here = Path(__file__).resolve().parent
    r = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=here, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("not inside a git checkout: pass --dem DIR")
    common = r.stdout.strip()
    return Path(common).parent / "backend/dem"


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, separators=(",", ":"), allow_nan=False) + "\n")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("site_ids", nargs="*")
    p.add_argument("--dem", type=Path, help="default: backend/dem of the main checkout")
    p.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "public/data")
    args = p.parse_args()

    sites = {s["id"]: s for s in json.loads((args.out / "sites.json").read_text())}
    ids = args.site_ids or [i for i, s in sites.items() if s["terrainModeled"]]
    for i in ids:
        if not re.fullmatch(r"[a-z0-9-]+", i):  # ids become output file names
            sys.exit(f"{i!r} is not a valid site id")
        if i not in sites or not sites[i]["terrainModeled"]:
            sys.exit(f"{i} is not a terrainModeled site")

    dems = load_dems(args.dem or default_dem_dir())
    m1, m2, shackleton = self_check(dems)
    print(f"self-check ok: nested medians {m1:.2f}, {m2:.2f} m; Shackleton {shackleton}")
    (args.out / "masks").mkdir(parents=True, exist_ok=True)
    (args.out / "terrain").mkdir(parents=True, exist_ok=True)

    for i in ids:
        s = sites[i]
        bands = [(dems[1], 100000.0), (dems[2], 300000.0)]
        if i in FINE_SITES:
            bands = [(dems[0], 20000.0), *bands]
        elev, incomplete = horizon(s["lat"], s["lon"], bands)
        dump(
            args.out / f"masks/{i}.json",
            {"siteId": i, "mastM": MAST_M, "azStepDeg": AZ_STEP, "elevDeg": elev.tolist(), "incomplete": incomplete.tolist()},
        )
        crop, ox, oy = terrain_crop(s["lat"], s["lon"], dems[1], dems[2])
        (args.out / f"terrain/{i}.bin").write_bytes(crop.astype("<i2").tobytes())
        dump(args.out / f"terrain/{i}.json", {"siteId": i, "width": 500, "height": 500, "pixelM": 80, "origin": {"x": ox, "y": oy}})
        print(f"{i}: elevDeg {elev.min():.3f}..{elev.max():.3f}, incomplete {int(incomplete.sum())}")


if __name__ == "__main__":
    main()
