"""False Floor v3 · maps, technical diagrams and evidence photo moves (M_MAP_*, M_CAMERAS, M_STOPWATCH, M_TURIN,
M_FIELD, M_SENSORS, M_ROUTE_E19, M_LINK, E_*). Built on tools/mglib.py so every clip shares the film's look.

    python3 tools/mg_maps.py M_MAP_ANTWERP          # render one clip -> out/clips/M_MAP_ANTWERP.mkv
    python3 tools/mg_maps.py all                    # every M_* clip of this file
    python3 tools/mg_maps.py E_CENTRAAL             # photo move from assets/evidence/ + credits.json
    python3 tools/mg_maps.py prep                   # rebuild assets/mapdata/*.json from the raw downloads
    python3 tools/mg_maps.py M_MAP_ANTWERP --still 0.2 0.9   # write test PNGs instead of the clip

Needs: numpy, Pillow, skia-python (anti-aliased vector drawing), opencv-python-headless (photo parallax).
`prep` also needs pyshp + shapely and the raw data (downloaded to ~/.cache/mg_maps if missing).

Map data (see assets/mapdata/LICENCE.txt):
  * Natural Earth 1:10m (public domain) — countries, provinces, lakes, rivers, roads, places, airports.
  * OpenStreetMap (ODbL) — Antwerp diamond district streets/buildings/rail/cameras/bollards and the Scheldt;
    clips that show OSM data carry the on-screen credit "© OpenStreetMap contributors".
Projection: spherical Lambert azimuthal equal-area centred on 50°N 5°E, metres (Belgium ≈ undistorted).
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mglib as G  # noqa: E402

FF = G.FF
MAPDATA = os.path.join(FF, 'assets', 'mapdata')
EVID = os.path.join(FF, 'assets', 'evidence')
RAW = os.path.expanduser(os.environ.get('MG_MAPS_RAW', '~/.cache/mg_maps'))
OSM_CREDIT = '© OpenStreetMap contributors'

# ----------------------------------------------------------------------------------------------------- projection
R_EARTH = 6371008.8
LAT0, LON0 = math.radians(50.0), math.radians(5.0)


def proj(lon, lat):
    """lon/lat degrees (scalars or arrays) -> LAEA metres (x east, y north)."""
    lon = np.radians(np.asarray(lon, float)) - LON0
    lat = np.radians(np.asarray(lat, float))
    k = np.sqrt(2.0 / (1.0 + math.sin(LAT0) * np.sin(lat) + math.cos(LAT0) * np.cos(lat) * np.cos(lon)))
    x = R_EARTH * k * np.cos(lat) * np.sin(lon)
    y = R_EARTH * k * (math.cos(LAT0) * np.sin(lat) - math.sin(LAT0) * np.cos(lat) * np.cos(lon))
    return x, y


def P(lon, lat):
    x, y = proj(lon, lat)
    return float(x), float(y)


# ----------------------------------------------------------------------------------------------------- data prep
NE_FILES = {
    'countries': 'cultural/ne_10m_admin_0_countries', 'provinces': 'cultural/ne_10m_admin_1_states_provinces',
    'places': 'cultural/ne_10m_populated_places_simple', 'roads': 'cultural/ne_10m_roads',
    'airports': 'cultural/ne_10m_airports', 'rivers': 'physical/ne_10m_rivers_lake_centerlines',
    'rivers_eu': 'physical/ne_10m_rivers_europe', 'lakes': 'physical/ne_10m_lakes',
}
OSM_BBOXES = {'district.osm': '4.4100,51.2120,4.4260,51.2210', 'district_s.osm': '4.4100,51.2060,4.4260,51.2120',
              'district_w.osm': '4.4020,51.2060,4.4100,51.2210', 'district_e.osm': '4.4260,51.2060,4.4340,51.2210',
              'district_n.osm': '4.4020,51.2210,4.4340,51.2250'}
UA = {'User-Agent': 'mg-maps/1.0 (documentary graphics)'}


def _fetch(url, path):
    import urllib.request
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r, open(path, 'wb') as f:
        f.write(r.read())


def _ne_path(key):
    rel = NE_FILES[key]
    name = os.path.basename(rel)
    shp = os.path.join(RAW, 'ne', name, name + '.shp')
    if not os.path.exists(shp):
        import zipfile
        z = os.path.join(RAW, 'ne', name + '.zip')
        _fetch(f'https://naciscdn.org/naturalearth/10m/{rel}.zip', z)
        zipfile.ZipFile(z).extractall(os.path.join(RAW, 'ne', name))
        os.remove(z)
    return shp


def _rings_of(geom):
    """shapely (Multi)Polygon -> list of exterior+interior rings as [[x, y], ...] (rounded metres)."""
    out = []
    polys = getattr(geom, 'geoms', [geom])
    for p in polys:
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        for ring in [p.exterior] + list(p.interiors):
            c = np.round(np.asarray(ring.coords), 0).astype(int).tolist()
            if len(c) >= 4:
                out.append(c)
    return out


def _lines_of(geom):
    out = []
    for g in getattr(geom, 'geoms', [geom]):
        if g.is_empty:
            continue
        if g.geom_type == 'LineString':
            out.append(np.round(np.asarray(g.coords), 0).astype(int).tolist())
    return out


def _projected(shape_geom):
    from shapely.ops import transform
    return transform(lambda x, y, z=None: proj(x, y), shape_geom)


def prep_ne():
    import shapefile
    from shapely.geometry import box, shape
    europe = box(-26, 26, 50, 72)
    data = {'proj': 'LAEA sphere lat0=50 lon0=5 (m)', 'source': 'Natural Earth 1:10m, public domain'}

    # countries, 3 levels of detail (tolerance metres)
    lods = {'0': 120, '1': 900, '2': 4000}
    countries = []
    for sr in shapefile.Reader(_ne_path('countries'), encoding='utf-8').iterShapeRecords():
        g = shape(sr.shape.__geo_interface__)
        if not g.intersects(europe):
            continue
        g = _projected(g.intersection(europe))
        rec = sr.record.as_dict()
        c = {'iso': rec['ADM0_A3'], 'name': rec['NAME'], 'lod': {}}
        for k, tol in lods.items():
            c['lod'][k] = _rings_of(g.simplify(tol, preserve_topology=True))
        countries.append(c)
    data['countries'] = countries

    prov = []
    for sr in shapefile.Reader(_ne_path('provinces'), encoding='utf-8').iterShapeRecords():
        rec = sr.record.as_dict()
        if rec['adm0_a3'] not in ('BEL',):
            continue
        g = _projected(shape(sr.shape.__geo_interface__)).simplify(120, preserve_topology=True)
        prov.append({'name': rec['name'], 'rings': _rings_of(g)})
    data['provinces_bel'] = prov

    lakes = []
    for sr in shapefile.Reader(_ne_path('lakes'), encoding='utf-8').iterShapeRecords():
        g = shape(sr.shape.__geo_interface__)
        rec = sr.record.as_dict()
        if not g.intersects(europe) or (rec.get('scalerank') or 99) > 8:
            continue
        g = _projected(g.intersection(europe)).simplify(150, preserve_topology=True)
        lakes.append({'name': rec.get('name'), 'rings': _rings_of(g)})
    data['lakes'] = lakes

    rivers = []
    for key in ('rivers', 'rivers_eu'):
        for sr in shapefile.Reader(_ne_path(key), encoding='utf-8').iterShapeRecords():
            g = shape(sr.shape.__geo_interface__)
            rec = sr.record.as_dict()
            sc = rec.get('scalerank') or 99
            if not g.intersects(europe) or sc > (9 if key == 'rivers' else 8):
                continue
            g = _projected(g.intersection(europe)).simplify(120)
            rivers.append({'name': rec.get('name'), 'rank': sc, 'lines': _lines_of(g)})
    data['rivers'] = rivers

    roads = []
    be = box(2.4, 49.4, 6.5, 51.6)
    for sr in shapefile.Reader(_ne_path('roads'), encoding='utf-8').iterShapeRecords():
        g = shape(sr.shape.__geo_interface__)
        rec = sr.record.as_dict()
        if not g.intersects(be) or rec['type'] not in ('Major Highway', 'Secondary Highway'):
            continue
        g = _projected(g.intersection(be))
        roads.append({'label': rec['label'], 'label2': rec['label2'], 'rank': rec['scalerank'], 'lines': _lines_of(g)})
    data['roads_be'] = roads

    places = {}
    want = {'Antwerpen': 'Antwerp', 'Brussels': 'Brussels', 'Turin': 'Turin', 'Milan': 'Milan', 'Paris': 'Paris',
            'Amsterdam': 'Amsterdam', 'London': 'London', 'Berlin': 'Berlin', 'Rome': 'Rome', 'Geneva': 'Geneva',
            'Mechelen': 'Mechelen', 'Ghent': 'Ghent', 'Luxembourg': 'Luxembourg', 'Cologne': 'Cologne',
            'Frankfurt': 'Frankfurt', 'Zürich': 'Zurich', 'Lyon': 'Lyon', 'Rotterdam': 'Rotterdam', 'Liège': 'Liege',
            'Munich': 'Munich', 'Genoa': 'Genoa', 'Marseille': 'Marseille', 'Madrid': 'Madrid', 'Vienna': 'Vienna'}
    for sr in shapefile.Reader(_ne_path('places'), encoding='utf-8').iterShapeRecords():
        rec = sr.record.as_dict()
        for k in ('name', 'nameascii'):
            nm = rec.get(k)
            if nm in want and want[nm] not in places and rec['latitude'] > 35 and -12 < rec['longitude'] < 20:
                places[want[nm]] = {'lonlat': [rec['longitude'], rec['latitude']], 'xy': list(P(rec['longitude'], rec['latitude'])),
                                    'pop': rec.get('pop_max')}
    data['places'] = places

    airports = {}
    for sr in shapefile.Reader(_ne_path('airports'), encoding='utf-8').iterShapeRecords():
        rec = sr.record.as_dict()
        if rec.get('iata_code') in ('CDG', 'MXP', 'BRU', 'TRN', 'LIN', 'ANR'):
            lon, lat = sr.shape.points[0]
            airports[rec['iata_code']] = {'name': rec['name'], 'lonlat': [lon, lat], 'xy': list(P(lon, lat))}
    data['airports'] = airports
    path = os.path.join(MAPDATA, 'ne_europe.json')
    json.dump(data, open(path, 'w'), separators=(',', ':'))
    print('[prep] wrote', path, os.path.getsize(path) // 1024, 'KB')


def _parse_osm(paths):
    import xml.etree.ElementTree as ET
    nodes, ntags, ways, rels = {}, {}, {}, {}
    for p in paths:
        root = ET.parse(p).getroot()
        for n in root.iter('node'):
            nodes[n.get('id')] = (float(n.get('lon')), float(n.get('lat')))
            tg = {c.get('k'): c.get('v') for c in n.iter('tag')}
            if tg:
                ntags[n.get('id')] = tg
        for w in root.iter('way'):
            ways[w.get('id')] = ({c.get('k'): c.get('v') for c in w.iter('tag')}, [x.get('ref') for x in w.iter('nd')])
        for r in root.iter('relation'):
            rels[r.get('id')] = ({c.get('k'): c.get('v') for c in r.iter('tag')},
                                 [(m.get('type'), m.get('ref'), m.get('role')) for m in r.iter('member')])
    return nodes, ntags, ways, rels


def prep_osm():
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    paths = []
    for fn, bbox in OSM_BBOXES.items():
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            _fetch(f'https://api.openstreetmap.org/api/0.6/map?bbox={bbox}', p)
        paths.append(p)
    nodes, ntags, ways, rels = _parse_osm(paths)

    def xy(refs):
        pts = [nodes[r] for r in refs if r in nodes]
        if not pts:
            return []
        x, y = proj([p[0] for p in pts], [p[1] for p in pts])
        return np.round(np.stack([x, y], 1), 1).tolist()

    d = {'source': 'OpenStreetMap contributors, ODbL 1.0 (api.openstreetmap.org, downloaded 2026-11-10)',
         'bbox': list(OSM_BBOXES.values()), 'streets': [], 'buildings': [], 'rail': [], 'platforms': [], 'green': [],
         'water': [], 'cameras': [], 'bollards': [], 'gates': []}
    # multipolygon members to treat as buildings / green
    rel_outer = {}
    for rid, (tg, mem) in rels.items():
        if tg.get('type') == 'multipolygon':
            for typ, ref, role in mem:
                if typ == 'way' and role == 'outer':
                    rel_outer[ref] = tg
    for wid, (tg, refs) in ways.items():
        if wid in rel_outer and not tg:
            tg = dict(rel_outer[wid])
        pts = xy(refs)
        if len(pts) < 2:
            continue
        hw = tg.get('highway')
        if hw and tg.get('area') != 'yes' and hw not in ('steps', 'corridor', 'platform', 'construction', 'proposed'):
            d['streets'].append({'id': wid, 'name': tg.get('name', ''), 'cls': hw, 'layer': int(tg.get('layer', 0) or 0)
                                 if tg.get('layer', '0').lstrip('-').isdigit() else 0, 'tunnel': tg.get('tunnel'), 'pts': pts})
        elif hw and tg.get('area') == 'yes':
            d['platforms'].append({'kind': 'plaza', 'pts': pts})
        if 'building' in tg and refs[0] == refs[-1]:
            d['buildings'].append({'id': wid, 'street': tg.get('addr:street', ''), 'num': tg.get('addr:housenumber', ''),
                                   'name': tg.get('name', ''), 'kind': tg.get('building'), 'levels': tg.get('building:levels'),
                                   'pts': pts})
        if tg.get('railway') in ('rail', 'disused'):
            lay = tg.get('layer', '0')
            d['rail'].append({'layer': int(lay) if lay.lstrip('-').isdigit() else 0, 'service': tg.get('service'),
                              'tunnel': tg.get('tunnel'), 'pts': pts})
        if tg.get('railway') == 'platform' or tg.get('public_transport') == 'platform':
            if refs[0] == refs[-1]:
                d['platforms'].append({'kind': 'rail', 'pts': pts})
        if refs[0] == refs[-1] and (tg.get('leisure') in ('park', 'garden') or tg.get('landuse') in ('grass', 'forest', 'village_green')
                                    or tg.get('natural') in ('wood',)):
            d['green'].append({'pts': pts})
        if refs[0] == refs[-1] and tg.get('natural') == 'water':
            d['water'].append({'pts': pts})
    for nid, tg in ntags.items():
        lon, lat = nodes[nid]
        x, y = P(lon, lat)
        if tg.get('man_made') == 'surveillance' and tg.get('surveillance:type', 'camera') == 'camera':
            dr = tg.get('camera:direction') or tg.get('direction')
            d['cameras'].append({'xy': [round(x, 1), round(y, 1)], 'dir': float(dr) if dr and dr.replace('.', '').isdigit() else None,
                                 'type': tg.get('camera:type'), 'mount': tg.get('camera:mount'), 'op': tg.get('operator', '')})
        if tg.get('barrier') == 'bollard':
            d['bollards'].append({'xy': [round(x, 1), round(y, 1)], 'kind': tg.get('bollard')})
        if tg.get('barrier') in ('lift_gate', 'gate'):
            d['gates'].append({'xy': [round(x, 1), round(y, 1)], 'kind': tg.get('barrier')})

    # diamond district outline: closing of the buildings addressed on Hoveniersstraat / Schupstraat / Rijfstraat
    # plus the west side of Pelikaanstraat between Rijfstraat and the station's south end.
    core = []
    for b in d['buildings']:
        c = np.mean(np.asarray(b['pts']), 0)
        lon_c = None
        if b['street'] in ('Hoveniersstraat', 'Schupstraat', 'Rijfstraat'):
            core.append(Polygon(b['pts']))
        elif b['street'] == 'Pelikaanstraat':
            # west side, Rijfstraat (north) to Schupstraat latitude (south)
            yN, yS = P(4.4195, 51.21620)[1], P(4.4195, 51.21400)[1]
            xE = P(4.42045, 51.2150)[0]
            if yS < c[1] < yN and c[0] < xE:
                core.append(Polygon(b['pts']))
    u = unary_union([p.buffer(0) for p in core])
    outline = u.buffer(14, join_style=1).buffer(-9, join_style=1).simplify(1.5)
    if outline.geom_type == 'MultiPolygon':
        outline = max(outline.geoms, key=lambda g: g.area)
    d['district'] = np.round(np.asarray(outline.exterior.coords), 1).tolist()
    adc = [Polygon(b['pts']) for b in d['buildings'] if b['street'] == 'Schupstraat' and b['num'] in ('9', '11')]
    d['adc'] = np.round(np.asarray(unary_union(adc).buffer(0.5, join_style=2).simplify(0.3).exterior.coords), 1).tolist()
    st = [b for b in d['buildings'] if b['name'] == 'Centraal Station' or b['kind'] == 'train_station']
    d['station'] = [b['pts'] for b in st]

    # Scheldt water pieces (walked via api.openstreetmap.org way/node calls)
    sp = os.path.join(RAW, 'scheldt_pieces.json')
    if os.path.exists(sp):
        pieces = json.load(open(sp))
        polys = []
        for v in pieces.values():
            x, y = proj([p[0] for p in v['pts']], [p[1] for p in v['pts']])
            polys.append(Polygon(np.stack([x, y], 1)).buffer(0))
        sch = unary_union([p.buffer(2) for p in polys]).buffer(-2).simplify(4)
        d['scheldt'] = _rings_of(sch)
        from shapely.geometry import box as _box
        tiles = []
        x0, y0, x1, y1 = sch.bounds
        for gx in np.arange(x0 - x0 % 1000, x1, 1000):
            for gy in np.arange(y0 - y0 % 1000, y1, 1000):
                part = sch.intersection(_box(gx - 1.5, gy - 1.5, gx + 1001.5, gy + 1001.5))   # 1.5 m overlap: no seams
                tiles += _rings_of(part)
        d['scheldt_tiles'] = tiles

    # A1 / E19 motorway Antwerp -> Brussels (OSM relation 86463, one carriageway chained north -> south)
    a1 = os.path.join(RAW, 'a1_full.osm')
    if not os.path.exists(a1):
        _fetch('https://api.openstreetmap.org/api/0.6/relation/86463/full', a1)
    an, _, aw, ar = _parse_osm([a1])
    import heapq
    adj = {}
    for wid, (tg, refs) in aw.items():
        if tg.get('highway') != 'motorway':
            continue
        for a, b in zip(refs, refs[1:]):
            dd = math.dist(an[a], an[b])
            adj.setdefault(a, []).append((b, dd))
            adj.setdefault(b, []).append((a, dd))      # undirected: the relation lists one carriageway

    def nearest(lon, lat, among):
        return min(among, key=lambda r: (an[r][0] - lon) ** 2 + ((an[r][1] - lat) * 1.6) ** 2)
    dst = nearest(4.47, 50.90, adj)                            # Brussels ring end
    comp, st = {dst}, [dst]                                    # its carriageway (connected component)
    while st:
        for v, _ in adj[st.pop()]:
            if v not in comp:
                comp.add(v)
                st.append(v)
    src = nearest(4.413, 51.192, comp)                         # Antwerp south end (where the A1 leaves the ring)
    dist, prev, pq = {src: 0.0}, {}, [(0.0, src)]
    while pq:
        dcur, u = heapq.heappop(pq)
        if u == dst:
            break
        if dcur > dist.get(u, 1e9):
            continue
        for v, w in adj[u]:
            if dcur + w < dist.get(v, 1e9):
                dist[v], prev[v] = dcur + w, u
                heapq.heappush(pq, (dcur + w, v))
    chain, u = [dst], dst
    while u != src:
        u = prev[u]
        chain.append(u)
    chain.reverse()
    ll = np.array([an[r] for r in chain])
    x, y = proj(ll[:, 0], ll[:, 1])
    d['a1'] = np.round(np.stack([x, y], 1), 1).tolist()
    d['a1_lat'] = [round(float(v), 5) for v in ll[:, 1]]
    print('[prep] A1 chain', len(chain), 'nodes', ll[0], '->', ll[-1])
    path = os.path.join(MAPDATA, 'osm_antwerp.json')
    json.dump(d, open(path, 'w'), separators=(',', ':'))
    print('[prep] wrote', path, os.path.getsize(path) // 1024, 'KB', {k: len(v) for k, v in d.items() if isinstance(v, list)})


_DATA = {}


def data(name):
    if name not in _DATA:
        _DATA[name] = json.load(open(os.path.join(MAPDATA, name + '.json')))
    return _DATA[name]




# ===================================================================================================== engine
import skia  # noqa: E402

W2, H2, SS, FPS = G.W2, G.H2, G.SS, G.FPS
OCEAN = (8, 9, 12)
LAND = (27, 28, 32)
LAND_HI = (38, 39, 44)
BORDER = (70, 73, 80)
RIVER = (40, 52, 64)
WATER = (12, 15, 20)
ROADC = (84, 86, 92)
STREET = (46, 48, 54)
BLDG = (29, 30, 35)
BLDG_EDGE = (50, 52, 58)
GREEN = (23, 30, 27)
RAILC = (128, 133, 141)
SCRATCH = os.environ.get('MG_MAPS_STILLS', os.path.join(__import__('tempfile').gettempdir(), 'mg_maps_stills'))


def lerp(a, b, t):
    return a + (b - a) * t


def sg(t, a, b):
    """0..1 progress of t from a to b, clamped; works for descending ranges too (a > b)."""
    if a == b:
        return 1.0 if t >= b else 0.0
    return max(0.0, min(1.0, (t - a) / (b - a)))


def fade(t, a, b, c=None, d=None):
    """0..1 envelope: eased rise over [a, b], eased fall over [c, d] (seconds or any unit)."""
    v = G.ease(sg(t, a, b))
    if c is not None:
        v *= 1 - G.ease(sg(t, c, d))
    return v


def build_in(t, start, frames=10):
    """element build-on: 0..1 over `frames` frames starting at `start` seconds (ease-out)."""
    return G.ease_out(sg(t, start, start + frames / FPS))


def pchip(xs, ys):
    """monotone cubic interpolation (Fritsch-Carlson); returns f(x) clamped to the end values."""
    xs, ys = np.asarray(xs, float), np.asarray(ys, float)
    h = np.diff(xs)
    dlt = np.diff(ys) / h
    m = np.zeros_like(ys)
    m[0], m[-1] = dlt[0], dlt[-1]
    for k in range(1, len(xs) - 1):
        if dlt[k - 1] * dlt[k] <= 0:
            m[k] = 0
        else:
            w1, w2 = 2 * h[k] + h[k - 1], h[k] + 2 * h[k - 1]
            m[k] = (w1 + w2) / (w1 / dlt[k - 1] + w2 / dlt[k])

    def f(x):
        x = min(max(x, xs[0]), xs[-1])
        k = min(np.searchsorted(xs, x, side='right') - 1, len(xs) - 2)
        t = (x - xs[k]) / h[k]
        h00, h10, h01, h11 = 2 * t ** 3 - 3 * t ** 2 + 1, t ** 3 - 2 * t ** 2 + t, -2 * t ** 3 + 3 * t ** 2, t ** 3 - t ** 2
        return h00 * ys[k] + h10 * h[k] * m[k] + h01 * ys[k + 1] + h11 * h[k] * m[k + 1]
    return f


class ZoomPath:
    """camera path through keyframes (t_seconds, width_m, (cx, cy)): log-width is a monotone cubic in time, the
    centre is linear in width between keys (= zooming about the fixed point the two keys share)."""

    def __init__(self, keys):
        self.keys = keys
        self.lw = pchip([k[0] for k in keys], [math.log(k[1]) for k in keys])

    def __call__(self, ts):
        w = math.exp(self.lw(ts))
        ks = self.keys
        for (t0, w0, c0), (t1, w1, c1) in zip(ks, ks[1:]):
            if ts <= t1 or (t0, w0, c0) == ks[-2]:
                a = 0.0 if abs(w1 - w0) < 1e-9 else (w - w0) / (w1 - w0)
                if abs(w1 - w0) / max(w0, w1) < 0.35:      # a hold: pan in time instead of in width
                    a = G.ease(sg(ts, t0, t1))
                a = min(max(a, 0.0), 1.0)
                return w, (lerp(c0[0], c1[0], a), lerp(c0[1], c1[1], a))
        return w, ks[-1][2]


class View:
    """world (LAEA metres) -> 2x screen pixels. width = metres across the frame at the centre; rot in degrees
    (screen, counter-clockwise); pitch in degrees (top of frame tilts away); geometry is passed in local coordinates
    (world minus `origin`) so float32 precision holds at street level."""

    def __init__(self, cx, cy, width, rot=0.0, pitch=0.0, origin=(0.0, 0.0), f=1.3):
        self.cx, self.cy, self.width, self.rot, self.pitch = cx, cy, width, rot, pitch
        self.ox, self.oy = origin
        self.s = W2 / width
        self.f = f * W2
        s, r, p = self.s, math.radians(rot), math.radians(pitch)
        T = np.array([[1, 0, self.ox - cx], [0, 1, self.oy - cy], [0, 0, 1]], float)
        S = np.array([[s, 0, 0], [0, -s, 0], [0, 0, 1]], float)
        Rm = np.array([[math.cos(r), math.sin(r), 0], [-math.sin(r), math.cos(r), 0], [0, 0, 1]], float)
        sp, fp = math.sin(p), self.f
        Pm = np.array([[1, -(W2 / 2) * sp / fp, W2 / 2], [0, math.cos(p) - (H2 / 2) * sp / fp, H2 / 2], [0, -sp / fp, 1]], float)
        self.M = Pm @ Rm @ S @ T
        m = skia.Matrix()
        m.setAll(*[float(v) for v in self.M.flatten()])
        self.sk = m

    def local(self, x, y):
        return np.asarray(x, float) - self.ox, np.asarray(y, float) - self.oy

    def px(self, x, y):
        """world -> screen (2x px); arrays ok."""
        lx, ly = self.local(x, y)
        h = self.M @ np.stack([np.ravel(lx), np.ravel(ly), np.ones(np.size(lx))])
        return (h[0] / h[2]).reshape(np.shape(lx)), (h[1] / h[2]).reshape(np.shape(lx))

    def w(self, x, y):
        lx, ly = self.local(x, y)
        return self.M[2, 0] * lx + self.M[2, 1] * ly + self.M[2, 2]

    def scale_at(self, x, y):
        """screen px per metre at a world point (perspective-aware, approx)."""
        return self.s / max(1e-6, float(self.w(x, y)))

    def wrange(self, path):
        """(min, max) homogeneous w over the path's bounds (w <= 0: behind the camera)."""
        if self.pitch == 0:
            return 1.0, 1.0
        b = path.getBounds()
        ws = [self.M[2, 0] * x + self.M[2, 1] * y + self.M[2, 2] for x in (b.left(), b.right()) for y in (b.top(), b.bottom())]
        return min(ws), max(ws)


