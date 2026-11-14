# /// script
# requires-python = ">=3.12"
# dependencies = []
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Download LOLA polar DEMs (.lbl then .img) into backend/dem/, resuming partial .img files."""

import argparse
import os
import re
import shutil
import sys
import urllib.request
from pathlib import Path

BASE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/"
PRODUCTS = ["ldem_75s_240m", "ldem_80s_80m", "ldem_85s_20m"]  # smallest first
CHUNK = 1 << 20


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("products", nargs="*", choices=PRODUCTS, default=PRODUCTS)
    p.add_argument("--dest", type=Path, default=Path(__file__).resolve().parents[1] / "dem")
    return p.parse_args()


def fetch_label(name: str, dest: Path) -> None:
    lbl = dest / f"{name}.lbl"
    if lbl.exists():
        print(f"{name}.lbl skipped actual={lbl.stat().st_size} expected=-")
        return
    part = lbl.with_name(lbl.name + ".part")
    with urllib.request.urlopen(f"{BASE}{name}.lbl", timeout=60) as r, part.open("wb") as f:
        shutil.copyfileobj(r, f, CHUNK)
    os.replace(part, lbl)
    print(f"{name}.lbl ok actual={lbl.stat().st_size} expected=-")


def expected_size(lbl: Path) -> int | None:
    """LINES x LINE_SAMPLES x SAMPLE_BITS/8, or None unless LSB_INTEGER, 16-bit and square."""
    text = lbl.read_text(errors="replace")

    def field(key: str) -> str | None:
        m = re.search(rf"^\s*{key}\s*=\s*\"?([\w.]+)", text, re.M)
        return m.group(1) if m else None

    lines, samples, bits, kind = (field(k) for k in ("LINES", "LINE_SAMPLES", "SAMPLE_BITS", "SAMPLE_TYPE"))
    if kind != "LSB_INTEGER" or bits != "16" or not lines or lines != samples:
        return None
    return int(lines) * int(samples) * 2


def fetch_image(name: str, dest: Path, size: int) -> int:
    img = dest / f"{name}.img"
    have = img.stat().st_size if img.exists() else 0
    if have < size:
        req = urllib.request.Request(f"{BASE}{name}.img", headers={"Range": f"bytes={have}-"} if have else {})
        with urllib.request.urlopen(req, timeout=60) as r:
            resumed = have > 0 and r.status == 206  # a 200 means the server ignored Range: restart
            with img.open("ab" if resumed else "wb") as f:
                shutil.copyfileobj(r, f, CHUNK)
    return img.stat().st_size


def main() -> int:
    args = parse_args()
    args.dest.mkdir(parents=True, exist_ok=True)
    names = list(dict.fromkeys(args.products))
    for name in names:  # all labels before any image
        fetch_label(name, args.dest)
    bad = False
    for name in names:
        size = expected_size(args.dest / f"{name}.lbl")
        if size is None:
            img = args.dest / f"{name}.img"
            have = img.stat().st_size if img.exists() else 0
            print(f"{name}.img MISMATCH actual={have} expected=- (label is not square 16-bit LSB_INTEGER)")
            bad = True
            continue
        before = (args.dest / f"{name}.img").stat().st_size if (args.dest / f"{name}.img").exists() else 0
        actual = fetch_image(name, args.dest, size)
        status = "ok" if actual == size else "MISMATCH"
        if before == size:
            status = "skipped"
        bad |= status == "MISMATCH"
        print(f"{name}.img {status} actual={actual} expected={size}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
