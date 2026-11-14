# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy"]
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Write the south-pole hillshade PNG (cosmetic relief for the polar map) from the 240 m LOLA DEM."""

import argparse
import struct
import sys
import zlib
from pathlib import Path

import numpy as np

from horizon_masks import default_dem_dir

N, SCALE_M = 3812, 240.0
CROP = (370, 3442)  # 3072 px centred on the pole: offset (N-1)/2 = 1905.5 = (370 + 3441) / 2
BLOCK = 3  # 3072 / 3 = 1024 px at 720 m/px; BLOCK = 6 gives the 512 px fallback
HALF_WIDTH_M = 1536 * SCALE_M  # 368640, must equal POLAR_MAP.halfWidthM in backend/lib/projectPolar.ts
MAX_BYTES = 1_048_576


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def hillshade(h: np.ndarray, cell: float) -> np.ndarray:
    """uint8 shade of heights h (row 0 = +y, col 0 = -x) lit from the north-west at 45 degrees."""
    gj, gi = np.gradient(h, cell)
    gx, gy = gi, -gj  # row j runs toward -y, column i toward +x
    n = np.stack([-gx, -gy, np.ones_like(h)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    c = np.cos(np.radians(45))
    light = np.array([-c * np.sqrt(0.5), c * np.sqrt(0.5), np.sin(np.radians(45))])
    return np.round(255 * np.clip(n @ light, 0, 1)).astype(np.uint8)


def encode_png(img: np.ndarray, half_width_m: int) -> bytes:
    """8-bit greyscale PNG with a halfWidthM tEXt chunk, Sub-filtered rows."""
    w = img.shape[0]
    f = np.zeros((w, w + 1), dtype=np.uint8)
    f[:, 0] = 1
    f[:, 1] = img[:, 0]
    f[:, 2:] = img[:, 1:] - img[:, :-1]  # uint8 wraps mod 256, as filter 1 requires
    idat = zlib.compress(f.tobytes(), 9)
    assert len(zlib.decompress(idat)) == w * (w + 1)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, w, 8, 0, 0, 0, 0))
        + chunk(b"tEXt", b"halfWidthM\x00" + str(half_width_m).encode())
        + chunk(b"IDAT", idat)
        + chunk(b"IEND", b"")
    )


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dem", type=Path, help="folder with ldem_75s_240m.img (default: the main checkout's backend/dem)")
    p.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "public/data/map/south-pole-hillshade.png")
    args = p.parse_args()

    path = (args.dem or default_dem_dir()) / "ldem_75s_240m.img"
    if not path.exists() or path.stat().st_size != N * N * 2:
        sys.exit(f"{path} missing or not {N * N * 2} bytes; run backend/scripts/download_dems.py first")
    a = np.memmap(path, dtype="<i2", mode="r", shape=(N, N))
    h = a[CROP[0] : CROP[1], CROP[0] : CROP[1]].astype(np.float64) * 0.5
    w = h.shape[0] // BLOCK
    h = h.reshape(w, BLOCK, w, BLOCK).mean(axis=(1, 3))
    png = encode_png(hillshade(h, SCALE_M * BLOCK), HALF_WIDTH_M)
    if len(png) > MAX_BYTES:
        sys.exit(f"{len(png)} bytes > {MAX_BYTES}: set BLOCK = 6 for the 512 px fallback")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(png)
    print(f"{args.out}: {w}x{w} px, {len(png)} bytes")


if __name__ == "__main__":
    try:
        main()
    except OSError as e:
        sys.exit(f"hillshade: {e}")
