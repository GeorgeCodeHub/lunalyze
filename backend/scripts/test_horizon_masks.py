# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy"]
#
# [tool.uv]
# exclude-newer = "2026-11-07T00:00:00Z"
# ///
"""Tests for horizon_masks.py: synthetic arrays (criteria 7-14, edge cases), then the committed output (1-6, 17). Reads no DEM."""

import json
import sys
import traceback
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402

import horizon_masks as hm  # noqa: E402

DATA = Path(__file__).resolve().parents[1] / "public/data"
DOC = Path(__file__).resolve().parents[2] / "docs/DATA_CONTRACT.md"
R = hm.R


def grid(n, scale, f):
    """int16 DN grid of height function f(x, y) metres; pixel (j, i) is centred at x = (i-off)*scale, y = (off-j)*scale."""
    off = (n - 1) / 2
    x = (np.arange(n) - off) * scale
    y = (off - np.arange(n)) * scale
    return np.rint(f(x[None, :], y[:, None]) / 0.5).astype(np.int16)


def inverse(x, y):
    return -90 + np.degrees(2 * np.arctan(np.hypot(x, y) / (2 * R))), np.degrees(np.arctan2(x, y))


def sites():
    return json.loads((DATA / "sites.json").read_text())


def modeled():
    return [s["id"] for s in sites() if s["terrainModeled"]]


def mask(i):
    return json.loads((DATA / f"masks/{i}.json").read_text())


def approx(a, b, tol):
    assert abs(a - b) <= tol, f"{a} != {b} +- {tol}"


# --- synthetic: criteria 7-14 ---


def test_c07_projection():
    off = 100.0
    x, y = hm.to_xy(-90, 0)
    assert (float(x), float(y)) == (0.0, 0.0)  # pixel (off, off)
    x, y = (float(v) for v in hm.to_xy(-89, 0))
    approx(x / 80, 0, 1e-9)  # sample == off
    assert off - y / 80 < off  # line < off
    approx(y, 30324.1, 0.1)  # rho(-89)
    x, y = (float(v) for v in hm.to_xy(-89, 90))
    assert off + x / 80 > off  # sample > off
    approx(y / 80, 0, 1e-9)  # line == off


def block_az(lat, lon, a_deg):
    """horizon() argmax index for a 500 m square, 1000 m tall, 4250 m from the site along the bearing of azimuth a_deg."""
    n, scale = 2001, 80.0
    off = (n - 1) / 2
    x0, y0 = (float(v) for v in hm.to_xy(lat, lon))
    beta = np.radians(a_deg + lon)
    ci, cj = off + (x0 + 4250 * np.sin(beta)) / scale, off - (y0 + 4250 * np.cos(beta)) / scale
    a = np.zeros((n, n), np.int16)
    a[round(cj) - 3 : round(cj) + 4, round(ci) - 3 : round(ci) + 4] = 2000
    elev, _ = hm.horizon(lat, lon, [((a, scale), 10000.0)])
    return int(np.argmax(elev)), elev


def test_c08_azimuth():
    # 0 = north (away from the pole), 90 = east, 270 = west, at a non-zero longitude, through horizon()
    for a_deg in (0, 90, 270):
        k, elev = block_az(-88.0, 30.0, a_deg)
        assert min((k - a_deg * 2) % 720, (a_deg * 2 - k) % 720) <= 10, (a_deg, k)  # circular distance
        assert elev[k] > 10


def test_c08b_wall_east_at_lon_90():
    n = 1201
    off = (n - 1) / 2
    x0, _ = (float(v) for v in hm.to_xy(-89, 90))  # site at map (+30324, 0); local east is map -y
    ci = round(off + x0 / 80)
    a = np.zeros((n, n), np.int16)
    a[650:657, ci - 6 : ci + 7] = 2000  # y = -4000..-4480 m
    elev, _ = hm.horizon(-89, 90, [((a, 80.0), 10000.0)])
    assert abs(int(np.argmax(elev)) - 180) <= 2, int(np.argmax(elev))
    assert elev[180] > 10 and elev[540] < 0


def test_c09_elevation_formula():
    approx(float(hm.elevation_deg(R, R, 10000 / R)), -0.16489, 1e-5)