def sk_color(c, a=1.0):
    return skia.Color4f(c[0] / 255.0, c[1] / 255.0, c[2] / 255.0, max(0.0, min(1.0, a)))


def rings_path(rings, origin=(0, 0)):
    p = skia.Path()
    p.setFillType(skia.PathFillType.kEvenOdd)
    ox, oy = origin
    for r in rings:
        if len(r) >= 3:
            p.addPoly([skia.Point(x - ox, y - oy) for x, y in r], True)
    return p


def _chunks(rings, n):
    """split rings into overlapping polyline pieces of n points (for tiled outlines)."""
    out = []
    for r in rings:
        for k in range(0, len(r) - 1, n):
            out.append(r[k:k + n + 1])
    return out


class Tiles:
    """a layer split into spatial tiles (features binned by centroid) so a pitched camera can drop the tiles that are
    behind it / far below the frame instead of the whole layer."""

    def __init__(self, items, origin=(0, 0), closed=True, cell=300.0):
        bins = {}
        for pts in items:
            if len(pts) < 2:
                continue
            c = np.mean(np.asarray(pts, float), 0)
            bins.setdefault((int((c[0] - origin[0]) // cell), int((c[1] - origin[1]) // cell)), []).append(pts)
        mk = rings_path if closed else lines_path
        self.paths = [mk(v, origin) for v in bins.values()]


def lines_path(lines, origin=(0, 0)):
    p = skia.Path()
    ox, oy = origin
    for ln in lines:
        if len(ln) >= 2:
            p.addPoly([skia.Point(x - ox, y - oy) for x, y in ln], False)
    return p


class Frame:
    """one 2x frame: a skia canvas over a numpy RGBA buffer, then PIL for type."""

    def __init__(self):
        self.arr = np.zeros((H2, W2, 4), np.uint8)
        self.surf = skia.Surface(self.arr)
        self.c = self.surf.getCanvas()
        self.warned = set()

    def clear(self, color):
        self.c.resetMatrix()
        self.c.clear(sk_color(color))

    def begin(self, view):
        self.view = view
        self.c.resetMatrix()
        self.c.setMatrix(view.sk)

    def screen(self):
        self.c.resetMatrix()

    def _paint(self, color, alpha, stroke=None, glow=0, cap='round', dash=None, trim=None, blend=None, world=True):
        p = skia.Paint(AntiAlias=True, Color4f=sk_color(color, alpha))
        k = 1.0 / self.view.s if world else 1.0
        if stroke is not None:
            p.setStyle(skia.Paint.kStroke_Style)
            p.setStrokeWidth(stroke * k)
            p.setStrokeCap(skia.Paint.kRound_Cap if cap == 'round' else skia.Paint.kButt_Cap)
            p.setStrokeJoin(skia.Paint.kRound_Join)
        effects = []
        if dash:
            effects.append(skia.DashPathEffect.Make([dash[0] * k, dash[1] * k], 0))
        if trim is not None:
            if trim[1] - trim[0] <= 1e-4:
                return None
            if trim[1] - trim[0] < 0.9999:
                effects.append(skia.TrimPathEffect.Make(float(trim[0]), float(min(1.0, trim[1]))))
        if effects:
            pe = effects[0]
            for e in effects[1:]:
                pe = skia.PathEffect.MakeCompose(pe, e)
            p.setPathEffect(pe)
        if glow:
            p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, glow * k, True))
        if blend is not None:
            p.setBlendMode(blend)
        return p

    def _draw(self, path, pt, name):
        for p in (path.paths if isinstance(path, Tiles) else [path]):
            lo, hi = self.view.wrange(p)
            if lo > 0.06:
                self.c.drawPath(p, pt)
            elif hi < 0.8:
                continue                                  # entirely below the frame: nothing to see
            elif name not in self.warned:
                self.warned.add(name)
                print(f'[mg_maps] skip unsafe tile in {name}', flush=True)

    def fill(self, path, color, alpha=1.0, name='?', **kw):
        if alpha <= 0.002:
            return
        pt = self._paint(color, alpha, **kw)
        if pt is not None:
            self._draw(path, pt, name)

    def stroke(self, path, color, width, alpha=1.0, name='?', **kw):
        """width in 2x screen px (at the view centre)."""
        if alpha <= 0.002:
            return
        pt = self._paint(color, alpha, stroke=width, **kw)
        if pt is not None:
            self._draw(path, pt, name)

    def stroke_world(self, path, color, metres, alpha=1.0, **kw):
        """stroke with a width in metres (streets)."""
        self.stroke(path, color, metres * self.view.s, alpha, **kw)

    def radial_mask(self, centre_local, r0, r1, strength=1.0):
        """multiply everything drawn since save_layer() by a radial falloff (local world coords, metres)."""
        sh = skia.GradientShader.MakeRadial(skia.Point(*centre_local), r1,
                                            [skia.Color4f(1, 1, 1, 1).toColor(), skia.Color4f(1, 1, 1, 1).toColor(),
                                             skia.Color4f(1, 1, 1, 1 - strength).toColor()],
                                            [0.0, r0 / r1, 1.0])
        p = skia.Paint(Shader=sh)
        p.setBlendMode(skia.BlendMode.kDstIn)
        self.c.drawPaint(p)

    def to_pil(self):
        return Image.fromarray(self.arr.copy(), 'RGBA')


# --------------------------------------------------------------------------------------- type (tracked caps, mglib look)
_TCACHE = {}


def _text_img(s, size, weight, color, tracking, display):
    key = (s, size, weight, tuple(color), tracking, display)
    if key in _TCACHE:
        return _TCACHE[key]
    from PIL import ImageDraw
    f = G.font(size, weight, display)
    tmp = ImageDraw.Draw(Image.new('L', (8, 8)))
    widths = [tmp.textlength(c, font=f) + tracking * size for c in s]
    total = int(sum(widths) - tracking * size) + 4
    asc, desc = f.getmetrics()
    im = Image.new('RGBA', (max(4, total + 8), asc + desc + 8), tuple(color) + (0,))
    d = ImageDraw.Draw(im)
    x = 4
    for c, wd in zip(s, widths):
        d.text((x, 4), c, font=f, fill=tuple(color) + (255,))
        x += wd
    res = (im, 4, 4 + asc, total)          # image, x of ink start, baseline y, advance width
    _TCACHE[key] = res
    return res


def tlabel(im, s, xy, size=34, color=G.DIM, alpha=1.0, anchor='lm', angle=0.0, weight='Medium', tracking=0.04,
           display=False, upper=True, rise=0.0):
    """mglib-style small tracked caps (Inter Medium, +4 %) drawn as a sprite: supports rotation (degrees, ccw) and a
    build-on rise (px, slides up into place while alpha eases in). anchor: l/m/r + a(top)/m(middle)/s(baseline)."""
    if alpha <= 0.003:
        return
    s = s.upper() if upper else s
    spr, x0, base, adv = _text_img(s, size, weight, color, tracking, display)
    asc = base - 4
    ax = {'l': x0, 'm': x0 + adv / 2, 'r': x0 + adv}[anchor[0]]
    ay = {'a': 4, 'm': 4 + asc * 0.62, 's': base, 'd': spr.height - 4}[anchor[1]]
    a = spr.split()[3].point(lambda v: int(v * max(0.0, min(1.0, alpha))))
    spr = spr.copy()
    spr.putalpha(a)
    if angle:
        cx, cy = spr.width / 2, spr.height / 2
        rot = spr.rotate(angle, resample=Image.BICUBIC, expand=True)
        r = math.radians(angle)
        dx, dy = ax - cx, ay - cy
        rx, ry = dx * math.cos(r) + dy * math.sin(r), -dx * math.sin(r) + dy * math.cos(r)
        px, py = xy[0] - (rot.width / 2 + rx), xy[1] - (rot.height / 2 + ry) - rise
        im.alpha_composite(rot, (int(round(px)), int(round(py))))
    else:
        im.alpha_composite(spr, (int(round(xy[0] - ax)), int(round(xy[1] - ay - rise))))


def credit_osm(im, alpha=0.7, extra=None):
    G.credit(im, OSM_CREDIT + (f' · {extra}' if extra else ''), alpha=alpha)


def coord_readout(im, view, alpha=0.5):
    """small lat/long readout bottom-right that follows the camera (precision cue)."""
    lon, lat = inv_proj(view.cx, view.cy)
    s = f"{abs(lat):.4f}° {'N' if lat >= 0 else 'S'}   {abs(lon):.4f}° {'E' if lon >= 0 else 'W'}"
    tlabel(im, s, (W2 - 128, H2 - 56), size=28, color=G.DIM, alpha=alpha, anchor='rs', tracking=0.06)


def inv_proj(x, y):
    rho = math.hypot(x, y)
    if rho < 1e-9:
        return math.degrees(LON0), math.degrees(LAT0)
    c = 2 * math.asin(rho / (2 * R_EARTH))
    lat = math.asin(math.cos(c) * math.sin(LAT0) + y * math.sin(c) * math.cos(LAT0) / rho)
    lon = LON0 + math.atan2(x * math.sin(c), rho * math.cos(LAT0) * math.cos(c) - y * math.sin(LAT0) * math.sin(c))
    return math.degrees(lon), math.degrees(lat)


# ------------------------------------------------------------------------------------------------ marks
def pin(fr, im_draws, xy_screen, t_in, t, color=G.AMBER, r=11, ring=True):
    """amber location mark on the skia canvas in screen space: dot + ring that settles + one soft pulse."""
    a = build_in(t, t_in, 10)
    if a <= 0:
        return
    x, y = xy_screen
    fr.screen()
    c = fr.c
    pulse = sg(t, t_in, t_in + 1.1)
    if 0 < pulse < 1:
        c.drawCircle(x, y, r * (1.6 + 4.5 * G.ease_out(pulse)),
                     skia.Paint(AntiAlias=True, Color4f=sk_color(color, 0.55 * (1 - pulse) * a), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    c.drawCircle(x, y, r * 2.6, skia.Paint(AntiAlias=True, Color4f=sk_color(color, 0.22 * a),
                                           MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)))
    if ring:
        c.drawCircle(x, y, r * (2.2 - 0.4 * a), skia.Paint(AntiAlias=True, Color4f=sk_color(color, 0.9 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=3))
    c.drawCircle(x, y, r * (0.6 + 0.4 * a), skia.Paint(AntiAlias=True, Color4f=sk_color(color, a)))


def dot(fr, xy_screen, a, color=G.INK, r=7):
    if a <= 0:
        return
    fr.screen()
    fr.c.drawCircle(xy_screen[0], xy_screen[1], r, skia.Paint(AntiAlias=True, Color4f=sk_color(color, a)))


def finish_frame(clip, fr, labels_fn=None):
    im = fr.to_pil()
    if labels_fn:
        labels_fn(im)
    clip.add(im)


# ------------------------------------------------------------------------------------------------ clip runner
class Still:
    """stand-in for G.Clip that writes PNG stills at chosen t (for checking frames before a full render)."""

    def __init__(self, cid, seconds, times, handles=12):
        self.cid, self.seconds, self.handles, self.times = cid, seconds, handles, times
        self.n = int(round(seconds * FPS))
        os.makedirs(SCRATCH, exist_ok=True)

    def __enter__(self):
        return self

    def frames(self):
        for tt in self.times:
            i = int(round(tt * (self.n - 1)))
            self._i = i
            yield i, i / max(1, self.n - 1)

    def add(self, im, **kw):
        arr = G.finish(im, **kw)
        p = os.path.join(SCRATCH, f'{self.cid}_{self._i:04d}.png')
        Image.fromarray(arr).save(p)
        print('[still]', p, flush=True)

    def __exit__(self, *exc):
        pass


def make_clip(cid, seconds, stills=None):
    return Still(cid, seconds, stills) if stills else G.Clip(cid, seconds, handles=12)


# ===================================================================================================== shared map layers
class MapLayers:
    """paths for the Europe / Belgium / Antwerp layers, built once per clip in local coordinates."""

    def __init__(self, origin):
        self.o = origin
        ne = data('ne_europe')
        self.ne = ne
        self.countries = {k: rings_path([r for c in ne['countries'] for r in c['lod'][k]], origin) for k in ('0', '1', '2')}
        self.country = {c['iso']: {k: rings_path(c['lod'][k], origin) for k in ('0', '1', '2')} for c in ne['countries']}
        self.prov_bel = rings_path([r for p in ne['provinces_bel'] for r in p['rings']], origin)
        self.lakes = rings_path([r for lk in ne['lakes'] for r in lk['rings']], origin)
        self.rivers_major = lines_path([ln for rv in ne['rivers'] if rv['rank'] <= 6 for ln in rv['lines']], origin)
        self.rivers_minor = lines_path([ln for rv in ne['rivers'] if 6 < rv['rank'] <= 9 for ln in rv['lines']], origin)
        self.roads = lines_path([ln for r in ne['roads_be'] if r['rank'] <= 6 for ln in r['lines']], origin)
        self.grat = self._graticule()
        self._osm = None

    def _graticule(self):
        lines = []
        for lon in range(-25, 50, 5):
            la = np.linspace(28, 72, 120)
            x, y = proj(np.full_like(la, lon), la)
            lines.append(np.stack([x, y], 1).tolist())
        for lat in range(30, 75, 5):
            lo = np.linspace(-26, 50, 200)
            x, y = proj(lo, np.full_like(lo, lat))
            lines.append(np.stack([x, y], 1).tolist())
        return lines_path(lines, self.o)

    @staticmethod
    def lod_for(view):
        s = view.s
        return '2' if 4000 * s < 2.2 else ('1' if 900 * s < 2.2 else '0')

    def osm(self):
        if self._osm is None:
            o = data('osm_antwerp')
            O = self.o
            st = {}
            widths = {'primary': 16, 'secondary': 16, 'tertiary': 14, 'residential': 11, 'living_street': 10,
                      'unclassified': 11, 'pedestrian': 10, 'service': 6, 'footway': 2.5, 'cycleway': 2.5, 'path': 2.0}
            for s_ in o['streets']:
                w = widths.get(s_['cls'])
                if w is None:
                    continue
                under = s_['layer'] < 0 or s_['tunnel'] in ('yes', 'building_passage')
                st.setdefault((w, under), []).append(s_['pts'])
            self._osm = {
                'streets': {k: Tiles(v, O, False) for k, v in st.items()},
                'plazas': Tiles([p['pts'] for p in o['platforms'] if p['kind'] == 'plaza'], O),
                'platforms': Tiles([p['pts'] for p in o['platforms'] if p['kind'] == 'rail'], O),
                'buildings': Tiles([b['pts'] for b in o['buildings']], O),
                'green': Tiles([g['pts'] for g in o['green']], O),
                'water': Tiles([g['pts'] for g in o['water']], O),
                'rail': Tiles([r['pts'] for r in o['rail'] if r['layer'] >= 0 and not r['tunnel']], O, False),
                'rail_tun': Tiles([r['pts'] for r in o['rail'] if r['layer'] < 0 or r['tunnel']], O, False),
                'station': rings_path(o['station'], O),
                'district': rings_path([o['district']], O),
                'adc': rings_path([o['adc']], O),
                'scheldt': Tiles(o.get('scheldt_tiles', []), O, True, cell=1000.0),
                'scheldt_edge': Tiles(_chunks(o.get('scheldt', []), 30), O, False, cell=1000.0),
                'raw': o,
            }
        return self._osm


def draw_base(fr, L, view, t_hi=0.0, hi_iso=('BEL',), land=LAND, land_hi=LAND_HI, grat_a=0.0, rivers_a=1.0,
              borders_a=1.0, hi_outline=0.55, hi_outline_color=G.INK):
    """ocean, land, borders, lakes, rivers, highlighted country."""
    lod = L.lod_for(view)
    fr.fill(L.countries[lod], land, 1.0, name='countries')
    for iso in hi_iso:
        if t_hi > 0 and iso in L.country:
            fr.fill(L.country[iso][lod], land_hi, t_hi, name='hi')
    fr.fill(L.lakes, OCEAN, 1.0, name='lakes')
    if grat_a > 0:
        fr.stroke(L.grat, G.INK, 1.6, 0.05 * grat_a, name='grat')
    fr.stroke(L.rivers_major, RIVER, 2.2, 0.85 * rivers_a, name='rivers')
    fr.stroke(L.rivers_minor, RIVER, 1.6, 0.55 * rivers_a * G.ease(sg(-math.log(view.width), -math.log(1.5e6), -math.log(6e5))), name='rivers2')
    fr.stroke(L.countries[lod], BORDER, 2.0, borders_a, name='borders')
    for iso in hi_iso:
        if t_hi > 0 and iso in L.country:
            fr.stroke(L.country[iso][lod], hi_outline_color, 2.4, hi_outline * t_hi, name='hi_outline')


def draw_osm(fr, L, view, alpha, centre_local, r0=450, r1=1150, district_a=0.0, district_draw=1.0, t_glow=1.0,
             station_a=0.0, buildings_a=1.0):
    """the OpenStreetMap street plan, radially faded around centre_local (local metres)."""
    if alpha <= 0.003:
        return
    o = L.osm()
    c = fr.c
    c.saveLayer(None, None)
    fr.fill(o['green'], GREEN, 1.0, name='green')
    fr.fill(o['water'], WATER, 1.0, name='water')
    fr.fill(o['plazas'], STREET, 0.8, name='plazas')
    for (w, under), p in sorted(o['streets'].items(), key=lambda kv: -kv[0][0]):
        if under:
            continue
        fr.stroke_world(p, STREET, w, 1.0 if w > 4 else 0.6, name='streets')
    fr.fill(o['platforms'], (40, 42, 47), 1.0, name='platforms')
    fr.fill(o['buildings'], BLDG, buildings_a, name='bldg')
    fr.stroke(o['buildings'], BLDG_EDGE, 1.6, 0.9 * buildings_a, name='bldg_edge')
    if station_a > 0:
        fr.fill(o['station'], (44, 45, 51), station_a, name='station')
        fr.stroke(o['station'], G.INK, 2.0, 0.35 * station_a, name='station_e')
    fr.stroke(o['rail_tun'], RAILC, 1.4, 0.22, dash=(10, 10), name='rail_tun')
    fr.stroke(o['rail'], RAILC, 1.8, 0.75, name='rail')
    fr.radial_mask(centre_local, r0, r1)
    # global fade of the whole street layer
    p = skia.Paint(Color4f=skia.Color4f(1, 1, 1, alpha))
    p.setBlendMode(skia.BlendMode.kDstIn)
    c.drawPaint(p)
    c.restore()
    if district_a > 0:
        fr.fill(o['district'], G.AMBER, 0.10 * district_a * G.ease(sg(district_draw, 0.6, 1.0)), name='district_f')
        fr.stroke(o['district'], G.AMBER, 7, 0.35 * district_a * t_glow, glow=7, trim=(0, district_draw), name='district_g')
        fr.stroke(o['district'], G.AMBER, 3.2, district_a, trim=(0, district_draw), name='district')


def street_label_anchor(o, name, frac=0.5, ids=None):
    """world point + direction (unit) at a fraction along the longest named way."""
    ways = [s for s in o['streets'] if s['name'] == name and (ids is None or s['id'] in ids)]
    if not ways:
        return None
    w = max(ways, key=lambda s: np.linalg.norm(np.diff(np.asarray(s['pts']), axis=0), axis=1).sum())
    pts = np.asarray(w['pts'])
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    d = cum[-1] * frac
    k = min(np.searchsorted(cum, d) - 1, len(seg) - 1)
    k = max(k, 0)
    a = (d - cum[k]) / max(seg[k], 1e-9)
    p = pts[k] + (pts[k + 1] - pts[k]) * a
    v = (pts[k + 1] - pts[k]) / max(seg[k], 1e-9)
    return p, v


def screen_angle(view, p, v, step=20.0):
    """readable label angle (deg, ccw) of the world direction v at world point p, as seen through the view."""
    x0, y0 = view.px(p[0], p[1])
    x1, y1 = view.px(p[0] + v[0] * step, p[1] + v[1] * step)
    ang = math.degrees(math.atan2(-(float(y1) - float(y0)), float(x1) - float(x0)))
    if ang > 90:
        ang -= 180
    if ang <= -90:
        ang += 180
    return ang, (float(x0), float(y0))


# ===================================================================================================== M_MAP_ANTWERP
def m_map_antwerp(stills=None):
    # v2 re-cut: 6.9 s; the timeline below was designed for 6.0 s and is stretched by K so the district is framed
    # (zoom landed, outline drawn, street labels on) by ~6.0 s.
    secs = 6.9
    K = 1.15
    o_raw = data('osm_antwerp')
    D = tuple(np.mean(np.asarray(o_raw['district'][:-1]), 0))          # district centroid (world)
    O = D
    L = MapLayers(O)
    E = P(7.2, 49.4)
    B = P(4.62, 50.62)
    A = P(4.405, 51.212)
    T = P(4.4193, 51.2157)
    zp = ZoomPath([
        (-0.6, 3.25e6, P(7.4, 49.2)),
        (0.0, 3.05e6, E),
        (1.0, 2.6e6, P(6.5, 49.7)),
        (2.15, 3.7e5, B),
        (2.75, 3.05e5, P(4.58, 50.68)),
        (3.75, 1.55e4, A),
        (4.15, 1.22e4, P(4.408, 51.2135)),
        (5.15, 9.2e2, T),
        (6.6, 6.5e2, P(4.4191, 51.2158)),
    ])
    fr = Frame()
    lbl_ctx = [('FRANCE', 2.6, 46.9), ('GERMANY', 10.2, 51.2), ('NETHERLANDS', 5.6, 52.4), ('UNITED KINGDOM', -1.6, 52.6),
               ('ITALY', 11.6, 44.2), ('SWITZERLAND', 8.1, 46.8)]
    ant = data('ne_europe')['places']['Antwerp']['xy']
    bru = data('ne_europe')['places']['Brussels']['xy']
    o = L.osm()
    station_main = max(o_raw['station'], key=lambda r: len(r))
    S = tuple(np.mean(np.asarray(station_main[:-1]), 0))
    streets = [('Hoveniersstraat', 0.5, 4.95, None), ('Schupstraat', 0.45, 5.1, None), ('Rijfstraat', 0.5, 5.2, None),
               ('Pelikaanstraat', 0.55, 5.3, {'35429410'})]
    sch_lbl = (river_mid(o_raw['scheldt'], P(4.39, 51.2265)[1]), river_mid(o_raw['scheldt'], P(4.39, 51.2215)[1]))

    with make_clip('M_MAP_ANTWERP', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS / K
            w, (cx, cy) = zp(ts)
            pitch = 30.0 * G.ease(sg(ts, 4.05, 5.6))
            rot = -8.0 * G.ease(sg(ts, 3.9, 6.6))
            view = View(cx, cy, w, rot=rot, pitch=pitch, origin=O)
            fr.clear(OCEAN)
            fr.begin(view)
            lw = math.log10(w)
            hi = fade(ts, 0.45, 1.25)
            if w > 2.2e4:
                draw_base(fr, L, view, t_hi=hi, grat_a=sg(lw, 5.6, 6.2), hi_outline=0.5 * (1 - sg(lw, 4.9, 4.4)),
                          rivers_a=1 - sg(lw, 4.4, 4.2))
                fr.stroke(L.prov_bel, BORDER, 1.6, 0.6 * sg(lw, 6.0, 5.6) * sg(lw, 4.6, 5.0), dash=(8, 8), name='prov')
            else:
                fr.c.clear(sk_color(lerp_col(LAND, LAND_HI, hi)))
            # motorways (Belgium stage), Scheldt, street plan
            road_a = sg(lw, 5.9, 5.3) * sg(lw, 3.9, 4.4)
            fr.stroke(L.roads, ROADC, 2.2, 0.55 * road_a, name='roads')
            sch_a = G.ease(sg(lw, 4.32, 4.12)) * sg(lw, 3.25, 3.7)
            fr.fill(o['scheldt'], WATER, sch_a, name='scheldt')
            fr.stroke(o['scheldt_edge'], RIVER, 1.8, 0.7 * sch_a, name='scheldt_e')
            osm_a = G.ease(sg(lw, 4.55, 3.9))
            dd = G.ease(sg(ts, 4.55, 5.35))
            draw_osm(fr, L, view, osm_a, (0.0, 0.0), r0=520, r1=980,
                     district_a=fade(ts, 4.45, 4.6), district_draw=dd, station_a=fade(ts, 4.6, 5.2))
            # marks (screen space)
            ax, ay = view.px(*ant)
            bx, by = view.px(*bru)
            a_ant = fade(ts, 1.9, 2.3) * (1 - sg(lw, 4.45, 4.15))
            dot(fr, (ax, ay), a_ant * 0.95, G.INK, r=8)
            dot(fr, (bx, by), fade(ts, 2.05, 2.45) * (1 - sg(lw, 4.9, 4.6)) * 0.7, G.DIM, r=6)

            def labels(im):
                # Europe context
                ctx_a = fade(ts, -0.3, 0.2) * (1 - sg(lw, 6.25, 5.9))
                for nm, lo, la in lbl_ctx:
                    x, y = view.px(*P(lo, la))
                    tlabel(im, nm, (x, y), size=30, color=G.DIM, alpha=0.45 * ctx_a, anchor='mm', tracking=0.14)
                # Belgium
                bxl, byl = view.px(*P(4.75, 50.55))
                bel_a = fade(ts, 0.55, 0.9) * (1 - sg(lw, 5.15, 4.85))
                tlabel(im, 'BELGIUM', (bxl, byl), size=40 if lw > 6 else 46, color=G.INK, alpha=0.9 * bel_a, anchor='mm',
                       tracking=0.22, weight='SemiBold', rise=10 * (1 - build_in(ts, 0.55, 12)))
                # Antwerp / Brussels
                tlabel(im, 'ANTWERP', (ax + 24, ay), size=34, color=G.INK, alpha=a_ant, anchor='lm', tracking=0.12,
                       rise=8 * (1 - build_in(ts, 1.9, 10)))
                tlabel(im, 'BRUSSELS', (bx + 20, by), size=28, color=G.DIM, alpha=0.8 * fade(ts, 2.05, 2.45) * (1 - sg(lw, 4.9, 4.6)),
                       anchor='lm', tracking=0.1)
                # Scheldt
                sa, sb = sch_lbl
                ang, (sx, sy) = screen_angle(view, sa, (np.asarray(sb) - np.asarray(sa)) / np.linalg.norm(np.asarray(sb) - np.asarray(sa)))
                tlabel(im, 'SCHELDT', (sx, sy), size=26, color=RIVER_LBL, alpha=0.8 * sch_a * fade(ts, 3.2, 3.5), anchor='mm',
                       angle=ang, tracking=0.3)
                # station
                stx, sty = view.px(*S)
                st_a = fade(ts, 3.75, 4.1)
                if st_a > 0:
                    tlabel(im, 'ANTWERPEN-CENTRAAL', (stx + 26, sty - 8), size=30, color=G.INK,
                           alpha=0.85 * st_a, anchor='lm', tracking=0.08, rise=8 * (1 - build_in(ts, 3.75, 10)))
                # district label (left of the outline)
                dl = np.asarray(o_raw['district'])
                west = dl[np.argmin(dl[:, 0])]
                wx, wy = view.px(west[0] - 14, west[1])
                da = fade(ts, 4.9, 5.2)
                tlabel(im, 'DIAMOND DISTRICT', (wx - 18, wy), size=36, color=G.AMBER, alpha=da, anchor='rm', tracking=0.12,
                       weight='SemiBold', rise=8 * (1 - build_in(ts, 4.9, 10)))
                for nm, frac, t0, ids in streets:
                    an = street_label_anchor(o_raw, nm, frac, ids)
                    if an is None:
                        continue
                    ang, (lx, ly) = screen_angle(view, an[0], an[1])
                    tlabel(im, nm, (lx, ly), size=30, color=G.INK, alpha=0.8 * build_in(ts, t0, 10), anchor='mm', angle=ang,
                           tracking=0.08)
                credit_osm(im, alpha=0.6 * fade(ts, 3.3, 3.8))
                coord_readout(im, view, alpha=0.45 * fade(ts, -0.4, 0.2))
            finish_frame(clip, fr, labels)


RIVER_LBL = (96, 116, 134)


def river_mid(rings, y):
    """world point in the middle of the first water crossing of the horizontal line at world y (west -> east)."""
    xs = []
    for r in rings:
        a = np.asarray(r, float)
        for (x0, y0), (x1, y1) in zip(a, a[1:]):
            if (y0 - y) * (y1 - y) < 0:
                xs.append(x0 + (x1 - x0) * (y - y0) / (y1 - y0))
    xs.sort()
    if len(xs) < 2:
        return (0.0, y)
    return ((xs[0] + xs[1]) / 2, y)


def lerp_col(a, b, t):
    return tuple(int(round(lerp(x, y, t))) for x, y in zip(a, b))


# ===================================================================================================== M_CAMERAS
def cone_path(apex_local, bearing, half, rng, n=24):
    """view cone (sector) in local metres; bearing = compass degrees (0 = north, clockwise)."""
    th = math.radians(90 - bearing)
    hw = math.radians(half)
    p = skia.Path()
    p.moveTo(*apex_local)
    for k in range(n + 1):
        a = th - hw + 2 * hw * k / n
        p.lineTo(apex_local[0] + rng * math.cos(a), apex_local[1] + rng * math.sin(a))
    p.close()
    return p


def draw_cone(fr, apex_local, bearing, half, rng, a, color=G.AMBER, edge=True):
    if a <= 0.003 or half <= 0.2:
        return
    sh = skia.GradientShader.MakeRadial(skia.Point(*apex_local), rng,
                                        [sk_color(color, 0.50 * a).toColor(), sk_color(color, 0.16 * a).toColor(),
                                         sk_color(color, 0.0).toColor()], [0.0, 0.55, 1.0])
    p = cone_path(apex_local, bearing, half, rng)
    fr.c.drawPath(p, skia.Paint(AntiAlias=True, Shader=sh))
    if edge:
        th = math.radians(90 - bearing)
        for sgn in (-1, 1):
            e = skia.Path()
            e.moveTo(*apex_local)
            aa = th + sgn * math.radians(half)
            e.lineTo(apex_local[0] + rng * 0.8 * math.cos(aa), apex_local[1] + rng * 0.8 * math.sin(aa))
            sh2 = skia.GradientShader.MakeRadial(skia.Point(*apex_local), rng * 0.8,
                                                 [sk_color(color, 0.8 * a).toColor(), sk_color(color, 0.0).toColor()])
            fr.c.drawPath(e, skia.Paint(AntiAlias=True, Shader=sh2, Style=skia.Paint.kStroke_Style, StrokeWidth=1.8 / fr.view.s))


def camera_icon(fr, xy, ang, a, scale=1.0, color=G.INK):
    """schematic CCTV glyph (body + lens) in screen space, pointing along screen angle ang (deg, ccw from +x)."""
    if a <= 0.003:
        return
    c = fr.c
    fr.screen()
    c.save()
    c.translate(xy[0], xy[1])
    c.rotate(-ang)
    c.scale(scale, scale)
    pt = skia.Paint(AntiAlias=True, Color4f=sk_color(color, a))
    c.drawCircle(0, 0, 30, skia.Paint(AntiAlias=True, Color4f=sk_color(G.BG, 0.55 * a), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8)))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-17, -8, 9, 8), 3, 3), pt)
    lens = skia.Path()
    lens.moveTo(9, -5)
    lens.lineTo(19, -9)
    lens.lineTo(19, 9)
    lens.lineTo(9, 5)
    lens.close()
    c.drawPath(lens, pt)
    c.drawRect(skia.Rect(-21, -3, -17, 3), pt)
    c.restore()


