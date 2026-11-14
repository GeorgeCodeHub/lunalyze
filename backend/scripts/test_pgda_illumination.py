# /// script
# requires-python = ">=3.12"
# dependencies = []
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Tests for the PGDA 69 BigTIFF reader, on a tiny synthetic grid. No network, no real TIFs."""

import math
import struct
import sys
import tempfile
import traceback
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pgda_illumination as pg  # noqa: E402

W, H, T, S = 300, 260, 256, 60.0  # 2x2 tiles, the right column and bottom row padded
X0, Y0 = -W * S / 2, H * S / 2
# Known pixels beyond the base pattern: a Predictor 2 int16 wraparound at a row end, and a nodata cell.
SPECIAL = {(5, 298): -30000, (5, 299): 30000, (100, 100): pg.NODATA, (259, 0): 20000}


def value(r: int, c: int) -> int:
    return SPECIAL.get((r, c), (r * 131 + c * 17) % 25000)


def wrap(v: int) -> int:
    return (v + 32768) % 65536 - 32768


def tile_bytes(tr: int, tc: int, predictor: int) -> bytes:
    px = []
    for r in range(tr * T, (tr + 1) * T):
        row = [value(r, c) if r < H and c < W else 0 for c in range(tc * T, (tc + 1) * T)]
        px += [wrap(v - (row[i - 1] if i else 0)) for i, v in enumerate(row)] if predictor == 2 else row
    return zlib.compress(struct.pack(f"<{T * T}h", *px))


def build(path: Path, compression: int = 8, predictor: int = 2, magic: bytes = b"II+\x00\x08\x00\x00\x00") -> Path:
    buf = bytearray(16)
    tiles = [tile_bytes(tr, tc, predictor) for tr in range(2) for tc in range(2)]
    offsets, counts = [], []
    for t in tiles:
        offsets.append(len(buf)), counts.append(len(t))
        buf += t

    def external(fmt: str, *vals) -> bytes:
        pos = len(buf)
        buf.extend(struct.pack(fmt, *vals))
        return struct.pack("<Q", pos)

    inline = lambda fmt, *v: struct.pack(fmt, *v).ljust(8, b"\0")  # noqa: E731
    entries = [  # (tag, type, count, 8-byte value or offset)
        (256, 16, 1, inline("<Q", W)),
        (257, 16, 1, inline("<Q", H)),
        (258, 3, 1, inline("<H", 16)),
        (259, 3, 1, inline("<H", compression)),
        (277, 3, 1, inline("<H", 1)),
        (317, 3, 1, inline("<H", predictor)),
        (322, 3, 1, inline("<H", T)),
        (323, 3, 1, inline("<H", T)),
        (324, 16, 4, external("<4Q", *offsets)),
        (325, 16, 4, external("<4Q", *counts)),
        (339, 3, 1, inline("<H", 2)),
        (33550, 12, 3, external("<3d", S, S, 0.0)),
        (33922, 12, 6, external("<6d", 0.0, 0.0, 0.0, X0, Y0, 0.0)),
        (42113, 2, 7, b"-32768\0\0"),
    ]
    ifd = len(buf)
    buf += struct.pack("<Q", len(entries)) + b"".join(struct.pack("<HHQ8s", *e) for e in entries) + struct.pack("<Q", 0)
    buf[:16] = magic + struct.pack("<Q", ifd)
    path.write_bytes(bytes(buf))
    return path


def open_tiff(**kw) -> pg.Tiff:
    return pg.Tiff(build(Path(tempfile.mkdtemp(dir=SCRATCH)) / "g.tif", **kw))


def centre(r: int, c: int) -> tuple[float, float]:
    return X0 + (c + 0.5) * S, Y0 - (r + 0.5) * S


def latlon(r: int, c: int) -> tuple[float, float]:
    """Inverse south polar stereographic, independent of the script's to_xy."""
    x, y = centre(r, c)
    return -90 + 2 * math.degrees(math.atan(math.hypot(x, y) / (2 * pg.R))), math.degrees(math.atan2(x, y))


def exits(**kw) -> str:
    try:
        open_tiff(**kw)
    except SystemExit as e:
        return str(e.code)
    raise AssertionError("expected SystemExit")


def test_ifd_parse():
    g = open_tiff()
    assert (g.w, g.h, g.tw, g.th) == (W, H, T, T)
    assert (g.compression, g.predictor) == (8, 2)
    assert g.s == S and g.pixel == (S, S, 0.0)
    assert g.tie == (0.0, 0.0, 0.0, X0, Y0, 0.0) and (g.x0, g.y0) == (X0, Y0)
    assert len(g.offsets) == len(g.counts) == 4