def test_c10_flat_dem():
    dem = (np.zeros((401, 401), np.int16), 80.0)
    elev, inc = hm.horizon(-90, 0, [(dem, 10000.0)])
    assert elev.shape == (720,) and inc.shape == (720,)
    assert float(elev.max() - elev.min()) < 1e-9
    assert -0.2 < float(elev[0]) < 0
    assert not inc.any()


def test_c11_wall():
    n = 401
    a = np.zeros((n, n), np.int16)
    a[194:207, 250:257] = 2000  # 1000 m; x = 4000..4480 m, |y| <= 480 m
    elev, inc = hm.horizon(-90, 0, [((a, 80.0), 10000.0)])
    assert abs(int(np.argmax(elev)) - 180) <= 2, int(np.argmax(elev))
    assert elev[180] > 10 and elev[0] < 0
    assert not inc.any()


def test_c12_incomplete():
    dem = (np.zeros((201, 201), np.int16), 80.0)  # half-width 8000 m, corner 11314 m
    _, inc = hm.horizon(-90, 0, [(dem, 12000.0)])
    assert inc.all()
    _, inc = hm.horizon(-90, 0, [(dem, 7000.0)])
    assert not inc.any()


def test_c13_nested_cross_check():
    f = lambda x, y: 500 * np.sin(x / 5000) * np.cos(y / 7000)  # noqa: E731
    d20, d80 = (grid(1000, 20, f), 20.0), (grid(250, 80, f), 80.0)
    g = np.random.default_rng(0)
    x, y = g.uniform(-9000, 9000, 200), g.uniform(-9000, 9000, 200)
    (h20, in20), (h80, in80) = hm.sample(d20, x, y), hm.sample(d80, x, y)
    assert in20.all() and in80.all()
    assert float(np.abs(h20 - h80).max()) < 0.5


def test_c14_crop():
    a = (3 * np.arange(600)[None, :] - np.arange(600)[:, None]).astype(np.int16)
    d240 = (np.zeros((100, 100), np.int16), 240.0)
    crop, ox, oy = hm.terrain_crop(-90, 0, (a, 80.0), d240)
    assert crop.shape == (500, 500) and crop.dtype == np.int16
    assert int(crop[0, 0]) == int(a[50, 50]) == 100
    assert (ox, oy) == (-19960.0, 19960.0)
    # site at x = 20040, y = 0: crop column 0 is DEM column 301
    lat, lon = (float(v) for v in inverse(20040.0, 0.0))
    crop, ox, oy = hm.terrain_crop(lat, lon, (a, 80.0), (np.full((100, 100), 777, np.int16), 240.0))
    assert (crop[:, 299:] == 777).all() and crop[:, 299:].size == 100500
    assert (crop[:, :299] == a[50:550, 301:600]).all()
    assert ox == (301 - 299.5) * 80 and oy == 19960.0
    # site at x = 20040, y = 10000: crop rows 0..74 lie above the 80 m DEM; the 240 m DEM has DN = its row
    lat, lon = (float(v) for v in inverse(20040.0, 10000.0))
    d240 = (np.repeat(np.arange(600, dtype=np.int16)[:, None], 600, axis=1), 240.0)
    crop, ox, oy = hm.terrain_crop(lat, lon, (a, 80.0), d240)
    assert oy == (299.5 + 75) * 80
    assert (int(crop[0, 499]), int(crop[74, 499])) == (175, 199)  # row 0: y = 29960 m, row 74: y = 24040 m
    assert (crop[75:, :299] == a[0:425, 301:600]).all()


# --- synthetic edge cases ---


def test_edge_sample_last_pixel():
    a = np.arange(16, dtype=np.int16).reshape(4, 4)
    off = 1.5
    h, ok = hm.sample((a, 10.0), np.array([off * 10, off * 10 + 0.1]), np.array([-off * 10, -off * 10]))  # bottom-right pixel, then 0.1 m past it
    assert ok.tolist() == [True, False] and float(h[0]) == 15 * 0.5
    h, ok = hm.sample((a, 10.0), np.array([-off * 10]), np.array([off * 10]))  # top-left pixel
    assert ok.tolist() == [True] and float(h[0]) == 0.0