def m_cameras(stills=None):
    secs = 5.1                          # v2 re-cut: cones from 0.0, police post lands at 2.0
    o_raw = data('osm_antwerp')
    D = tuple(np.mean(np.asarray(o_raw['district'][:-1]), 0))
    L = MapLayers(D)
    o = L.osm()
    fr = Frame()
    C0 = P(4.41890, 51.21522)
    # cameras: OpenStreetMap positions (mapped today); bearings from OSM camera:direction where given, otherwise
    # along the street the camera faces. (lon, lat, bearing, half-angle, range m)
    cams = [(4.41793, 51.21438, 86, 22, 46), (4.41754, 51.21446, 75, 26, 34), (4.41776, 51.21421, 188, 20, 34),
            (4.41873, 51.21507, 352, 20, 48), (4.41873, 51.21507, 172, 20, 44), (4.41907, 51.21604, 252, 22, 38),
            (4.41961, 51.21612, 250, 18, 46), (4.42018, 51.21557, 155, 20, 46), (4.42018, 51.21558, 320, 20, 46)]
    cams_l = [((P(lo, la)[0] - D[0], P(lo, la)[1] - D[1]), b, h, r) for lo, la, b, h, r in cams]
    t_cam = [-0.30 + 0.11 * k for k in range(len(cams))]
    # bollard rows across the two pedestrian entrances (OSM lift_gate nodes), perpendicular to the street
    gates = [((4.41779, 51.21443), 88.0), ((4.41942, 51.21607), 70.0)]
    rows = []
    for (lo, la), street_bearing in gates:
        gx, gy = P(lo, la)
        th = math.radians(90 - street_bearing + 90)
        rows.append([(gx - D[0] + k * 1.7 * math.cos(th), gy - D[1] + k * 1.7 * math.sin(th)) for k in (-2.5, -1.5, -0.5, 0.5, 1.5, 2.5)])
    t_boll = [1.15, 1.35]
    POL = P(4.41896, 51.21463)          # police post at the Hoveniersstraat / Schupstraat corner (illustrative)
    t_pol = 1.75
    streets = [('Hoveniersstraat', 0.27, None), ('Schupstraat', 0.38, None), ('Rijfstraat', 0.5, None),
               ('Pelikaanstraat', 0.35, {'35429410'})]
    with make_clip('M_CAMERAS', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            e = G.ease((ts + 0.5) / (secs + 1.0))
            w = lerp(470, 400, e)
            cx, cy = lerp(C0[0] - 6, C0[0] + 5, e), lerp(C0[1] + 4, C0[1] - 3, e)
            view = View(cx, cy, w, rot=lerp(-7.0, -10.5, e), pitch=lerp(20, 24, e), origin=D)
            fr.clear(LAND_HI)
            fr.begin(view)
            draw_osm(fr, L, view, 1.0, (C0[0] - D[0], C0[1] - D[1]), r0=260, r1=640, station_a=1.0)
            fr.stroke(o['district'], G.INK, 1.6, 0.22, dash=(10, 8), name='district')
            # cones, kept to street space (buildings cut them)
            fr.c.saveLayer(None, None)
            for (apex, b, h, r), t0 in zip(cams_l, t_cam):
                k = build_in(ts, t0 + 0.08, 11)
                draw_cone(fr, apex, b, h * (0.25 + 0.75 * k), r * (0.55 + 0.45 * k), k)
            cut = skia.Paint(AntiAlias=True, Color4f=skia.Color4f(0, 0, 0, 1))
            cut.setBlendMode(skia.BlendMode.kDstOut)
            for p in o['buildings'].paths:
                lo_, hi_ = view.wrange(p)
                if lo_ > 0.06:
                    fr.c.drawPath(p, cut)
            fr.c.restore()
            # camera glyphs
            for (apex, b, h, r), t0 in zip(cams_l, t_cam):
                k = build_in(ts, t0, 8)
                wx, wy = apex[0] + D[0], apex[1] + D[1]
                ang, xy = screen_angle_raw(view, (wx, wy), b)
                camera_icon(fr, xy, ang, k, scale=0.9 + 0.3 * k)
            # bollards
            fr.screen()
            for row, t0 in zip(rows, t_boll):
                for kk, (bx, by) in enumerate(row):
                    k = build_in(ts, t0 + kk * 0.04, 7)
                    if k <= 0:
                        continue
                    sx, sy = view.px(bx + D[0], by + D[1])
                    fr.c.drawCircle(float(sx), float(sy), 9 * (0.5 + 0.5 * k), skia.Paint(AntiAlias=True, Color4f=sk_color(G.BG, 0.8 * k)))
                    fr.c.drawCircle(float(sx), float(sy), 6.5 * (0.5 + 0.5 * k), skia.Paint(AntiAlias=True, Color4f=sk_color(G.INK, k)))
            # police post
            px_, py_ = view.px(*POL)
            kp = build_in(ts, t_pol, 10)
            if kp > 0:
                fr.c.drawCircle(float(px_), float(py_), 26 * (0.7 + 0.3 * kp), skia.Paint(AntiAlias=True, Color4f=sk_color(G.INK, 0.9 * kp),
                                                                                      Style=skia.Paint.kStroke_Style, StrokeWidth=3))
                fr.c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(px_ - 11, py_ - 11, px_ + 11, py_ + 11), 3, 3),
                               skia.Paint(AntiAlias=True, Color4f=sk_color(G.INK, kp)))

            def labels(im):
                for nm, frac, ids in streets:
                    an = street_label_anchor(o_raw, nm, frac, ids)
                    if an is None:
                        continue
                    ang, (lx, ly) = screen_angle(view, an[0], an[1])
                    tlabel(im, nm, (lx, ly), size=30, color=G.INK, alpha=0.62, anchor='mm', angle=ang, tracking=0.08)
                ax_, ay_ = view.px(*(np.asarray(cams_l[7][0]) + D))
                tlabel(im, 'CAMERAS', (float(ax_) + 46, float(ay_) + 34), size=32, color=G.AMBER, alpha=build_in(ts, 0.55, 10),
                       anchor='lm', tracking=0.12, weight='SemiBold', rise=8 * (1 - build_in(ts, 0.55, 10)))
                bx_, by_ = view.px(*(np.asarray(rows[0][0]) + D))
                tlabel(im, 'BOLLARDS', (float(bx_) - 40, float(by_) + 44), size=30, color=G.INK, alpha=0.9 * build_in(ts, 1.4, 10),
                       anchor='rm', tracking=0.12, rise=8 * (1 - build_in(ts, 1.4, 10)))
                tlabel(im, 'POLICE POST', (float(px_) + 44, float(py_) + 6), size=30, color=G.INK, alpha=0.95 * kp, anchor='lm',
                       tracking=0.12, rise=8 * (1 - kp))
                credit_osm(im, alpha=0.6, extra='camera and barrier positions as mapped today')
            finish_frame(clip, fr, labels)


