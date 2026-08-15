#!/usr/bin/env python3
"""
Refresh venue photo galleries using ONLY the Google Places API (no paid AI vision).

For each venue: find its Place, pull up to 10 photo references, rank them with
free rule-based heuristics, download the best 5, compress them for the web, and
store the local paths on Venue.localPhotos (a Postgres text[] column).

-----------------------------------------------------------------------------
KNOWN LIMITATIONS (rule-based filtering is not a substitute for a human/AI look)
-----------------------------------------------------------------------------
- Google's Places API does NOT expose a "this photo is a menu / food close-up"
  category flag. The only content hint available is `html_attributions`
  (normally just a photographer credit string), so the menu/food keyword
  check below almost never fires. Expect some food, menu, or interior-detail
  shots to slip through — this script cannot reliably tell a room photo from
  a close-up of a bowl of chips. Spot-check the results.
- Aspect ratio / resolution are proxies for "looks like a real venue photo",
  not ground truth. A great venue photo shot in portrait, or a mediocre wide
  crop, will be scored the "wrong" way sometimes.
- The similarity check (average-hash + Hamming distance) catches near-duplicate
  crops of the SAME photo, not different photos of the same room from another
  angle — you'll still occasionally get two shots of what is basically the
  same corner of the venue.
- If you want genuinely reliable curation, a human pass (or a paid vision
  model) over the downloaded candidates is the only way to close these gaps.
  This script trades that accuracy for $0 (or near-$0, see cost note below)
  running cost.

-----------------------------------------------------------------------------
COST NOTE
-----------------------------------------------------------------------------
- Fetching photo metadata (Place Details with the `photo` field) costs one
  call per venue and Google's own docs list ~1,000 free calls/month for the
  photos-related Place Details SKU — a few hundred venues fits comfortably.
- Downloading the actual JPEG bytes (Place Photo) is a SEPARATE SKU, also
  documented with a free monthly allowance around 1,000 calls, then roughly
  $7 per 1,000 after that. Since this script downloads exactly the photos it
  intends to keep (no throwaway buffer), a run over N venues costs at most
  5*N Place Photo calls. For ~275 venues that's ~1,375 calls: within budget
  the first ~1,000, then a few dollars for the rest. NOT guaranteed literally
  $0 — check your Google Cloud Console quota page for current numbers before
  a full run, published pricing tables change and are easy to misread.

-----------------------------------------------------------------------------
Usage
-----------------------------------------------------------------------------
  python scripts/fetch_venue_photos.py --slug some-venue-slug   # single venue
  python scripts/fetch_venue_photos.py --limit 5                # first 5 eligible venues
  python scripts/fetch_venue_photos.py --all                    # every eligible venue (explicit, on purpose)
  add --dry-run to any of the above to skip both downloads-to-disk-being-kept and DB writes
  (dry-run still calls the Places APIs so you can see what WOULD be picked)

Requires GOOGLE_PLACES_API_KEY and DATABASE_URL in .env.local (see scripts/requirements.txt
for dependencies: pip install -r scripts/requirements.txt).
"""

import argparse
import io
import os
import re
import sys
import time

import googlemaps
import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_ROOT = os.path.join(REPO_ROOT, "public", "images", "venues")

MAX_CANDIDATES = 10          # how many photo refs to pull metadata for per venue
TARGET_PHOTOS = 5            # how many final photos to keep per venue
DOWNLOAD_MAX_WIDTH = 1600    # px requested from Google
JPEG_QUALITY = 82
HASH_SIZE = 8                # average-hash grid (8x8 = 64-bit hash)
SIMILARITY_THRESHOLD = 6     # Hamming distance below this = "too similar, skip"
REQUEST_SLEEP_SECONDS = 0.15

MENU_FOOD_KEYWORDS = ("menu", "price list", "food menu", "drinks menu")


def log(msg):
    print(msg, flush=True)


# --------------------------------------------------------------------------
# Places API helpers
# --------------------------------------------------------------------------

def find_place_id(gmaps, name, address):
    try:
        result = gmaps.find_place(
            input=f"{name} {address}",
            input_type="textquery",
            fields=["place_id"],
        )
    except googlemaps.exceptions.ApiError as e:
        log(f"    find_place API error: {e}")
        return None
    candidates = result.get("candidates") or []
    if not candidates:
        return None
    return candidates[0]["place_id"]