def test_edge_observer_and_ray_fallback():
    fine = (np.zeros((11, 11), np.int16), 20.0)  # site is outside this DEM
    coarse = (np.full((401, 401), 200, np.int16), 80.0)  # 100 m everywhere
    h = hm._sample_from([(fine, 1.0), (coarse, 1.0)], 0, np.array([5000.0]), np.array([5000.0]))
    assert h.tolist() == [100.0]
    elev, inc = hm.horizon(-89.9, 0, [(fine, 100.0), (coarse, 10000.0)])
    assert np.isfinite(elev).all() and not inc.any()


def test_edge_near_field_20m_sampling():
    n = 200  # even N: pixel centres sit at y = 40 + 80m, so a 2-pixel spike is centred on (x=0, y=1000)
    a = np.zeros((n, n), np.int16)
    a[87, 99:101] = 2000  # 1000 m tall; 80 m samples at 960 / 1040 m read half of it by bilinear
    elev, _ = hm.horizon(-90, 0, [((a, 80.0), 3000.0)])
    theta = 2 * np.arctan(1000 / (2 * R))
    approx(float(elev[0]), float(hm.elevation_deg(R + 2, R + 1000, theta)), 0.01)  # the 20 m sample at 1000 m reads full height


# --- committed output: criteria 1-6, 17 ---


def test_c01_mask_files():
    got = sorted(p.stem for p in (DATA / "masks").glob("*.json"))
    assert got == sorted(modeled()) and len(got) == 11
    assert "apollo-11" not in got and "change-4" not in got


def test_c02_mask_shape():
    for i in modeled():
        m = mask(i)
        assert list(m) == ["siteId", "mastM", "azStepDeg", "elevDeg", "incomplete"], i
        assert m["siteId"] == i and m["mastM"] == 2 and m["azStepDeg"] == 0.5
        assert len(m["elevDeg"]) == 720 and len(m["incomplete"]) == 720
        assert all(np.isfinite(v) and round(v, 3) == v for v in m["elevDeg"]), i
        assert all(isinstance(b, bool) for b in m["incomplete"]), i


def test_c03_elev_range():
    for i in modeled():
        e = mask(i)["elevDeg"]
        assert -6 <= min(e) and max(e) <= 30, (i, min(e), max(e))


def test_c04_incomplete_flags():
    for i in modeled():
        n = sum(mask(i)["incomplete"])
        if i == "im-1":
            assert 0 < n < 720, n
        else:
            assert n == 0, (i, n)


def test_c05_terrain_files():
    ids = sorted(modeled())
    assert sorted(p.stem for p in (DATA / "terrain").glob("*.bin")) == ids
    assert sorted(p.stem for p in (DATA / "terrain").glob("*.json")) == ids
    for i in ids:
        assert (DATA / f"terrain/{i}.bin").stat().st_size == 500_000, i


def test_c06_terrain_json():
    for i in modeled():
        t = json.loads((DATA / f"terrain/{i}.json").read_text())
        assert t["siteId"] == i and (t["width"], t["height"], t["pixelM"]) == (500, 500, 80), i
        assert list(t["origin"]) == ["x", "y"] and all(np.isfinite(v) for v in t["origin"].values()), i


def test_c17_doc_line():
    line = DOC.read_text().splitlines()[110]
    assert "origin" in line and "first pixel" in line and "+x toward 90°E" in line and "+y toward 0°" in line


# --- committed output: edge cases ---


def test_edge_output_json_clean():
    bad = {"-0.0", "NaN", "Infinity", "-Infinity"}
    for p in [*(DATA / "masks").glob("*.json"), *(DATA / "terrain").glob("*.json")]:
        json.loads(p.read_text(), parse_constant=lambda c: (_ for _ in ()).throw(AssertionError(f"{p.name}: {c}")))
        assert not bad & set(p.read_text().replace("[", ",").replace("]", ",").replace("{", ",").replace(":", ",").split(",")), p.name


def test_edge_crop_matches_site_pixel():
    for s in sites():
        if not s["terrainModeled"]:
            continue
        t = json.loads((DATA / f"terrain/{s['id']}.json").read_text())["origin"]
        x, y = (float(v) for v in hm.to_xy(s["lat"], s["lon"]))
        c, r = (x - t["x"]) / 80, (t["y"] - y) / 80
        assert 248.9 <= c <= 250.1 and 248.9 <= r <= 250.1, (s["id"], c, r)  # site sits at the crop centre


def main() -> None:
    failed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"ok   {name}")
            except Exception:
                failed += 1
                print(f"FAIL {name}\n{traceback.format_exc()}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