def screen_angle_raw(view, p, bearing, step=6.0):
    """screen angle (deg ccw from +x, not folded) of a compass bearing at world point p; returns (angle, screen xy)."""
    th = math.radians(90 - bearing)
    x0, y0 = view.px(p[0], p[1])
    x1, y1 = view.px(p[0] + step * math.cos(th), p[1] + step * math.sin(th))
    return math.degrees(math.atan2(-(float(y1) - float(y0)), float(x1) - float(x0))), (float(x0), float(y0))



# ===================================================================================================== diagrams (screen space)
def cam_matrix(ts, secs, zoom=(1.0, 1.045), drift=((0, 0), (-30, 12)), rot=(0.0, 0.0), centre=(W2 / 2, H2 / 2)):
    """slow eased push for flat diagrams: scale about the centre, drift in 2x px, tiny roll."""
    e = G.ease((ts + 0.5) / (secs + 1.0))
    z = lerp(zoom[0], zoom[1], e)
    dx, dy = lerp(drift[0][0], drift[1][0], e), lerp(drift[0][1], drift[1][1], e)
    m = skia.Matrix()
    m.setTranslate(centre[0] + dx, centre[1] + dy)
    m.preRotate(lerp(rot[0], rot[1], e))
    m.preScale(z, z)
    m.preTranslate(-centre[0], -centre[1])
    return m


def map_pt(m, x, y):
    p = m.mapXY(x, y)
    return p.x(), p.y()


def spaint(color, a=1.0, stroke=None, glow=0, cap_round=True):
    p = skia.Paint(AntiAlias=True, Color4f=sk_color(color, a))
    if stroke is not None:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap if cap_round else skia.Paint.kButt_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if glow:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, glow))
    return p