def get_place_details(gmaps, place_id):
    """Returns (place_name, photos_list) from Place Details. `name` is a free
    Essentials-tier field, so this check costs nothing extra beyond the photo
    metadata call we needed anyway."""
    try:
        result = gmaps.place(place_id=place_id, fields=["name", "photo"])
    except googlemaps.exceptions.ApiError as e:
        log(f"    place details API error: {e}")
        return None, None
    r = result.get("result") or {}
    return r.get("name"), r.get("photos") or []


NAME_STOPWORDS = {
    "play", "soft", "area", "indoor", "centre", "center", "kids", "children",
    "zone", "the", "and", "club", "park", "activity", "activities",
    "adventure", "world", "ltd", "uk",
}


def names_plausibly_match(venue_name, place_name):
    """Cheap sanity check: does the Place Google returned even look like the
    right venue? Catches cases where a stale/wrong googlePlaceId points at an
    unrelated Place (e.g. the museum a play area sits inside) rather than the
    venue itself — that produces confidently-wrong photos no amount of
    aspect-ratio/resolution filtering can fix. Not a rename/typo detector:
    if either name has no significant words left after stripping generic
    soft-play vocabulary, we can't judge, so we let it through."""
    def significant_words(s):
        words = set(re.findall(r"[a-z0-9]+", (s or "").lower()))
        return words - NAME_STOPWORDS

    v_words = significant_words(venue_name)
    p_words = significant_words(place_name)
    if not v_words or not p_words:
        return True
    return bool(v_words & p_words)


PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo"
# (connect timeout, per-chunk read timeout) — observed transfers can be slow
# (tens of seconds for a ~2MB photo on a throttled connection), so the read
# timeout is generous; this bounds a single attempt, not "how long total".
PHOTO_TIMEOUT = (10, 45)


def download_photo_bytes(api_key, photo_reference, max_width=DOWNLOAD_MAX_WIDTH, attempts=2):
    """Downloads the actual JPEG bytes for one photo reference via a direct
    requests call (not googlemaps.places_photo — that generator doesn't
    reliably honour a read timeout while streaming, which caused indefinite
    hangs during testing). Costs one Place Photo call per attempt that
    actually reaches Google (a pure connect-timeout retry is free)."""
    params = {"maxwidth": max_width, "photo_reference": photo_reference, "key": api_key}
    for attempt in range(1, attempts + 1):
        try:
            resp = requests.get(PHOTO_URL, params=params, timeout=PHOTO_TIMEOUT, stream=True)
            resp.raise_for_status()
            return resp.content
        except requests.exceptions.RequestException as e:
            log(f"    photo download attempt {attempt}/{attempts} failed: {e}")
    return None


# --------------------------------------------------------------------------
# Rule-based ranking (metadata only — free, no download needed)
# --------------------------------------------------------------------------

def looks_like_menu_or_food(photo_meta):
    attributions = " ".join(photo_meta.get("html_attributions") or []).lower()
    return any(kw in attributions for kw in MENU_FOOD_KEYWORDS)


def score_candidate(photo_meta, max_area):
    width = photo_meta.get("width") or 0
    height = photo_meta.get("height") or 0
    if not width or not height:
        return -1

    aspect = width / height
    # Landscape/square gets full marks; extreme portrait or panorama crops
    # (often food macro shots, menus, or random social uploads) get penalised.
    if 0.75 <= aspect <= 1.8:
        aspect_score = 1.0
    elif 0.55 <= aspect <= 2.3:
        aspect_score = 0.5
    else:
        aspect_score = 0.1

    area = width * height
    resolution_score = area / max_area if max_area else 0

    score = (0.6 * aspect_score) + (0.4 * resolution_score)
    if looks_like_menu_or_food(photo_meta):
        score -= 1.0  # heavy penalty; rarely triggers, see module docstring
    return score


def rank_candidates(photos):
    if not photos:
        return []
    max_area = max((p.get("width") or 0) * (p.get("height") or 0) for p in photos) or 1
    scored = [(score_candidate(p, max_area), p) for p in photos]
    scored.sort(key=lambda sp: sp[0], reverse=True)
    return [p for score, p in scored if score > -0.5]


