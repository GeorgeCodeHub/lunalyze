# /// script
# requires-python = ">=3.12"
# dependencies = []
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Sample PGDA product 69 (average solar illumination, Mazarico et al. 2011) at the sites, as a markdown table."""

import argparse
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import urllib.request
import zlib
from pathlib import Path

HOST = "https://pgda.gsfc.nasa.gov/data/MoonIllumination/"  # the only host this script talks to
GRIDS = ["AVGVISIB_85S_060M_201608.TIF", "AVGVISIB_75S_120M_201608.TIF"]  # finest first
R = 1737400.0
NODATA = -32768
SCALE = 4e-5  # DN to fraction
CHUNK = 1 << 20
GATE = {"point-a": 81, "point-b": 82, "point-c": 85, "point-d": 86, "malapert-m1": 74}
TYPES = {1: ("B", 1), 2: ("c", 1), 3: ("H", 2), 4: ("I", 4), 12: ("d", 8), 16: ("Q", 8)}  # TIFF type to struct code, size


def default_dem_dir() -> Path:
    here = Path(__file__).resolve().parent
    try:
        r = subprocess.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=here, capture_output=True, text=True)
    except FileNotFoundError:
        sys.exit("git not found: pass --dem DIR")
    if r.returncode != 0:
        sys.exit("not inside a git checkout: pass --dem DIR")
    return Path(r.stdout.strip()).parent / "backend/dem"


def to_xy(lat: float, lon: float) -> tuple[float, float]:
    """South polar stereographic: x toward 90E, y toward 0 longitude, metres (as horizon_masks.py)."""
    rho = 2 * R * math.tan(math.radians(90 + lat) / 2)
    return rho * math.sin(math.radians(lon)), rho * math.cos(math.radians(lon))


def download(name: str, dest: Path) -> Path:
    url, path = HOST + name, dest / name
    with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=60) as r:
        if not r.geturl().startswith(HOST):  # urlopen follows redirects to any host
            sys.exit(f"{name}: redirected away from {HOST} to {r.geturl()}")
        if r.headers["Content-Length"] is None:
            sys.exit(f"{name}: server sent no Content-Length")
        size = int(r.headers["Content-Length"])
    have = path.stat().st_size if path.exists() else 0
    if have > size:
        sys.exit(f"{path} is larger than the server's {size} bytes: delete it")
    if have < size:
        req = urllib.request.Request(url, headers={"Range": f"bytes={have}-"} if have else {})
        with urllib.request.urlopen(req, timeout=60) as r:
            if not r.geturl().startswith(HOST):
                sys.exit(f"{name}: redirected away from {HOST} to {r.geturl()}")
            resumed = have > 0 and r.status == 206  # a 200 means the server ignored Range: restart
            with path.open("ab" if resumed else "wb") as f:
                shutil.copyfileobj(r, f, CHUNK)
    actual = path.stat().st_size
    print(f"{name} {'ok' if actual == size else 'MISMATCH'} actual={actual} expected={size}", file=sys.stderr)
    if actual != size:
        sys.exit(1)
    return path


class Tiff:
    """The first IFD of a little-endian BigTIFF: just what a tiled int16 grid needs."""

    def __init__(self, path: Path):
        self.f = path.open("rb")
        head = self.f.read(16)
        if head[:4] != b"II+\x00" or struct.unpack("<HH", head[4:8]) != (8, 0):
            sys.exit(f"{path.name}: not a little-endian BigTIFF")
        self.name = path.name
        try:
            self._parse(head)
        except (KeyError, IndexError, struct.error) as e:  # unsupported TIFF type, missing tag, truncated file
            sys.exit(f"{path.name}: malformed or unsupported TIFF ({type(e).__name__}: {e})")

    def _parse(self, head: bytes):
        path_name = self.name
        self.f.seek(struct.unpack("<Q", head[8:])[0])
        (n,) = struct.unpack("<Q", self.f.read(8))
        self.tags = {}
        for _ in range(n):
            tag, typ, count, raw = struct.unpack("<HHQ8s", self.f.read(20))
            code, size = TYPES[typ]
            if count * size <= 8:
                data = raw[: count * size]
            else:
                pos = self.f.tell()
                self.f.seek(struct.unpack("<Q", raw)[0])
                data = self.f.read(count * size)
                self.f.seek(pos)
            self.tags[tag] = data if code == "c" else struct.unpack(f"<{count}{code}", data)
        t = self.tags
        self.w, self.h, self.tw, self.th = t[256][0], t[257][0], t[322][0], t[323][0]
        self.offsets, self.counts = t[324], t[325]
        self.compression, self.predictor = t[259][0], t.get(317, (1,))[0]
        self.tie, self.pixel = t[33922], t[33550]
        if (t[258], t[277], t.get(339)) != ((16,), (1,), (2,)):
            sys.exit(f"{path_name}: expected one int16 sample per pixel")
        if self.compression not in (8, 32946) or self.predictor not in (1, 2):
            sys.exit(f"{path_name}: compression {self.compression} / predictor {self.predictor} unsupported (Deflate, 1 or 2 only)")
        self.x0, self.y0, self.s = self.tie[3], self.tie[4], self.pixel[0]
        if self.tie[:3] != (0.0, 0.0, 0.0) or self.pixel[1] != self.s or abs(self.x0 + self.w * self.s / 2) > 1e-6 or abs(self.y0 - self.h * self.s / 2) > 1e-6:
            sys.exit(f"{path_name}: tiepoint {self.tie} / scale {self.pixel} is not a centred corner-origin grid")

    def contains(self, x: float, y: float) -> bool:
        return 0 <= (x - self.x0) / self.s < self.w and 0 <= (self.y0 - y) / self.s < self.h

    def dn(self, x: float, y: float) -> int:
        col, row = math.floor((x - self.x0) / self.s), math.floor((self.y0 - y) / self.s)
        k = (row // self.th) * math.ceil(self.w / self.tw) + col // self.tw
        try:
            self.f.seek(self.offsets[k])
            px = list(struct.unpack(f"<{self.tw * self.th}h", zlib.decompress(self.f.read(self.counts[k]))))
        except (IndexError, struct.error, zlib.error) as e:  # short offsets table, truncated or corrupt tile
            sys.exit(f"{self.name}: cannot read tile {k} ({type(e).__name__}: {e})")
        r, c = row % self.th, col % self.tw
        if self.predictor == 2:  # horizontal differencing: running sum along the row, int16 wraparound
            v = 0
            for i in range(r * self.tw, r * self.tw + c + 1):
                v = (v + px[i] + 32768) % 65536 - 32768
            return v
        return px[r * self.tw + c]


def sample(grids: list[Tiff], lat: float, lon: float) -> tuple[float, str]:
    x, y = to_xy(lat, lon)
    for g, label in zip(grids, ("85S 60 m", "75S 120 m")):
        if g.contains(x, y):
            dn = g.dn(x, y)
            if dn == NODATA:
                raise ValueError(f"({lat}, {lon}) sits on nodata in the {label} grid")
            return dn * SCALE * 100, label
    raise ValueError(f"({lat}, {lon}) is outside both grids")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dem", type=Path, default=None, help="download directory (default: main checkout backend/dem)")
    p.add_argument("--sites", type=Path, default=Path(__file__).resolve().parents[1] / "public/data/sites.json")
    args = p.parse_args()
    dest = args.dem or default_dem_dir()
    dest.mkdir(parents=True, exist_ok=True)
    grids = [Tiff(download(name, dest)) for name in GRIDS]
    for name, g in zip(GRIDS, grids):
        print(f"{name}: {g.w}x{g.h}, tile {g.tw}x{g.th}, compression {g.compression}, predictor {g.predictor}, scale {g.s} m, tiepoint {g.tie[3:5]}", file=sys.stderr)

    shackleton, _ = sample(grids, -89.67, 129.78)  # permanently shadowed floor
    if not shackleton < 5:
        sys.exit(f"self-check failed: Shackleton floor reads {shackleton:.2f} %, expected < 5 %")
    print(f"self-check: Shackleton floor (-89.67, 129.78) = {shackleton:.2f} % (< 5 %)", file=sys.stderr)

    sites = [s for s in json.loads(args.sites.read_text()) if s["terrainModeled"]]
    sites.sort(key=lambda s: (s["id"] not in GATE, list(GATE).index(s["id"]) if s["id"] in GATE else 0))  # gate sites first, in gate order
    print("| Site | PGDA 69 avg sunlit % | grid | reference % |\n|---|---|---|---|")
    for s in sites:
        pct, label = sample(grids, s["lat"], s["lon"])
        print(f"| {s['id']} | {pct:.1f} | {label} | {GATE.get(s['id'], '-')} |")
    print("\nPGDA product 69, Mazarico et al. (2011), Icarus 211, 1066-1081 (LOLA): average solar illumination, hourly over 18.6 yr; nearest pixel, no date-level sunlight claims.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