def trimmed(path, a, b=0.0):
    """path effect paint helper: returns a copy of `path` trimmed to [b, a] of its length."""
    if a - b <= 1e-4:
        return None
    if a - b >= 0.9999:
        return path
    out = skia.Path()
    meas = skia.PathMeasure(path, False)
    first = True
    total = 0.0
    lens = []
    while True:
        lens.append(meas.getLength())
        if not meas.nextContour():
            break
    total = sum(lens)
    meas = skia.PathMeasure(path, False)
    acc = 0.0
    k = 0
    while True:
        L_ = meas.getLength()
        s0, s1 = max(b * total - acc, 0.0), min(a * total - acc, L_)
        if s1 > s0:
            meas.getSegment(s0, s1, out, True)
        acc += L_
        k += 1
        if not meas.nextContour():
            break
    return out


def bg_glow(fr, centre, radius, color=(30, 31, 36), a=1.0):
    sh = skia.GradientShader.MakeRadial(skia.Point(*centre), radius, [sk_color(color, a).toColor(), sk_color(color, 0).toColor()])
    fr.c.drawPaint(skia.Paint(Shader=sh))


class FlatFrame(Frame):
    """Frame for flat diagrams: a View-less canvas (stroke widths in 2x px)."""

    def __init__(self):
        super().__init__()
        self.view = View(0, 0, W2)


# ===================================================================================================== M_STOPWATCH
def m_stopwatch(stills=None):
    secs = 3.0
    fr = FlatFrame()
    C = (1150.0, 1090.0)
    R = 390.0
    TL = (1840.0, 3260.0, 1090.0)                # timeline x0, x1, y
    T0, T1 = 0.42, 2.38                          # progress window (s)
    nodes = [(f, txt, T0 + f * (T1 - T0) - 0.04) for f, txt in
             [(0.0, 'GUARD BUZZES HIM IN'), (0.5, 'IN THE VAULT  ·  LEVEL −2'), (1.0, 'BACK UPSTAIRS')]]
    with make_clip('M_STOPWATCH', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            prog = G.ease(sg(ts, T0, T1)) if ts < T1 else 1.0
            prog = 0.9 * sg(ts, T0, T1) + 0.1 * prog            # mostly linear: time passing
            fr.clear(G.BG)
            c = fr.c
            m = cam_matrix(ts, secs, zoom=(1.0, 1.05), drift=((10, 6), (-26, -8)))
            c.setMatrix(m)
            bg_glow(fr, C, 900, (26, 27, 32))
            # dial
            k_d = build_in(ts, -0.2, 14)
            ring = skia.Path()
            ring.addCircle(C[0], C[1], R)
            rp = trimmed(ring, k_d)
            if rp is not None:
                c.drawPath(rp, spaint(G.INK, 0.55, stroke=3))
            for k in range(60):
                a_k = build_in(ts, -0.1 + k * 0.006, 6)
                if a_k <= 0:
                    continue
                th = math.radians(90 - k * 6)
                r0 = R - (34 if k % 5 == 0 else 18)
                c.drawLine(C[0] + r0 * math.cos(th), C[1] - r0 * math.sin(th), C[0] + (R - 8) * math.cos(th), C[1] - (R - 8) * math.sin(th),
                           spaint(G.INK if k % 5 == 0 else G.DIM, (0.85 if k % 5 == 0 else 0.45) * a_k, stroke=3 if k % 5 == 0 else 2))
            # amber sweep (clockwise from 12)
            sweep = 300.0 * prog
            if sweep > 0.2:
                arc = skia.Path()
                arc.addArc(skia.Rect(C[0] - R + 46, C[1] - R + 46, C[0] + R - 46, C[1] + R - 46), -90, sweep)
                c.drawPath(arc, spaint(G.AMBER, 0.45, stroke=14, glow=10))
                c.drawPath(arc, spaint(G.AMBER, 1.0, stroke=6))
                wedge = skia.Path()
                wedge.moveTo(*C)
                wedge.arcTo(skia.Rect(C[0] - R + 46, C[1] - R + 46, C[0] + R - 46, C[1] + R - 46), -90, sweep, False)
                wedge.close()
                c.drawPath(wedge, spaint(G.AMBER, 0.07))
            # hand
            th = math.radians(90 - 300.0 * prog)
            ka = build_in(ts, 0.15, 8)
            c.drawLine(C[0] - 30 * math.cos(th), C[1] + 30 * math.sin(th), C[0] + (R - 60) * math.cos(th), C[1] - (R - 60) * math.sin(th),
                       spaint(G.INK, 0.95 * ka, stroke=4))
            c.drawCircle(C[0], C[1], 11 * ka, spaint(G.INK, ka))
            c.drawCircle(C[0], C[1], 4.5 * ka, spaint(G.BG, ka))
            # crown
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(C[0] - 22, C[1] - R - 46, C[0] + 22, C[1] - R - 14), 5, 5), spaint(G.INK, 0.6 * k_d, stroke=3))
            # timeline
            x0, x1, y = TL
            k_l = build_in(ts, 0.1, 12)
            c.drawLine(x0, y, x0 + (x1 - x0) * k_l, y, spaint(G.DIM, 0.55, stroke=3))
            xp = x0 + (x1 - x0) * prog
            if prog > 0:
                c.drawLine(x0, y, xp, y, spaint(G.AMBER, 0.4, stroke=12, glow=9))
                c.drawLine(x0, y, xp, y, spaint(G.AMBER, 1.0, stroke=5))
                c.drawCircle(xp, y, 9, spaint(G.AMBER, 1.0))
            for f, _, tn in nodes:
                kn = build_in(ts, tn, 8)
                xn = x0 + (x1 - x0) * f
                hit = prog >= f - 1e-6 and ts >= tn
                c.drawCircle(xn, y, 17 * (0.6 + 0.4 * kn), spaint(G.BG, kn))
                c.drawCircle(xn, y, 17 * (0.6 + 0.4 * kn), spaint(G.AMBER if hit else G.INK, kn, stroke=4))
                if hit:
                    c.drawCircle(xn, y, 7, spaint(G.AMBER, kn))

            def labels(im):
                kx, ky = map_pt(m, x0, 740)
                tlabel(im, 'MINUTES DOWNSTAIRS', (kx, ky), size=88, color=G.INK, alpha=build_in(ts, 0.0, 12), anchor='ls',
                       weight='SemiBold', display=True, tracking=0.02, upper=False, rise=12 * (1 - build_in(ts, 0.0, 12)))
                kx, ky = map_pt(m, x0, 815)
                tlabel(im, 'A ROUTINE VISIT TO HIS OWN BOX', (kx, ky), size=34, color=G.DIM, alpha=0.9 * build_in(ts, 0.15, 12),
                       anchor='ls', tracking=0.12)
                for k, (f, txt, tn) in enumerate(nodes):
                    xn = x0 + (x1 - x0) * f
                    kn = build_in(ts, tn + 0.05, 10)
                    yy = y + (92 if k != 1 else -74)
                    lx, ly = map_pt(m, xn, yy)
                    anc = 'lm' if k == 0 else ('rm' if k == 2 else 'mm')
                    lx += -16 if k == 0 else (16 if k == 2 else 0)
                    tlabel(im, txt, (lx, ly), size=36, color=G.AMBER if k == 1 else G.INK, alpha=kn, anchor=anc, tracking=0.1,
                           rise=10 * (1 - kn))
            finish_frame(clip, fr, labels)


# ===================================================================================================== Europe route maps
def arc_path(a, b, bow=0.22, origin=(0, 0), side=1):
    """quadratic arc between world points a -> b (local path), bowed perpendicular by bow * |ab|."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = b - a
    n = np.array([-d[1], d[0]]) / max(np.linalg.norm(d), 1e-9) * side
    ctrl = (a + b) / 2 + n * bow * np.linalg.norm(d)
    p = skia.Path()
    p.moveTo(a[0] - origin[0], a[1] - origin[1])
    p.quadTo(ctrl[0] - origin[0], ctrl[1] - origin[1], b[0] - origin[0], b[1] - origin[1])
    return p


def pos_on(path, frac):
    meas = skia.PathMeasure(path, False)
    L_ = meas.getLength()
    pt, tan = meas.getPosTan(max(0.0, min(1.0, frac)) * L_)
    return (pt.x(), pt.y()), (tan.x(), tan.y())


def draw_route(fr, path, k, color=G.AMBER, width=5.0, glow=True, dash=None, alpha=1.0, head=True, origin=(0, 0)):
    """draw-on route (local path on the map canvas); k = 0..1 drawn fraction. Returns the head's world point."""
    tp = trimmed(path, k)
    if tp is None:
        return None
    if glow:
        fr.stroke(tp, color, width * 2.6, 0.35 * alpha, glow=width * 1.6, name='route_g')
    fr.stroke(tp, color, width, alpha, dash=dash, name='route')
    (hx, hy), _ = pos_on(path, k)
    return hx + origin[0], hy + origin[1]