# --------------------------------------------------------------------------
# Image processing: dedup hash + compression
# --------------------------------------------------------------------------

def average_hash(img):
    """Simple 64-bit average hash, no extra deps beyond Pillow."""
    small = img.convert("L").resize((HASH_SIZE, HASH_SIZE), Image.LANCZOS)
    pixels = list(small.tobytes())
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if p >= avg else "0" for p in pixels)
    return int(bits, 2)


def hamming_distance(a, b):
    return bin(a ^ b).count("1")


def compress_and_save(img, dest_path):
    rgb = img.convert("RGB")
    w, h = rgb.size
    longest = max(w, h)
    if longest > DOWNLOAD_MAX_WIDTH:
        scale = DOWNLOAD_MAX_WIDTH / longest
        rgb = rgb.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    rgb.save(dest_path, "JPEG", quality=JPEG_QUALITY, optimize=True)


# --------------------------------------------------------------------------
# Per-venue pipeline
# --------------------------------------------------------------------------

def process_venue(gmaps, api_key, venue, dry_run):
    """Returns (list_of_saved_relative_paths, status_str)."""
    slug = venue["slug"]
    place_id = venue["googlePlaceId"]

    if not place_id:
        log("    No googlePlaceId — searching by name + address...")
        place_id = find_place_id(gmaps, venue["name"], venue["address"])
        time.sleep(REQUEST_SLEEP_SECONDS)
        if not place_id:
            return [], "no_place_match"

    place_name, photos_meta = get_place_details(gmaps, place_id)
    time.sleep(REQUEST_SLEEP_SECONDS)
    if photos_meta is None:
        return [], "details_failed"
    if not names_plausibly_match(venue["name"], place_name):
        log(f"    Name mismatch: venue={venue['name']!r} vs Google Place={place_name!r} — skipping, needs manual review")
        return [], "name_mismatch"
    if not photos_meta:
        return [], "no_photos"

    candidates = rank_candidates(photos_meta[:MAX_CANDIDATES])
    if not candidates:
        return [], "no_photos"

    venue_dir = os.path.join(IMAGES_ROOT, slug)
    if not dry_run:
        os.makedirs(venue_dir, exist_ok=True)

    kept_hashes = []
    saved_paths = []

    for photo_meta in candidates:
        if len(saved_paths) >= TARGET_PHOTOS:
            break

        raw_bytes = download_photo_bytes(api_key, photo_meta["photo_reference"])
        time.sleep(REQUEST_SLEEP_SECONDS)
        if not raw_bytes:
            continue

        try:
            img = Image.open(io.BytesIO(raw_bytes))
            img.load()
        except Exception as e:
            log(f"    Skipping unreadable image: {e}")
            continue

        img_hash = average_hash(img)
        if any(hamming_distance(img_hash, h) < SIMILARITY_THRESHOLD for h in kept_hashes):
            log(f"    Skipping near-duplicate photo (hash distance < {SIMILARITY_THRESHOLD})")
            continue

        kept_hashes.append(img_hash)
        index = len(saved_paths) + 1
        filename = f"{index}.jpg"
        dest_path = os.path.join(venue_dir, filename)

        if not dry_run:
            compress_and_save(img, dest_path)

        saved_paths.append(f"/images/venues/{slug}/{filename}")

    if not saved_paths:
        return [], "all_candidates_failed"

    status = "ok" if len(saved_paths) == TARGET_PHOTOS else f"partial_{len(saved_paths)}"
    return saved_paths, status


# --------------------------------------------------------------------------
# DB helpers (raw psycopg2 — mirrors the Prisma Venue.localPhotos column)
# --------------------------------------------------------------------------

