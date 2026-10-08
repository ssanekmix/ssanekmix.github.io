#!/usr/bin/env python3
"""Precompute portrait descriptors on CI (no browser CDN CORS dependency)."""
from __future__ import annotations
import base64
import concurrent.futures
import io
import json
from pathlib import Path
import requests
from PIL import Image

BASE = Path(__file__).resolve().parent.parent
HEROES = json.loads((BASE / "data/heroes.json").read_text(encoding="utf-8"))
OUTPUT = BASE / "data/portrait-features.json"
SOURCES = (
    ("hud", (
        "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/{slug}_sb.png",
        "https://cdn.steamstatic.com/apps/dota2/images/heroes/{slug}_sb.png",
    )),
    ("modern", (
        "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/{slug}.png",
        "https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/{slug}.png",
    )),
)

def descriptor(im: Image.Image, crop: bool):
    im = im.convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(w*.07), int(h*.05), int(w*.93), int(h*.95)))
    im = im.resize((16, 10), Image.Resampling.BILINEAR)
    pixels = list(im.getdata())
    gray = [sum(p)/3 for p in pixels]
    mean = sum(gray)/len(gray)
    gray = [(x-mean)/128 for x in gray]
    norm = sum(x*x for x in gray)**.5 or 1
    g = [round(x/norm, 5) for x in gray]
    rgb = [v for p in pixels for v in p]
    means = [sum(p[c] for p in pixels)/len(pixels) for c in range(3)]
    centered = [(x-means[k%3])/128 for k,x in enumerate(rgb)]
    norm = sum(x*x for x in centered)**.5 or 1
    color = [round(x/norm, 5) for x in centered]
    return g, color

def one(hero):
    slug = hero["slug"]
    result = []
    for variant, urls in SOURCES:
        im = None
        for url in urls:
            try:
                response = requests.get(url.format(slug=slug), timeout=18)
                response.raise_for_status()
                im = Image.open(io.BytesIO(response.content))
                im.load()
                break
            except Exception:
                continue
        if im is None:
            print("Missing portrait", slug, variant)
            continue
        gray,rgb=descriptor(im,False)
        gray_center,rgb_center=descriptor(im,True)
        result.append({"id":hero["id"],"variant":variant,"gray":gray,"rgb":rgb,
                       "gray_center":gray_center,"rgb_center":rgb_center})
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    features = [feature for heroFeatures in pool.map(one, HEROES) for feature in heroFeatures]
features = sorted(features,key=lambda v:(v["id"],v["variant"]))
if len({f["id"] for f in features})<110:
    raise SystemExit(f"Only {len(features)}/{len(HEROES)} portraits downloaded")
OUTPUT.write_text(json.dumps({"version":1, "features":features},separators=(",",":")),encoding="utf-8")
print("Wrote",OUTPUT,len(features),"portraits")

def compact(vector):
    return base64.b64encode(bytes(max(0,min(255,int(round(x*720+128)))) for x in vector)).decode('ascii')
compact_path=BASE/"data/portrait-compact.json"
compact_path.write_text(json.dumps({
    "version":1,
    "features":[{"id":f["id"],"variant":f["variant"],"g":compact(f["gray"]),"gc":compact(f["gray_center"]),"c":compact(f["rgb"]),"cc":compact(f["rgb_center"])} for f in features]
},separators=(",",":")),encoding="utf-8")
print("Wrote",compact_path)