def europe_arc_clip(cid, secs, stills, A, B, a_lbl, b_lbl, keys, t_arc=(0.55, 2.0), hi=('ITA', 'BEL'), bow=0.22, side=1,
                    title=None, sub=None, title_at='A', b_tag=None, pitch=(0.0, 0.0), extra=None):
    L = MapLayers((0.0, 0.0))
    fr = Frame()
    zp = ZoomPath(keys)
    Aw, Bw = P(*A), P(*B)
    route = arc_path(Aw, Bw, bow=bow, side=side)
    with make_clip(cid, secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            w, (cx, cy) = zp(ts)
            e = G.ease((ts + 0.5) / (secs + 1.0))
            view = View(cx, cy, w, rot=lerp(0.0, -1.5, e), pitch=lerp(*pitch, e))
            fr.clear(OCEAN)
            fr.begin(view)
            draw_base(fr, L, view, t_hi=0.85, hi_iso=hi, grat_a=1.0, hi_outline=0.35)
            if extra:
                extra(fr, view, ts, 'map')
            k = G.ease(sg(ts, *t_arc))
            head = draw_route(fr, route, k)
            ax, ay = view.px(*Aw)
            bx, by = view.px(*Bw)
            ka = build_in(ts, 0.15, 10)
            pin(fr, None, (float(ax), float(ay)), 0.15, ts, color=G.AMBER if title_at == 'A' else G.INK, r=10)
            if head is not None and 0 < k < 1:
                hx, hy = view.px(*head)
                dot(fr, (float(hx), float(hy)), 1.0, G.AMBER, r=9)
            pin(fr, None, (float(bx), float(by)), t_arc[1] - 0.05, ts, color=G.AMBER, r=10)
            if extra:
                extra(fr, view, ts, 'marks')

            def labels(im):
                tlabel(im, a_lbl, (float(ax) + 36, float(ay)), size=36, color=G.INK, alpha=ka, anchor='lm', tracking=0.14,
                       rise=8 * (1 - ka))
                kb = build_in(ts, t_arc[1], 10)
                tlabel(im, b_lbl, (float(bx) + 36, float(by)), size=36, color=G.INK, alpha=kb, anchor='lm', tracking=0.14,
                       rise=8 * (1 - kb))
                if b_tag:
                    kt = build_in(ts, t_arc[1] + 0.25, 10)
                    tlabel(im, b_tag, (float(bx) + 36, float(by) + 74), size=76, color=G.AMBER, alpha=kt, anchor='lm',
                           weight='SemiBold', display=True, tracking=0.04, upper=False, rise=10 * (1 - kt))
                if title:
                    tx, ty = (ax, ay) if title_at == 'A' else (bx, by)
                    kt = build_in(ts, 0.35, 12)
                    tlabel(im, title, (float(tx) - 70, float(ty) + 8), size=64, color=G.INK, alpha=kt, anchor='rs',
                           weight='SemiBold', display=True, tracking=0.03, upper=False, rise=12 * (1 - kt))
                    if sub:
                        ks = build_in(ts, 0.6, 12)
                        tlabel(im, sub, (float(tx) - 70, float(ty) + 62), size=32, color=G.DIM, alpha=ks, anchor='rs',
                               tracking=0.12, rise=8 * (1 - ks))
                if extra:
                    extra(im, view, ts, 'labels')
                coord_readout(im, view, alpha=0.4)
            finish_frame(clip, fr, labels)


def m_turin(stills=None):
    A, B = (7.6869, 45.0703), (4.4025, 51.2194)
    mid = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    keys = [(-0.6, 1.40e6, P(A[0] - 0.6, A[1] + 1.9)), (0.0, 1.45e6, P(A[0] - 0.7, A[1] + 2.0)),
            (4.1, 2.08e6, P(mid[0] - 0.4, mid[1] - 0.35))]
    europe_arc_clip('M_TURIN', 3.5, stills, A, B, 'TURIN', 'ANTWERP', keys, t_arc=(0.75, 2.25), hi=('ITA', 'BEL'),
                    bow=0.2, side=-1, title='THE SCHOOL OF TURIN', sub='A LOOSE NETWORK OF ITALIAN THIEVES')


def m_map_milan(stills=None):
    A, B = (4.4025, 51.2194), (9.1900, 45.4642)
    mid = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    keys = [(-0.6, 1.45e6, P(A[0] + 0.6, A[1] - 2.2)), (0.0, 1.5e6, P(A[0] + 0.7, A[1] - 2.3)),
            (4.6, 2.12e6, P(mid[0] + 0.3, mid[1] - 0.2))]
    europe_arc_clip('M_MAP_MILAN', 4.0, stills, A, B, 'ANTWERP', 'MILAN', keys, t_arc=(0.45, 2.1), hi=('BEL', 'ITA'),
                    bow=0.18, side=1, b_tag='2010', title_at='B')


def m_map_paris(stills=None):
    """CDG pin + "2013 — European arrest warrant"; the layover (from the US, onward to Turin) as dashed context legs."""
    secs = 4.0
    L = MapLayers((0.0, 0.0))
    fr = Frame()
    CDG = tuple(data('ne_europe')['airports']['CDG']['xy'])
    TUR = P(7.6869, 45.0703)
    WEST = P(-9.5, 50.2)                          # off-frame to the west: "from the US"
    inbound = arc_path(WEST, CDG, bow=0.12, side=-1)
    onward = arc_path(CDG, TUR, bow=0.16, side=-1)
    zp = ZoomPath([(-0.6, 1.95e6, P(3.6, 48.0)), (0.0, 1.9e6, P(3.5, 48.0)), (4.6, 1.55e6, P(3.6, 47.9))])
    with make_clip('M_MAP_PARIS', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            w, (cx, cy) = zp(ts)
            e = G.ease((ts + 0.5) / (secs + 1.0))
            view = View(cx, cy, w, rot=lerp(1.0, -1.0, e))
            fr.clear(OCEAN)
            fr.begin(view)
            draw_base(fr, L, view, t_hi=0.85, hi_iso=('FRA',), grat_a=1.0, hi_outline=0.3)
            # inbound leg (dim dashed, drawn on), onward leg to Turin (never flown: dashed, fades)
            k_in = G.ease(sg(ts, -0.2, 0.75))
            tp = trimmed(inbound, k_in)
            if tp is not None:
                fr.stroke(tp, G.INK, 2.6, 0.55, dash=(14, 12), name='in')
            k_on = G.ease(sg(ts, 1.0, 1.9))
            tp = trimmed(onward, k_on)
            if tp is not None:
                fr.stroke(tp, G.INK, 2.4, 0.5 * (1 - 0.45 * sg(ts, 2.6, 3.4)), dash=(10, 14), name='on')
            cx_, cy_ = view.px(*CDG)
            tx, ty = view.px(*TUR)
            pin(fr, None, (float(cx_), float(cy_)), 0.6, ts, color=G.AMBER, r=11)
            dot(fr, (float(tx), float(ty)), 0.75 * build_in(ts, 1.7, 10), G.DIM, r=6)

            def labels(im):
                kp = build_in(ts, 0.7, 10)
                tlabel(im, 'PARIS', (float(cx_) + 40, float(cy_) - 22), size=40, color=G.INK, alpha=kp, anchor='lm', tracking=0.14,
                       weight='SemiBold', rise=8 * (1 - kp))
                tlabel(im, 'CHARLES DE GAULLE AIRPORT', (float(cx_) + 40, float(cy_) + 26), size=28, color=G.DIM, alpha=kp, anchor='lm',
                       tracking=0.12, rise=8 * (1 - kp))
                kt = build_in(ts, 1.15, 12)
                tlabel(im, '2013 — European arrest warrant', (float(cx_) + 40, float(cy_) + 110), size=60, color=G.AMBER, alpha=kt,
                       anchor='lm', weight='SemiBold', display=True, tracking=0.02, upper=False, rise=12 * (1 - kt))
                ki = build_in(ts, 0.25, 10)
                (ix, iy), _ = pos_on(inbound, 0.42)
                X, Y = view.px(ix, iy)
                tlabel(im, 'LAYOVER FROM THE US', (float(X), float(Y) - 40), size=26, color=G.DIM, alpha=0.9 * ki, anchor='mm',
                       tracking=0.14)
                kto = build_in(ts, 1.8, 10)
                tlabel(im, 'TURIN', (float(tx) + 26, float(ty)), size=28, color=G.DIM, alpha=0.85 * kto, anchor='lm', tracking=0.14)
                coord_readout(im, view, alpha=0.4)
            finish_frame(clip, fr, labels)


# ===================================================================================================== M_FIELD
def hatch(c, rect, spacing=26, color=G.DIM, a=0.22, width=1.6, angle=45):
    """diagonal hatch clipped to rect (l, t, r, b)."""
    l, t, r, b = rect
    c.save()
    c.clipRect(skia.Rect(l, t, r, b), skia.ClipOp.kIntersect, True)
    pt = spaint(color, a, stroke=width)
    h = b - t
    x = l - h
    while x < r:
        c.drawLine(x, b, x + h, t, pt)
        x += spacing
    c.restore()


def grid_bg(c, a=0.30, step=80, color=G.GRID):
    pt = spaint(color, a, stroke=1.4)
    for x in range(-400, W2 + 400, step):
        c.drawLine(x, -400, x, H2 + 400, pt)
    for y in range(-400, H2 + 400, step):
        c.drawLine(-400, y, W2 + 400, y, pt)


def m_field(stills=None):
    secs = 4.0
    fr = FlatFrame()
    SX = 1640.0                       # seam centre (x)
    G0 = 40.0                         # closed gap
    PY0, PY1 = 900.0, 1280.0          # plate top / bottom
    T_OPEN = (1.25, 1.75)
    T_BREAK = 1.62
    T_SIG = (1.9, 2.7)
    T_KEY = 2.95
    frame_x = SX + G0 / 2
    wire = skia.Path()
    wire.moveTo(frame_x + 160, 1090)
    wire.lineTo(2470, 1090)
    wire.lineTo(2470, 1580)
    wire.lineTo(2860, 1580)
    BOX = (2860.0, 1440.0, 3520.0, 1720.0)
    KP = (1810.0, 450.0, 2010.0, 750.0)
    with make_clip('M_FIELD', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            fr.clear(G.BG)
            c = fr.c
            m = cam_matrix(ts, secs, zoom=(1.0, 1.06), drift=((20, 10), (-50, -10)), centre=(1980, 1080))
            c.setMatrix(m)
            grid_bg(c, a=0.22)
            bg_glow(fr, (1700, 1080), 1100, (24, 25, 30))
            op = G.ease(sg(ts, *T_OPEN))
            gap = G0 + 300 * op
            edge = SX + G0 / 2 - gap               # door's right edge (door slides left)
            kb = build_in(ts, -0.25, 14)
            # frame / wall (hatched), right of the seam
            fl, ft, frr, fb = frame_x, 300.0, 2300.0, 1860.0
            hatch(c, (fl, ft, frr, fb), a=0.20 * kb)
            c.drawPath(trimmed(_rect_path(fl, ft, frr, fb), kb) or skia.Path(), spaint(G.INK, 0.75, stroke=3))
            # door slab, left of the seam
            dl, dt, dr, db = edge - 900, 380.0, edge, 1780.0
            c.drawRect(skia.Rect(dl, dt, dr, db), spaint((22, 23, 27), 1.0))
            dp = trimmed(_rect_path(dl, dt, dr, db), kb)
            if dp is not None:
                c.drawPath(dp, spaint(G.INK, 0.9, stroke=3.5))
            ki = build_in(ts, 0.0, 12)
            c.drawRect(skia.Rect(dl + 60, dt + 60, dr - 60, db - 60), spaint(G.DIM, 0.45 * ki, stroke=2))
            for yy in (dt + 300, db - 300):
                c.drawLine(dl + 60, yy, dr - 60, yy, spaint(G.DIM, 0.3 * ki, stroke=1.6))
            # plates
            kp = build_in(ts, 0.15, 10)
            for (x0, x1) in ((edge - 160, edge - 12), (frame_x + 12, frame_x + 160)):
                c.drawRect(skia.Rect(x0, PY0, x1, PY1), spaint(G.BG2, kp))
                c.drawRect(skia.Rect(x0, PY0, x1, PY1), spaint(G.INK, kp, stroke=3))
                for sx_, sy_ in ((x0 + 26, PY0 + 26), (x1 - 26, PY0 + 26), (x0 + 26, PY1 - 26), (x1 - 26, PY1 - 26)):
                    c.drawCircle(sx_, sy_, 9, spaint(G.INK, 0.8 * kp, stroke=2))
                    c.drawLine(sx_ - 6, sy_, sx_ + 6, sy_, spaint(G.INK, 0.8 * kp, stroke=2))
            # field lines (amber, flowing); stretch while the door opens, snap at T_BREAK
            fa = build_in(ts, 0.45, 12) * (1 - G.ease(sg(ts, T_BREAK, T_BREAK + 0.22)))
            if fa > 0.003:
                xa, xb = edge - 12, frame_x + 12
                flow = skia.Paint(AntiAlias=True, Color4f=sk_color(G.AMBER, fa), Style=skia.Paint.kStroke_Style, StrokeWidth=3)
                flow.setStrokeCap(skia.Paint.kRound_Cap)
                brk = sg(ts, T_BREAK - 0.12, T_BREAK + 0.2)
                flow.setPathEffect(skia.DashPathEffect.Make([22 + 40 * brk, 12 + 60 * brk], -ts * 90))
                glow = skia.Paint(AntiAlias=True, Color4f=sk_color(G.AMBER, 0.25 * fa), Style=skia.Paint.kStroke_Style, StrokeWidth=9,
                                  MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 7))
                fp = skia.Path()
                for yy in np.linspace(PY0 + 50, PY1 - 50, 6):
                    fp.moveTo(xa, yy)
                    fp.lineTo(xb, yy)
                for k in range(1, 6):
                    for top in (True, False):
                        y0 = PY0 + 6 if top else PY1 - 6
                        sgn = -1 if top else 1
                        fp.moveTo(xa - 22 * k, y0)
                        fp.cubicTo(xa - 22 * k - 10 * k, y0 + sgn * 70 * k, xb + 22 * k + 10 * k, y0 + sgn * 70 * k, xb + 22 * k, y0)
                c.drawPath(fp, glow)
                c.drawPath(fp, flow)
            # break flash at the seam
            fl_a = sg(ts, T_BREAK, T_BREAK + 0.05) * (1 - sg(ts, T_BREAK + 0.05, T_BREAK + 0.6))
            if fl_a > 0:
                c.drawCircle((edge + frame_x) / 2, 1090, 120, spaint(G.RED, 0.35 * fl_a, glow=60))
            # signal wire + red pulse to the outside firm
            kw = build_in(ts, 0.55, 14)
            wp = trimmed(wire, kw)
            if wp is not None:
                c.drawPath(wp, spaint(G.DIM, 0.6, stroke=2.5))
            ks = G.ease(sg(ts, *T_SIG))
            sp = trimmed(wire, ks) if ks > 0 else None
            if sp is not None:
                c.drawPath(sp, spaint(G.RED, 0.45, stroke=12, glow=9))
                c.drawPath(sp, spaint(G.RED, 1.0, stroke=4.5))
                (hx, hy), _ = pos_on(wire, ks)
                c.drawCircle(hx, hy, 12, spaint(G.RED, 1.0))
                c.drawCircle(hx, hy, 34, spaint(G.RED, 0.35, glow=16))
            # outside security firm box
            kbx = build_in(ts, 0.65, 12)
            arrived = sg(ts, T_SIG[1] - 0.02, T_SIG[1] + 0.08)
            pulse = 0.5 + 0.5 * math.cos((ts - T_SIG[1]) * 9.0) if ts > T_SIG[1] else 1.0
            bp = trimmed(_rect_path(*BOX), kbx)
            if bp is not None:
                c.drawPath(bp, spaint(G.INK, 0.85 * (1 - arrived), stroke=3))
                if arrived > 0:
                    c.drawRect(skia.Rect(*BOX), spaint(G.RED, 0.10 * arrived * pulse))
                    c.drawPath(bp, spaint(G.RED, arrived, stroke=3.5))
                    c.drawPath(bp, spaint(G.RED, 0.4 * arrived * pulse, stroke=14, glow=12))
            # keypad by the door
            kk = build_in(ts, T_KEY, 10)
            if kk > 0:
                l, t_, r, b = KP
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(l, t_, r, b), 10, 10), spaint(G.BG2, kk))
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(l, t_, r, b), 10, 10), spaint(G.INK, kk, stroke=3))
                c.drawRect(skia.Rect(l + 24, t_ + 22, r - 24, t_ + 62), spaint(G.AMBER, 0.85 * kk, stroke=2))
                for row in range(4):
                    for col in range(3):
                        kx = l + 30 + col * 50
                        ky = t_ + 86 + row * 48
                        d_ = build_in(ts, T_KEY + 0.05 + (row * 3 + col) * 0.015, 5)
                        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(kx, ky, kx + 38, ky + 34), 5, 5), spaint(G.INK, 0.8 * d_, stroke=2))
                lead = skia.Path()
                lead.moveTo((l + r) / 2, b + 10)
                lead.lineTo((l + r) / 2, PY0 - 20)
                lp = trimmed(lead, build_in(ts, T_KEY + 0.15, 10))
                if lp is not None:
                    pe = spaint(G.INK, 0.6 * kk, stroke=2)
                    pe.setPathEffect(skia.DashPathEffect.Make([10, 10], 0))
                    c.drawPath(lp, pe)

            def labels(im):
                def L_(txt, x, y, t0, size=32, color=G.INK, anchor='lm', a=1.0, weight='Medium', tr=0.12):
                    k_ = build_in(ts, t0, 10)
                    X, Y = map_pt(m, x, y)
                    tlabel(im, txt, (X, Y), size=size, color=color, alpha=a * k_, anchor=anchor, tracking=tr, weight=weight,
                           rise=8 * (1 - k_))
                L_('VAULT DOOR', edge - 860, 330, 0.0, color=G.DIM)
                L_('FRAME', frame_x + 30, 250, 0.05, color=G.DIM)
                L_('MAGNETIC PLATES', (edge + frame_x) / 2, 1940, 0.3, anchor='mm')
                L_('FIELD ACROSS THE SEAM', (edge + frame_x) / 2, 1994, 0.55, size=28, color=G.AMBER, anchor='mm',
                   a=1 - sg(ts, T_BREAK, T_BREAK + 0.25))
                L_('FIELD BROKEN', (edge + frame_x) / 2, 1994, T_BREAK + 0.05, size=28, color=G.RED, anchor='mm')
                bx0, by0, bx1, by1 = BOX
                L_('OUTSIDE SECURITY FIRM', (bx0 + bx1) / 2, (by0 + by1) / 2, 0.75, size=34, anchor='mm', weight='SemiBold')
                L_('ALARM', bx0, by0 - 46, T_SIG[1] + 0.02, size=30, color=G.RED)
                L_('KEYPAD', KP[2] + 40, KP[1] + 40, T_KEY + 0.08, size=34, weight='SemiBold')
                L_('THE CODE SWITCHES THE FIELD OFF', KP[2] + 40, KP[1] + 96, T_KEY + 0.2, size=28, color=G.DIM)
            finish_frame(clip, fr, labels)


def _rect_path(l, t, r, b):
    p = skia.Path()
    p.moveTo(l, t)
    p.lineTo(r, t)
    p.lineTo(r, b)
    p.lineTo(l, b)
    p.close()
    return p