def test_pixel_reads_predictor2():
    g = open_tiff()
    cases = [(0, 0), (0, 255), (7, 100), (5, 297), (5, 298), (5, 299), (258, 299), (259, 0), (259, 255), (256, 256), (100, 256), (200, 43)]
    for r, c in cases:  # tile 0, tile edges, non-zero tiles 1, 2 and 3, last column of a row
        x, y = centre(r, c)
        assert g.dn(x, y) == value(r, c), (r, c, g.dn(x, y), value(r, c))
    assert value(5, 299) == 30000 and value(5, 298) == -30000  # the wraparound case is really exercised


def test_pixel_reads_predictor1():
    g = open_tiff(predictor=1)
    assert g.predictor == 1
    for r, c in [(0, 0), (5, 299), (259, 0), (100, 256)]:
        assert g.dn(*centre(r, c)) == value(r, c)


def test_deflate_adobe_code_accepted():
    assert open_tiff(compression=32946).compression == 32946


def test_corner_origin_mapping():
    g = open_tiff()
    assert g.contains(*centre(0, 0)) and g.contains(*centre(H - 1, W - 1))
    assert not g.contains(X0 - 1, 0) and not g.contains(0, Y0 + 1)
    assert not g.contains(X0 + W * S, 0) and not g.contains(0, Y0 - H * S)
    assert g.dn(X0 + 0.1, Y0 - 0.1) == value(0, 0)  # just inside the top-left corner
    assert g.dn(X0 + 2 * S - 0.1, Y0 - 3 * S + 0.1) == value(2, 1)  # floor: stays in the cell
    assert g.dn(X0 + 2 * S + 0.1, Y0 - 3 * S - 0.1) == value(3, 2)


def test_site_pixel_from_latlon():
    g = open_tiff()
    for r, c in [(130, 150), (3, 280), (258, 10)]:
        lat, lon = latlon(r, c)
        x, y = pg.to_xy(lat, lon)
        assert abs(x - centre(r, c)[0]) < 1e-3 and abs(y - centre(r, c)[1]) < 1e-3
        assert g.dn(x, y) == value(r, c), (r, c)


def test_dn_scaling():
    g = open_tiff()
    r, c = 130, 150
    dn = value(r, c)
    pct, label = pg.sample([g], *latlon(r, c))
    assert 0 < dn < 25000 and abs(pct - dn * 4e-5 * 100) < 1e-9 and label == "85S 60 m"
    assert abs(dn * pg.SCALE * 100 - pct) < 1e-9


def test_scale_constant():
    assert pg.SCALE == 4e-5 and abs(12500 * pg.SCALE * 100 - 50.0) < 1e-9 and pg.NODATA == -32768


def test_nodata_is_error():
    g = open_tiff()
    assert g.dn(*centre(100, 100)) == pg.NODATA
    try:
        pg.sample([g], *latlon(100, 100))
    except ValueError as e:
        assert "nodata" in str(e)
    else:
        raise AssertionError("nodata must raise")


def test_outside_grid_is_error():
    g = open_tiff()
    try:
        pg.sample([g], -80.0, 0.0)  # rho ~ 300 km, far outside the 18 km grid
    except ValueError as e:
        assert "outside" in str(e)
    else:
        raise AssertionError("outside must raise")


def test_falls_through_to_second_grid():
    a, b = open_tiff(), open_tiff()
    a.x0 = 1e9  # nothing falls in the first grid
    pct, label = pg.sample([a, b], *latlon(130, 150))
    assert label == "75S 120 m" and abs(pct - value(130, 150) * 4e-3) < 1e-9


def test_unsupported_compression_exits():
    msg = exits(compression=5)
    assert "compression 5" in msg and "unsupported" in msg


def test_unsupported_predictor_exits():
    msg = exits(predictor=3)
    assert "predictor 3" in msg and "unsupported" in msg


def test_not_bigtiff_exits():
    assert "not a little-endian BigTIFF" in exits(magic=b"II*\x00\x08\x00\x00\x00")


if __name__ == "__main__":
    failed = 0
    with tempfile.TemporaryDirectory() as SCRATCH:
        for name, fn in sorted((n, f) for n, f in globals().items() if n.startswith("test_") and callable(f)):
            try:
                fn()
                print(f"ok   {name}")
            except Exception:
                failed += 1
                print(f"FAIL {name}")
                traceback.print_exc()
    sys.exit(1 if failed else 0)