def fetch_eligible_venues(conn, slug=None, limit=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if slug:
            cur.execute(
                'SELECT id, name, slug, address, "googlePlaceId" FROM "Venue" WHERE slug = %s',
                (slug,),
            )
        else:
            query = (
                'SELECT id, name, slug, address, "googlePlaceId" FROM "Venue" '
                'WHERE "isExcluded" = false ORDER BY name'
            )
            if limit:
                query += " LIMIT %s"
                cur.execute(query, (limit,))
            else:
                cur.execute(query)
        return cur.fetchall()


def update_venue_local_photos(conn, venue_id, paths):
    with conn.cursor() as cur:
        cur.execute(
            'UPDATE "Venue" SET "localPhotos" = %s, "updatedAt" = NOW() WHERE id = %s',
            (paths, venue_id),
        )
    conn.commit()


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument("--slug", help="Process a single venue by slug (test mode).")
    scope.add_argument("--limit", type=int, help="Process the first N eligible venues.")
    scope.add_argument("--all", action="store_true", help="Process every eligible (non-excluded) venue.")
    parser.add_argument("--dry-run", action="store_true", help="Call the API and log results, but don't write files or the DB.")
    args = parser.parse_args()

    load_dotenv(os.path.join(REPO_ROOT, ".env.local"))
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    database_url = os.environ.get("DATABASE_URL")
    if not api_key:
        sys.exit("GOOGLE_PLACES_API_KEY not set in .env.local")
    if not database_url:
        sys.exit("DATABASE_URL not set in .env.local")

    gmaps = googlemaps.Client(key=api_key, timeout=20, retry_timeout=30)
    conn = psycopg2.connect(database_url)

    try:
        venues = fetch_eligible_venues(conn, slug=args.slug, limit=args.limit)
    except Exception as e:
        sys.exit(f"Failed to query venues: {e}")

    if not venues:
        sys.exit(f"No matching venues found (slug={args.slug!r}, limit={args.limit}).")

    total = len(venues)
    log(f"\n{'DRY RUN — ' if args.dry_run else ''}Processing {total} venue(s)\n")

    counts = {"ok": 0, "partial": 0, "no_photos": 0, "no_place_match": 0, "name_mismatch": 0, "failed": 0}
    mismatched_venues = []
    quota_hit = False

    for i, venue in enumerate(venues, start=1):
        log(f"Processing Venue {i}/{total}: {venue['name']}...")
        try:
            saved_paths, status = process_venue(gmaps, api_key, venue, args.dry_run)
        except googlemaps.exceptions.ApiError as e:
            msg = str(e)
            if "OVER_QUERY_LIMIT" in msg or "RESOURCE_EXHAUSTED" in msg:
                log(f"  Quota limit hit — stopping early ({i - 1}/{total} venues processed). {e}")
                quota_hit = True
                break
            log(f"  Unexpected API error, skipping venue: {e}")
            counts["failed"] += 1
            continue
        except Exception as e:
            log(f"  Unexpected error, skipping venue: {e}")
            counts["failed"] += 1
            continue

        if status == "ok":
            log(f"  Saved {len(saved_paths)}/{TARGET_PHOTOS} photos")
            counts["ok"] += 1
        elif status.startswith("partial"):
            log(f"  Saved only {len(saved_paths)}/{TARGET_PHOTOS} photos (fewer good candidates available)")
            counts["partial"] += 1
        elif status == "no_photos":
            log("  No usable photos found on this Place")
            counts["no_photos"] += 1
        elif status == "no_place_match":
            log("  Could not match this venue to a Google Place")
            counts["no_place_match"] += 1
        elif status == "name_mismatch":
            counts["name_mismatch"] += 1
            mismatched_venues.append(venue["slug"])
        else:
            log(f"  Failed: {status}")
            counts["failed"] += 1

        if saved_paths and not args.dry_run:
            update_venue_local_photos(conn, venue["id"], saved_paths)
            log(f"  DB updated: localPhotos = {saved_paths}")
        elif saved_paths and args.dry_run:
            log(f"  [dry-run] Would set localPhotos = {saved_paths}")

    conn.close()

    log("\n=== Summary ===")
    log(f"  Full 5 photos:        {counts['ok']}")
    log(f"  Partial (<5 photos):  {counts['partial']}")
    log(f"  No photos on Place:   {counts['no_photos']}")
    log(f"  No Place match:       {counts['no_place_match']}")
    log(f"  Name mismatch:        {counts['name_mismatch']}")
    log(f"  Failed/errored:       {counts['failed']}")
    if mismatched_venues:
        log("\n  Venues with a stored googlePlaceId that doesn't look like the right Place")
        log("  (skipped — needs manual review of the googlePlaceId in the DB):")
        for slug in mismatched_venues:
            log(f"    - {slug}")
    if quota_hit:
        log("  Stopped early due to API quota limit — re-run later to continue.")


if __name__ == "__main__":
    main()