# ===================================================================================================== M_SENSORS
def m_sensors(stills=None):
    secs = 4.5
    fr = Frame()
    RX, RY, WT = 5.0, 3.4, 0.45            # room half-size (m), wall thickness
    DOOR = (-1.1, 1.1)                      # door opening on the south wall (x range)
    room = skia.Rect(-RX, -RY, RX, RY)
    cells = []                              # (x0, y0, x1, y1) box columns along N, W, E walls
    d = 0.42
    for k in range(30):
        x0 = -RX + 0.35 + k * ((2 * RX - 0.7) / 30)
        cells.append((x0, RY - d, x0 + (2 * RX - 0.7) / 30, RY, 0.0 + k * 0.012))
    for side in (-1, 1):
        for k in range(18):
            y0 = RY - 0.35 - d - (k + 1) * ((2 * RY - 1.6) / 18)
            x0 = -RX if side < 0 else RX - d
            cells.append((x0, y0, x0 + d, y0 + (2 * RY - 1.6) / 18, 0.12 + k * 0.012))
    CAM = ((-RX + 0.35, -RY + 0.35), 46.0, 24, 8.0, 0.75)        # pos, bearing, half-angle, range, t
    HM = ((RX - 0.35, RY - 0.75), 228.0, 38, 9.0, 1.45)
    LS = ((0.4, 0.2), 2.15)
    RAD = ((-RX + 0.5, -0.4), 90.0, 2.85)
    with make_clip('M_SENSORS', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            e = G.ease((ts + 0.5) / (secs + 1.0))
            view = View(lerp(0.25, -0.15, e), lerp(-0.55, -0.25, e), lerp(17.5, 16.2, e), rot=lerp(-4.0, 3.0, e),
                        pitch=lerp(30, 34, e))
            fr.clear(G.BG)
            fr.begin(view)
            c = fr.c
            # floor
            c.drawRect(room, spaint((22, 23, 27), 1.0))
            gp = spaint(G.GRID, 0.35, stroke=1.4 / view.s)
            for gx in np.arange(-RX, RX + 0.01, 0.5):
                c.drawLine(gx, -RY, gx, RY, gp)
            for gy in np.arange(-RY, RY + 0.01, 0.5):
                c.drawLine(-RX, gy, RX, gy, gp)
            # walls (hatched band) with the door gap
            kw = build_in(ts, -0.3, 14)
            wall = skia.Path()
            wall.addRect(skia.Rect(-RX - WT, -RY - WT, RX + WT, RY + WT))
            wall.addRect(room)
            wall.setFillType(skia.PathFillType.kEvenOdd)
            gapr = skia.Path()
            gapr.addRect(skia.Rect(DOOR[0], -RY - WT - 0.05, DOOR[1], -RY + 0.01))
            wall = skia.Op(wall, gapr, skia.PathOp.kDifference_PathOp)
            c.drawPath(wall, spaint((34, 35, 40), kw))
            c.save()
            c.clipPath(wall, skia.ClipOp.kIntersect, True)
            hp = spaint(G.DIM, 0.28 * kw, stroke=1.4 / view.s)
            for k in np.arange(-RX - 8, RX + 8, 0.22):
                c.drawLine(k, -RY - WT, k + 2 * (RY + WT), RY + WT, hp)
            c.restore()
            c.drawPath(wall, spaint(G.INK, 0.7 * kw, stroke=2.4 / view.s))
            # door slab (closed, drawn as a heavy bar across the opening)
            c.drawRect(skia.Rect(DOOR[0], -RY - WT * 0.7, DOOR[1], -RY - WT * 0.35), spaint(G.INK, 0.5 * build_in(ts, 0.1, 10)))
            # box columns
            for (x0, y0, x1, y1, td) in cells:
                kc = build_in(ts, 0.05 + td, 6)
                if kc <= 0:
                    continue
                c.drawRect(skia.Rect(x0 + 0.015, y0 + 0.015, x1 - 0.015, y1 - 0.015), spaint(G.BG2, kc))
                c.drawRect(skia.Rect(x0 + 0.015, y0 + 0.015, x1 - 0.015, y1 - 0.015), spaint(G.DIM, 0.75 * kc, stroke=1.6 / view.s))
            # sensors, clipped to the room
            c.save()
            c.clipRect(room, skia.ClipOp.kIntersect, True)
            for (pos, brg, half, rng, t0), col in ((CAM, G.INK), (HM, G.AMBER)):
                k = build_in(ts, t0 + 0.06, 12)
                if k > 0:
                    a_ = 0.42 if col == G.AMBER else 0.20
                    sh = skia.GradientShader.MakeRadial(skia.Point(*pos), rng * (0.6 + 0.4 * k),
                                                        [sk_color(col, a_ * k).toColor(), sk_color(col, 0.06 * k).toColor(),
                                                         sk_color(col, 0).toColor()], [0.0, 0.6, 1.0])
                    c.drawPath(cone_path(pos, brg, half * (0.3 + 0.7 * k), rng * (0.6 + 0.4 * k)), skia.Paint(AntiAlias=True, Shader=sh))
                    th = math.radians(90 - brg)
                    for sgn in (-1, 1):
                        aa = th + sgn * math.radians(half * (0.3 + 0.7 * k))
                        c.drawLine(pos[0], pos[1], pos[0] + rng * 0.75 * math.cos(aa), pos[1] + rng * 0.75 * math.sin(aa),
                                   spaint(col, 0.55 * k, stroke=1.8 / view.s))
            # light sensor on the ceiling: coverage ring + rays
            kl = build_in(ts, LS[1], 12)
            if kl > 0:
                (lx, ly) = LS[0]
                c.drawCircle(lx, ly, 3.2 * G.ease_out(kl), spaint(G.INK, 0.06 * kl))
                pr = spaint(G.INK, 0.45 * kl, stroke=1.8 / view.s)
                pr.setPathEffect(skia.DashPathEffect.Make([0.18, 0.14], -ts * 0.3))
                c.drawCircle(lx, ly, 3.2 * G.ease_out(kl), pr)
                for k in range(12):
                    a_ = math.radians(k * 30 + ts * 8)
                    c.drawLine(lx + 0.35 * math.cos(a_), ly + 0.35 * math.sin(a_), lx + (0.35 + 0.5 * kl) * math.cos(a_),
                               ly + (0.35 + 0.5 * kl) * math.sin(a_), spaint(G.INK, 0.7 * kl, stroke=2.0 / view.s))
            # radar: Doppler wavefronts sweeping into the room
            kr = build_in(ts, RAD[2], 10)
            if kr > 0:
                (rx_, ry_) = RAD[0]
                for k in range(5):
                    ph = ((ts - RAD[2]) * 1.1 + k / 5.0) % 1.0
                    rr = 0.4 + ph * 8.5
                    arc = skia.Path()
                    arc.addArc(skia.Rect(rx_ - rr, ry_ - rr, rx_ + rr, ry_ + rr), -55, 110)
                    c.drawPath(arc, spaint(G.INK, 0.55 * kr * (1 - ph) ** 1.4, stroke=2.2 / view.s))
            c.restore()
            # sensor glyphs (screen space)
            fr.screen()
            for (pos, brg, half, rng, t0), col in ((CAM, G.INK), (HM, G.AMBER)):
                k = build_in(ts, t0, 8)
                ang, xy = screen_angle_raw(view, pos, brg, step=0.5)
                if col == G.INK:
                    camera_icon(fr, xy, ang, k, scale=1.0 + 0.2 * k)
                elif k > 0:
                    c.drawCircle(xy[0], xy[1], 16 * (0.6 + 0.4 * k), spaint(G.AMBER, k))
                    c.drawCircle(xy[0], xy[1], 28 * (0.6 + 0.4 * k), spaint(G.AMBER, 0.8 * k, stroke=3))
            lx_, ly_ = view.px(*LS[0])
            if kl > 0:
                c.drawCircle(float(lx_), float(ly_), 13, spaint(G.INK, kl))
            rx2, ry2 = view.px(*RAD[0])
            if kr > 0:
                c.drawRect(skia.Rect(float(rx2) - 10, float(ry2) - 22, float(rx2) + 10, float(ry2) + 22), spaint(G.INK, kr))

            def labels(im):
                def at(wx, wy):
                    X, Y = view.px(wx, wy)
                    return float(X), float(Y)
                k0 = build_in(ts, 0.3, 10)
                X, Y = at(0, RY + WT)
                tlabel(im, '189 SAFE-DEPOSIT BOXES', (X, Y - 40), size=34, color=G.INK, alpha=k0, anchor='ms', tracking=0.12,
                       rise=8 * (1 - k0))
                kd = build_in(ts, 0.2, 10)
                X, Y = at(0, -RY - WT)
                tlabel(im, 'VAULT DOOR', (X, Y + 52), size=30, color=G.DIM, alpha=kd, anchor='ma', tracking=0.14)
                X, Y = at(*CAM[0])
                kc = build_in(ts, CAM[4] + 0.1, 10)
                tlabel(im, 'CAMERA', (X + 46, Y + 40), size=32, color=G.INK, alpha=kc, anchor='lm', tracking=0.12, weight='SemiBold',
                       rise=8 * (1 - kc))
                X, Y = at(*HM[0])
                kh = build_in(ts, HM[4] + 0.1, 10)
                tlabel(im, 'HEAT + MOTION SENSOR', (X - 50, Y + 56), size=32, color=G.AMBER, alpha=kh, anchor='rm', tracking=0.12,
                       weight='SemiBold', rise=8 * (1 - kh))
                kl2 = build_in(ts, LS[1] + 0.1, 10)
                tlabel(im, 'LIGHT SENSOR', (float(lx_) + 34, float(ly_) - 14), size=32, color=G.INK, alpha=kl2, anchor='lm',
                       tracking=0.12, weight='SemiBold', rise=8 * (1 - kl2))
                tlabel(im, 'ON THE CEILING', (float(lx_) + 34, float(ly_) + 30), size=26, color=G.DIM, alpha=kl2, anchor='lm',
                       tracking=0.12)
                kr2 = build_in(ts, RAD[2] + 0.1, 10)
                tlabel(im, 'RADAR', (float(rx2) + 40, float(ry2) + 64), size=32, color=G.INK, alpha=kr2, anchor='lm',
                       tracking=0.12, weight='SemiBold', rise=8 * (1 - kr2))
                G.credit(im, 'SCHEMATIC — NOT TO SCALE', alpha=0.55)
            finish_frame(clip, fr, labels)


# ===================================================================================================== M_ROUTE_E19
def m_route_e19(stills=None):
    secs = 4.9                                     # v2 re-cut: E19 tag 1.7, route 2.5-3.6, woods 4.0
    o_raw = data('osm_antwerp')
    ANT = P(4.4185, 51.2152)                       # the diamond district
    O = ANT
    L = MapLayers(O)
    fr = Frame()
    a1 = np.asarray(o_raw['a1'], float)
    conn = np.array([ANT, P(4.4160, 51.2050), P(4.4128, 51.1960)])      # schematic city leg to the A1 (south ring)
    pts = np.vstack([conn, a1])
    route = lines_path([pts.tolist()], O)
    route_len = skia.PathMeasure(route, False).getLength()
    BRU = P(4.3517, 50.8466)
    MEC = P(4.4777, 51.0257)
    WOODS = P(4.4185, 51.0120)                     # approximate: "woods off the E19" (no precise place in FACTS)
    e19_lbl = pts[int(len(pts) * 0.30)]
    zp = ZoomPath([(-0.6, 5.3e4, P(4.43, 51.175)), (0.0, 5.5e4, P(4.43, 51.165)), (2.55, 9.8e4, P(4.44, 51.03)),
                   (5.5, 1.02e5, P(4.442, 51.022))])
    T_R = (2.5, 3.6)
    with make_clip('M_ROUTE_E19', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            w, (cx, cy) = zp(ts)
            e = G.ease((ts + 0.5) / (secs + 1.0))
            view = View(cx, cy, w, rot=lerp(1.5, -1.5, e), origin=O)
            fr.clear(OCEAN)
            fr.begin(view)
            draw_base(fr, L, view, t_hi=1.0, hi_iso=('BEL',), hi_outline=0.0, grat_a=0.0)
            fr.stroke(L.roads, ROADC, 2.2, 0.45, name='roads')
            fr.stroke(L.prov_bel, BORDER, 1.6, 0.45, dash=(8, 8), name='prov')
            # the E19 itself, faint, before the route runs along it
            fr.stroke(route, G.INK, 3.0, 0.3 * build_in(ts, 0.6, 14), name='e19')
            k = G.ease(sg(ts, *T_R))
            head = draw_route(fr, route, k, width=5.5, origin=O)
            # marks
            ax, ay = view.px(*ANT)
            pin(fr, None, (float(ax), float(ay)), -0.2, ts, color=G.AMBER, r=10)
            if head is not None and 0 < k < 1:
                hx, hy = view.px(*head)
                dot(fr, (float(hx), float(hy)), 1.0, G.AMBER, r=9)
            wx, wy = view.px(*WOODS)
            kw_ = build_in(ts, 3.72, 12)
            if kw_ > 0:
                fr.screen()
                rr = 3500 * view.s
                fr.c.drawCircle(float(wx), float(wy), rr, spaint(G.AMBER, 0.10 * kw_, glow=rr * 0.35))
                pd = spaint(G.AMBER, 0.55 * kw_, stroke=2.5)
                pd.setPathEffect(skia.DashPathEffect.Make([10, 9], -ts * 12))
                fr.c.drawCircle(float(wx), float(wy), rr * (0.8 + 0.2 * kw_), pd)
            pin(fr, None, (float(wx), float(wy)), 3.72, ts, color=G.AMBER, r=10)
            bx, by = view.px(*BRU)
            kb = build_in(ts, 3.4, 10)
            dot(fr, (float(bx), float(by)), kb, G.INK, r=8)
            mx, my = view.px(*MEC)
            dot(fr, (float(mx), float(my)), 0.7 * build_in(ts, 2.1, 10), G.DIM, r=6)

            def labels(im):
                ka = build_in(ts, -0.15, 10)
                tlabel(im, 'ANTWERP', (float(ax) + 36, float(ay)), size=36, color=G.INK, alpha=ka, anchor='lm', tracking=0.14,
                       rise=8 * (1 - ka))
                ex, ey = view.px(*e19_lbl)
                ke = build_in(ts, 1.45, 10)
                if ke > 0:
                    sp = _text_img('E19', 30, 'SemiBold', G.BG, 0.08, False)
                    bw = sp[3] + 34
                    X, Y = float(ex) + 46, float(ey)
                    from PIL import ImageDraw
                    lay = Image.new('RGBA', (int(bw) + 8, 56), (0, 0, 0, 0))
                    ImageDraw.Draw(lay).rounded_rectangle((2, 2, bw + 2, 52), radius=8, fill=G.INK + (int(230 * ke),))
                    im.alpha_composite(lay, (int(X), int(Y - 28)))
                    tlabel(im, 'E19', (X + bw / 2 + 2, Y), size=30, color=G.BG, alpha=ke, anchor='mm', weight='SemiBold', tracking=0.08)
                    tlabel(im, 'MOTORWAY TO BRUSSELS', (X + bw + 22, Y), size=28, color=G.DIM, alpha=ke * (1 - sg(ts, 2.6, 3.0)),
                           anchor='lm', tracking=0.12)
                tlabel(im, 'MECHELEN', (float(mx) + 26, float(my)), size=26, color=G.DIM, alpha=0.75 * build_in(ts, 2.2, 10),
                       anchor='lm', tracking=0.12)
                kw2 = build_in(ts, 3.8, 10)
                tlabel(im, 'WOODS OFF THE E19', (float(wx) - 40, float(wy)), size=36, color=G.AMBER, alpha=kw2, anchor='rm',
                       tracking=0.12, weight='SemiBold', rise=8 * (1 - kw2))
                tlabel(im, 'BRUSSELS', (float(bx) + 30, float(by)), size=36, color=G.INK, alpha=kb, anchor='lm', tracking=0.14,
                       rise=8 * (1 - kb))
                credit_osm(im, alpha=0.6)
                coord_readout(im, view, alpha=0.4)
            finish_frame(clip, fr, labels)


# ===================================================================================================== M_LINK
def _icon(c, kind, cx, cy, k, col=G.INK):
    """minimal line icons (2x px, ~120 px box) for the evidence graph."""
    if k <= 0:
        return
    pt = spaint(col, k, stroke=3.2)
    if kind == 'receipts':
        for j, (dx, dy) in enumerate(((-18, 8), (14, -6))):
            x0, y0, x1, y1 = cx - 34 + dx, cy - 52 + dy, cx + 34 + dx, cy + 52 + dy
            p = skia.Path()
            p.moveTo(x0, y1)
            p.lineTo(x0, y0)
            p.lineTo(x1, y0)
            p.lineTo(x1, y1)
            n = 6
            for q in range(n):
                xa = x1 - (q + 0.5) * (x1 - x0) / n
                xb = x1 - (q + 1) * (x1 - x0) / n
                p.lineTo(xa, y1 - 9)
                p.lineTo(xb, y1)
            c.drawPath(p, spaint(G.BG2, k))
            c.drawPath(p, pt)
            for q in range(4):
                c.drawLine(x0 + 12, y0 + 18 + q * 16, x1 - 12 - (14 if q % 2 else 0), y0 + 18 + q * 16, spaint(col, 0.6 * k, stroke=2))
    elif kind == 'envelopes':
        for dx, dy in ((-14, -12), (10, 10)):
            x0, y0, x1, y1 = cx - 56 + dx, cy - 36 + dy, cx + 56 + dx, cy + 36 + dy
            c.drawRect(skia.Rect(x0, y0, x1, y1), spaint(G.BG2, k))
            c.drawRect(skia.Rect(x0, y0, x1, y1), pt)
            c.drawLine(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + 4, pt)
            c.drawLine(x1, y0, (x0 + x1) / 2, (y0 + y1) / 2 + 4, pt)
    elif kind == 'stones':
        for dx, dy, sz in ((-30, 10, 1.0), (26, -14, 0.8), (22, 30, 0.6)):
            x, y = cx + dx, cy + dy
            p = skia.Path()
            w_, h1, h2 = 30 * sz, 12 * sz, 30 * sz
            p.moveTo(x - w_, y)
            p.lineTo(x - w_ * 0.55, y - h1)
            p.lineTo(x + w_ * 0.55, y - h1)
            p.lineTo(x + w_, y)
            p.lineTo(x, y + h2)
            p.close()
            c.drawPath(p, spaint(G.BG2, k))
            c.drawPath(p, pt)
            c.drawLine(x - w_, y, x + w_, y, spaint(col, 0.7 * k, stroke=2))
            c.drawLine(x - w_ * 0.3, y, x, y + h2, spaint(col, 0.5 * k, stroke=1.6))
            c.drawLine(x + w_ * 0.3, y, x, y + h2, spaint(col, 0.5 * k, stroke=1.6))
    elif kind == 'paperwork':
        for j in range(3):
            o_ = (2 - j) * 12
            x0, y0, x1, y1 = cx - 42 + o_, cy - 56 + o_ * 0.4 - 10, cx + 42 + o_, cy + 50 + o_ * 0.4 - 10
            c.drawRect(skia.Rect(x0 - 14, y0, x1 - 14, y1), spaint(G.BG2, k))
            c.drawRect(skia.Rect(x0 - 14, y0, x1 - 14, y1), pt)
        x0, y0 = cx - 56, cy - 66
        for q in range(5):
            c.drawLine(x0 + 14, y0 + 22 + q * 16, x0 + 70 - (18 if q == 4 else 0), y0 + 22 + q * 16, spaint(col, 0.6 * k, stroke=2))
    elif kind == 'sandwich':
        p = skia.Path()
        p.addRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 70, cy - 24, cx + 62, cy + 24), 24, 24))
        bite = skia.Path()
        bite.addCircle(cx + 66, cy - 6, 26)
        p = skia.Op(p, bite, skia.PathOp.kDifference_PathOp)
        c.drawPath(p, spaint(G.BG2, k))
        c.drawPath(p, pt)
        c.drawLine(cx - 60, cy + 2, cx + 40, cy + 2, spaint(col, 0.6 * k, stroke=2))
        for dx in (-40, -10, 18):
            c.drawCircle(cx + dx, cy - 4, 9, spaint(col, 0.7 * k, stroke=2))


