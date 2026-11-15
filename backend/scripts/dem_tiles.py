# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy"]
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Cut the LOLA polar DEMs into the static tiles backend/lib/horizon.ts reads for typed coordinates.

Each DEM becomes backend/public/data/dem/<name>/<row>-<col>.bin: TILE x TILE int16 heights (DN, metres = DN * 0.5),
zero-padded past the DEM edge. Each row is stored as differences from the pixel before it (wrapping int16),
low bytes then high bytes, deflated with zlib (RFC 1950). The output is gitignored: run this after download_dems.py.
"""

import argparse
import zlib
from pathlib import Path

import numpy as np
from horizon_masks import default_dem_dir, load_dems, self_check

TILE = 512  # must match TILE in backend/lib/horizon.ts
NAMES = ["ldem_85s_20m", "ldem_80s_80m", "ldem_75s_240m"]  # the order of DEMS in horizon_masks.py


def encode(tile: np.ndarray) -> bytes:
    delta = np.diff(tile.astype(np.int32), axis=1, prepend=0).astype("<i2")  # wraps like int16 addition in TS
    planes = delta.view(np.uint8).reshape(-1, 2)
    return zlib.compress(planes[:, 0].tobytes() + planes[:, 1].tobytes(), 9)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dem", type=Path, help="default: backend/dem of the main checkout")
    p.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "public/data/dem")
    args = p.parse_args()

    dems = load_dems(args.dem or default_dem_dir())
    self_check(dems)
    for name, (a, _) in zip(NAMES, dems, strict=True):
        n = a.shape[0]
        nt = -(-n // TILE)
        out = args.out / name
        out.mkdir(parents=True, exist_ok=True)
        size = 0
        for ty in range(nt):
            for tx in range(nt):
                tile = np.zeros((TILE, TILE), dtype=np.int16)
                part = a[ty * TILE : (ty + 1) * TILE, tx * TILE : (tx + 1) * TILE]
                tile[: part.shape[0], : part.shape[1]] = part
                data = encode(tile)
                (out / f"{ty}-{tx}.bin").write_bytes(data)
                size += len(data)
        print(f"{name}: {nt * nt} tiles, {size / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