def m_link(stills=None):
    secs = 3.8                                  # v2 re-cut: links converge, "ONE TENANT" lands 1.7-2.5
    fr = FlatFrame()
    items = [('receipts', 'RECEIPTS'), ('envelopes', 'ENVELOPES'), ('stones', 'LOOSE STONES'), ('paperwork', 'PAPERWORK'),
             ('sandwich', 'HALF A SANDWICH')]
    nodes = []
    for k_, (kind, lbl) in enumerate(items):
        nodes.append((kind, lbl, 1080 - 60 * abs(k_ - 2) ** 1.5, 1060 + (k_ - 2) * 335, -0.3 + k_ * 0.08))
    BX, BY = 2900.0, 1060.0                     # building centre
    T_L = 0.2
    T_B = 1.4
    with make_clip('M_LINK', secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            fr.clear(G.BG)
            c = fr.c
            m = cam_matrix(ts, secs, zoom=(1.0, 1.055), drift=((-20, 6), (30, -10)), centre=(1960, 1080))
            c.setMatrix(m)
            grid_bg(c, a=0.16, step=96)
            bg_glow(fr, (BX, BY), 1000, (30, 28, 26), a=G.ease(sg(ts, T_B - 0.2, T_B + 0.6)))
            # links (behind the cards)
            for j, (kind, lbl, x, y, t0) in enumerate(nodes):
                path = skia.Path()
                sx, sy = x + 110, y - 6
                ex, ey = BX - 230, BY - 120 + j * 60
                path.moveTo(sx, sy)
                path.cubicTo(sx + 420, sy, ex - 520, ey, ex, ey)
                k = G.ease(sg(ts, T_L + j * 0.08, T_L + j * 0.08 + 0.8))
                tp = trimmed(path, k)
                if tp is not None:
                    c.drawPath(tp, spaint(G.AMBER, 0.35, stroke=10, glow=8))
                    c.drawPath(tp, spaint(G.AMBER, 0.95, stroke=3.5))
                    if k < 1:
                        (hx, hy), _ = pos_on(path, k)
                        c.drawCircle(hx, hy, 9, spaint(G.AMBER, 1.0))
                    else:
                        c.drawCircle(ex, ey, 7, spaint(G.AMBER, 1.0))
                c.drawCircle(sx, sy, 6, spaint(G.INK, 0.8 * build_in(ts, t0 + 0.1, 8)))
            # evidence cards
            for kind, lbl, x, y, t0 in nodes:
                kc = build_in(ts, t0, 10)
                if kc <= 0:
                    continue
                c.save()
                c.translate(x, y + 18 * (1 - kc))
                r = skia.RRect.MakeRectXY(skia.Rect(-100, -100, 100, 88), 14, 14)
                c.drawRRect(r, spaint(G.BG2, 0.95 * kc))
                c.drawRRect(r, spaint(G.INK, 0.35 * kc, stroke=2))
                _icon(c, kind, 0, -6, kc)
                c.restore()
            # building: the office in the Antwerp Diamond Centre
            kb = build_in(ts, -0.1, 14)
            lit = G.ease(sg(ts, T_B, T_B + 0.35))
            bl, bt, br, bb = BX - 200, BY - 330, BX + 200, BY + 330
            outline = _rect_path(bl, bt, br, bb)
            op_ = trimmed(outline, kb)
            c.drawRect(skia.Rect(bl, bt, br, bb), spaint((24, 24, 28), kb))
            if op_ is not None:
                c.drawPath(op_, spaint(G.INK, 0.8 * (1 - lit), stroke=3.2))
                if lit > 0:
                    c.drawPath(outline, spaint(G.AMBER, 0.35 * lit, stroke=14, glow=12))
                    c.drawPath(outline, spaint(G.AMBER, lit, stroke=3.6))
            for fl in range(6):
                for col_ in range(4):
                    wx0 = bl + 44 + col_ * 84
                    wy0 = bt + 50 + fl * 92
                    on = (fl == 2 and col_ == 2)
                    kwin = build_in(ts, 0.0 + (fl * 4 + col_) * 0.012, 6)
                    c.drawRect(skia.Rect(wx0, wy0, wx0 + 50, wy0 + 56), spaint(G.DIM, 0.45 * kwin, stroke=2))
                    if on and lit > 0:
                        c.drawRect(skia.Rect(wx0, wy0, wx0 + 50, wy0 + 56), spaint(G.AMBER, lit))
                        c.drawRect(skia.Rect(wx0 - 8, wy0 - 8, wx0 + 58, wy0 + 64), spaint(G.AMBER, 0.4 * lit, glow=14))
            c.drawLine(bl - 120, bb, br + 120, bb, spaint(G.INK, 0.5 * kb, stroke=2.5))

            def labels(im):
                for kind, lbl, x, y, t0 in nodes:
                    kc = build_in(ts, t0 + 0.08, 10)
                    X, Y = map_pt(m, x, y + 132)
                    tlabel(im, lbl, (X, Y), size=28, color=G.INK, alpha=0.9 * kc, anchor='mm', tracking=0.12, rise=6 * (1 - kc))
                X, Y = map_pt(m, nodes[0][2] - 100, nodes[0][3] - 150)
                k0 = build_in(ts, -0.3, 10)
                tlabel(im, 'FOUND IN THE WOODS', (X, Y), size=30, color=G.DIM, alpha=k0, anchor='ls', tracking=0.16)
                kt = build_in(ts, T_B - 0.05, 12)
                X, Y = map_pt(m, BX, BY + 330 + 86)
                tlabel(im, 'ANTWERP DIAMOND CENTRE', (X, Y), size=40, color=G.INK, alpha=kt, anchor='mm', weight='SemiBold',
                       tracking=0.1, rise=10 * (1 - kt))
                X, Y = map_pt(m, BX, BY + 330 + 140)
                tlabel(im, 'OFFICE', (X, Y), size=30, color=G.DIM, alpha=kt, anchor='mm', tracking=0.2, rise=8 * (1 - kt))
                ko = build_in(ts, 1.5, 9)
                X, Y = map_pt(m, BX, BY - 330 - 70)
                tlabel(im, 'ONE TENANT', (X, Y), size=104, color=G.AMBER, alpha=ko, anchor='ms', weight='SemiBold', display=True,
                       tracking=0.06, rise=16 * (1 - ko))
            finish_frame(clip, fr, labels)


# ===================================================================================================== E_* photo moves
E_SLOTS = ['E_CENTRAAL', 'E_DISTRICT', 'E_ADC', 'E_DIAMONDS', 'E_WOODS', 'E_E19', 'E_COURT', 'E_MILAN', 'E_CDG']
E_BEATS = {'E_CENTRAAL': 'S04', 'E_DISTRICT': 'S04', 'E_ADC': 'S06', 'E_DIAMONDS': 'S05', 'E_WOODS': 'S33', 'E_E19': 'S31',
           'E_COURT': 'S40', 'E_MILAN': 'S49', 'E_CDG': 'S50'}
# per-slot camera: (zoom start, zoom end, truck x, truck y, dolly) — truck in fractions of frame height, applied with depth
E_MOVES = {'E_CENTRAAL': (1.05, 1.11, -0.020, 0.006, 0.07), 'E_DISTRICT': (1.06, 1.10, 0.024, 0.0, 0.06),
           'E_ADC': (1.05, 1.11, -0.012, 0.010, 0.07), 'E_DIAMONDS': (1.04, 1.12, 0.010, -0.008, 0.08),
           'E_WOODS': (1.05, 1.10, 0.026, 0.0, 0.06), 'E_E19': (1.05, 1.11, -0.018, 0.004, 0.07),
           'E_COURT': (1.05, 1.10, 0.016, 0.006, 0.06), 'E_MILAN': (1.05, 1.11, -0.016, 0.0, 0.07),
           'E_CDG': (1.05, 1.10, 0.020, 0.004, 0.06)}
E_PICK = {}                     # slot -> filename override after looking at the candidates
MIDAS = os.path.expanduser('~/.cache/mg_maps/models/midas_small.onnx')
MIDAS_URL = 'https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.onnx'


def load_credits():
    path = os.path.join(EVID, 'credits.json')
    try:
        raw = json.load(open(path))
    except Exception:
        return {}
    out = {}
    items = raw.items() if isinstance(raw, dict) else [(None, v) for v in raw]
    for k, v in items:
        if isinstance(v, dict):
            fn = v.get('file') or v.get('filename') or v.get('path') or v.get('local') or k
            if fn:
                out[os.path.basename(str(fn))] = v
            if isinstance(k, str) and k not in out:
                out[os.path.basename(k)] = v
        elif isinstance(v, list) and isinstance(k, str):            # {slot: [entries]}
            for e_ in v:
                if isinstance(e_, dict):
                    fn = e_.get('file') or e_.get('filename') or e_.get('path') or e_.get('local')
                    if fn:
                        out[os.path.basename(str(fn))] = dict(e_, slot=k)
    return out


def credit_line(entry):
    if not entry:
        return None
    for k in ('credit', 'credit_line', 'attribution'):
        v = entry.get(k)
        if isinstance(v, str) and v.strip():
            v = v.strip()
            return v if v.lower().startswith('photo') else f'Photo: {v}'
    author = next((entry.get(k) for k in ('author', 'artist', 'creator', 'by', 'photographer') if entry.get(k)), None)
    lic = next((entry.get(k) for k in ('licence_short', 'license_short', 'licence', 'license', 'license_name') if entry.get(k)), None)
    if not author or not lic:
        return None
    return f'Photo: {author}, {lic} via Wikimedia Commons'


def e_candidates(cid):
    if not os.path.isdir(EVID):
        return []
    fs = [f for f in sorted(os.listdir(EVID)) if (f.startswith(cid + '_') or f.startswith(cid + '.')) and
          f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'))]
    return [f for f in fs if os.path.getsize(os.path.join(EVID, f)) > 10000]


_MIDAS = None


def depth_map(rgb):
    """relative inverse depth (1 = near, 0 = far) from MiDaS small (CPU, 256 px), smoothed."""
    global _MIDAS
    import cv2
    if _MIDAS is None:
        import onnxruntime as ort
        if not os.path.exists(MIDAS):
            _fetch(MIDAS_URL, MIDAS)
        _MIDAS = ort.InferenceSession(MIDAS, providers=['CPUExecutionProvider'])
    x = cv2.resize(rgb, (256, 256), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = _MIDAS.run(None, {_MIDAS.get_inputs()[0].name: x})[0][0]
    lo, hi = np.percentile(d, 2), np.percentile(d, 98)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1).astype(np.float32)
    d = cv2.resize(d, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
    k = max(3, int(rgb.shape[1] * 0.012) | 1)
    d = cv2.GaussianBlur(d, (0, 0), k / 2.0)
    return np.clip(d, 0, 1)


def e_photo(cid, stills=None, pick=None):
    import cv2
    cands = e_candidates(cid)
    if not cands:
        print(f'[mg_maps] {cid}: no photo in {EVID} — skipped', flush=True)
        return False
    credits = load_credits()
    fn = pick or E_PICK.get(cid) or cands[0]
    entry = credits.get(fn)
    line = credit_line(entry)
    if line is None:
        print(f'[mg_maps] {cid}: no usable credit for {fn} in credits.json — skipped', flush=True)
        return False
    src = Image.open(os.path.join(EVID, fn))
    src = G.grade_photo(src.convert('RGB'))
    # 16:9 cover crop (vertical bias from E_CROP_Y), resized to the 2x canvas
    sw, sh = src.size
    ar = W2 / H2
    if sw / sh > ar:
        cw, ch = sh * ar, sh
    else:
        cw, ch = sw, sw / ar
    cy_bias = E_CROP_Y.get(cid, 0.5)
    x0 = (sw - cw) / 2
    y0 = (sh - ch) * cy_bias
    img = src.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W2, H2), Image.LANCZOS)
    rgb = np.asarray(img).astype(np.uint8)
    dep = depth_map(rgb)
    z0, z1, tx, ty, dolly = E_MOVES.get(cid, (1.05, 1.10, 0.02, 0.0, 0.06))
    secs = 4.0
    yy, xx = np.mgrid[0:H2, 0:W2].astype(np.float32)
    qx, qy = (xx - W2 / 2) / H2, (yy - H2 / 2) / H2
    with make_clip(cid, secs, stills) as clip:
        for i, t in clip.frames():
            ts = i / FPS
            e = G.ease((ts + 0.5) / (secs + 1.0))
            ez = lerp(z0, z1, e)
            d = dep
            for _ in range(2):
                z = ez * (1 + dolly * e * d)
                sx = (qx - tx * (e - 0.5) * 2 * d) / z * H2 + W2 / 2
                sy = (qy - ty * (e - 0.5) * 2 * d) / z * H2 + H2 / 2
                d = cv2.remap(dep, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            z = ez * (1 + dolly * e * d)
            sx = (qx - tx * (e - 0.5) * 2 * d) / z * H2 + W2 / 2
            sy = (qy - ty * (e - 0.5) * 2 * d) / z * H2 + H2 / 2
            out = cv2.remap(rgb, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            im = Image.fromarray(out, 'RGB').convert('RGBA')
            G.credit(im, line, alpha=0.7)
            clip.add(im)
    if not stills:
        META[cid] = (secs, E_BEATS.get(cid, ''), line,
                     f'{fn}: graded (mglib.grade_photo), MiDaS-small depth map -> 2.5D dolly/truck parallax; credit on screen.')
        write_manifest(cid)
    return True


E_CROP_Y = {}


# ===================================================================================================== manifest
NE_CREDIT = 'Natural Earth 1:10m (public domain)'
OSM_DATA = '© OpenStreetMap contributors (ODbL 1.0) — credit shown on screen'
META = {
    'M_MAP_ANTWERP': (6.9, 'S04', f'{NE_CREDIT}; {OSM_DATA}',
                      'Europe → Belgium → Antwerp (Scheldt) → diamond district beside Antwerpen-Centraal; district outline = '
                      'OSM buildings on Hoveniersstraat/Schupstraat/Rijfstraat + west side of Pelikaanstraat; street labels; '
                      'tilts to ~30° at street level.'),
    'M_CAMERAS': (5.1, 'S04', OSM_DATA,
                  'District street plan: CCTV glyphs + amber view cones (cut to street space), bollard rows at the two '
                  'pedestrian entrances (OSM lift gates), police-post marker at the Hoveniersstraat/Schupstraat corner. '
                  'Camera/barrier positions are present-day OSM (caption says so); police-post position illustrative.'),
    'M_STOPWATCH': (3.0, 'S10', None,
                    'Stopwatch dial + 3-node timeline (guard buzzes him in → in the vault · level −2 → back upstairs), '
                    'amber sweep. No durations stated (none in FACTS).'),
    'M_FIELD': (4.0, 'S18', None,
                'Technical drawing of the door seam: two magnetic plates (door/frame) with flowing amber field lines; the door '
                'slides open, the field snaps, a red signal runs to an OUTSIDE SECURITY FIRM box; then the keypad '
                '("the code switches the field off"). FACTS #12.'),
    'M_SENSORS': (4.5, 'S19', None,
                  'Schematic top-down vault-room plan (tilted): box columns along three walls ("189 safe-deposit boxes"), '
                  'camera cone, amber heat + motion sensor cone, light sensor on the ceiling, radar wavefronts — each labelled '
                  'as it appears. Layout illustrative; on-screen tag "SCHEMATIC — NOT TO SCALE". FACTS #3, #14.'),
    'M_ROUTE_E19': (4.9, 'S31', f'{NE_CREDIT}; {OSM_DATA}',
                    'Antwerp (district) → amber route along the real A1/E19 geometry (OSM relation 86463) to the Brussels '
                    'ring; "E19" tag, Mechelen for context, Brussels labelled. The woods pin + dashed halo is placed '
                    'APPROXIMATELY between the cities (FACTS gives no precise place) and labelled only "woods off the E19". '
                    'The short city leg from the district to the motorway is schematic.'),
    'M_LINK': (3.8, 'S38', None,
               'Evidence → office link graph: five line-icon cards (receipts, envelopes, loose stones, paperwork, half a '
               'sandwich; "found in the woods") with amber links converging (0.2-1.4) on a building icon "Antwerp Diamond '
               'Centre / office" (one window lights at 1.4); "ONE TENANT" lands ~1.7. FACTS #6, #26, #27.'),
    'M_MAP_MILAN': (4.0, 'S49', NE_CREDIT, 'Antwerp → amber arc → Milan pin + "2010". FACTS #31.'),
    'M_MAP_PARIS': (4.0, 'S50', NE_CREDIT,
                    'Paris CDG pin (Natural Earth airport point) + "2013 — European arrest warrant"; dashed inbound leg '
                    '"layover from the US" from off-frame west and a dim dashed onward leg to Turin (the trip he was on). '
                    'FACTS #32.'),
    'M_TURIN': (3.5, 'S12', NE_CREDIT, 'Turin pin → amber arc to Antwerp; "The School of Turin / a loose network of Italian thieves".'),
}


def write_manifest(cid):
    if cid not in META:
        return
    path = os.path.join(G.CLIPS, 'manifest_mg_maps.json')
    try:
        man = json.load(open(path))
    except Exception:
        man = {}
    dur, beat, cred, note = META[cid]
    man[cid] = {'dur_s': dur, 'handles': 12, 'beat': beat, 'data_credit': cred, 'note': note}
    tmp = path + '.tmp'
    json.dump(man, open(tmp, 'w'), indent=1, ensure_ascii=False)
    os.replace(tmp, path)


# ===================================================================================================== main
CLIPS = {
    'M_MAP_ANTWERP': m_map_antwerp,
    'M_CAMERAS': m_cameras,
    'M_STOPWATCH': m_stopwatch,
    'M_TURIN': m_turin,
    'M_FIELD': m_field,
    'M_SENSORS': m_sensors,
    'M_ROUTE_E19': m_route_e19,
    'M_LINK': m_link,
    'M_MAP_MILAN': m_map_milan,
    'M_MAP_PARIS': m_map_paris,
}

if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['prep']:
        os.makedirs(MAPDATA, exist_ok=True)
        prep_ne()
        prep_osm()
        sys.exit(0)
    stills = None
    if '--still' in args:
        k = args.index('--still')
        stills = [float(v) for v in args[k + 1:]]
        args = args[:k]
    ids = list(CLIPS) if args == ['all'] else args
    for cid in ids:
        if cid in CLIPS:
            CLIPS[cid](stills=stills)
            if not stills:
                write_manifest(cid)
        elif cid.startswith('E_'):
            e_photo(cid, stills=stills)
        else:
            print('unknown clip', cid)
