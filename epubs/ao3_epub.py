#!/usr/bin/env python3
"""
AO3 EPUB formatter.

For each story in stories.json:
  1. Read the AO3 work page to find the current EPUB download link
     (it carries an ?updated_at= stamp that changes with each update).
  2. If that stamp is the same as last time and the output exists, skip.
  3. Otherwise download the EPUB and apply the Sigil steps:
       - add the files in the story's cover folder (cover pages first in reading order)
       - prepend the custom CSS to stylesheet.css
       - "Remove Chapter Notes" and "Remove Chapter Titles" regexes
  4. Write output/<Name_With_Underscores>.epub and remember the stamp in state.json.

Usage:
  python ao3_epub.py            # normal run (only rebuilds updated stories)
  python ao3_epub.py --force    # rebuild everything
  python ao3_epub.py --only weekly   # only stories with "check": "weekly"
  python ao3_epub.py --local some.epub --story "Crimson Horizons"
                                # format an EPUB you already downloaded
"""

import argparse
import datetime
import http.cookiejar
import json
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "stories.json")
STATE_PATH = os.path.join(HERE, "state.json")
LOG_PATH = os.path.join(HERE, "log.txt")

AO3 = "https://archiveofourown.org"
USER_AGENT = "Mozilla/5.0 (personal EPUB formatter; one request per story per day)"

# ---------------------------------------------------------------------------
# Formatting rules (the Sigil steps)
# ---------------------------------------------------------------------------

CUSTOM_CSS = """strong {
\tfont-weight: bold;
\tfont-family: PT Serif, Georgia;
\tcolor: #750705;
}

p {
  text-indent: 1.3em;
}

"""

# "Remove Chapter Notes" (class number loosened from calibre7 to any calibreN)
RE_CHAPTER_NOTES = re.compile(
    r'<p class="calibre\d+">Chapter Notes</p>\s*<div class="endnote-link">\s*'
    r'See the end of the chapter for\s*<a href="#endnotes(\d+)">notes</a>\s*</div>'
)
# "Remove Chapter Titles": keep the <h2> (TOC anchor), empty its text
RE_CHAPTER_TITLES = re.compile(r'(<h2 class="heading" id="calibre_toc_\d+">)[\s\S]*?(</h2>)')


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg):
    line = "[{}] {}".format(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    try:
        print(line)
    except UnicodeEncodeError:
        print(line.encode("ascii", "replace").decode())
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


# ---------------------------------------------------------------------------
# AO3 access
# ---------------------------------------------------------------------------

_opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
)


def http_get(url, dest=None, tries=6):
    """GET with retries. AO3 often answers 502/503/525 when busy."""
    delay = 10
    for attempt in range(1, tries + 1):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            # big EPUBs can stall while AO3 generates them, so allow longer for downloads
            with _opener.open(req, timeout=120 if dest is None else 300) as resp:
                if dest is None:
                    return resp.read().decode("utf-8", "replace")
                with open(dest, "wb") as f:
                    shutil.copyfileobj(resp, f, 1024 * 1024)
                return dest
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            wait = delay
            if e.code == 429:
                wait = max(delay, int(e.headers.get("Retry-After", "60") or 60))
            log("  HTTP {} on attempt {}/{}, waiting {}s".format(e.code, attempt, tries, wait))
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            wait = delay
            log("  {} on attempt {}/{}, waiting {}s".format(e, attempt, tries, wait))
        if attempt == tries:
            raise RuntimeError("giving up on " + url)
        time.sleep(wait)
        delay = min(delay * 2, 300)


def find_epub_link(work_id):
    """Return (download_url, updated_at, chapters) from the work page."""
    html = http_get("{}/works/{}?view_adult=true".format(AO3, work_id))
    m = re.search(r'href="(/downloads/{}/[^"]+?\.epub\?updated_at=(\d+))"'.format(work_id), html)
    if not m:
        if "This work is only available to registered users" in html:
            raise RuntimeError("work is restricted to logged-in users")
        raise RuntimeError("no EPUB download link found on the work page")
    url = AO3 + m.group(1).replace("&amp;", "&")
    ch = re.search(r'<dd class="chapters">([^<]+)', html)
    return url, m.group(2), (ch.group(1).strip() if ch else "?")


# ---------------------------------------------------------------------------
# EPUB transformation
# ---------------------------------------------------------------------------

MEDIA_TYPES = {
    ".xhtml": "application/xhtml+xml", ".html": "application/xhtml+xml", ".css": "text/css",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
    ".svg": "image/svg+xml",
}
IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".gif")


def cover_files(story):
    """Files to add from the story's cover folder, and the cover pages in spine order."""
    cover_dir = os.path.join(HERE, story["cover_dir"])
    files = sorted(f for f in os.listdir(cover_dir)
                   if os.path.splitext(f)[1].lower() in MEDIA_TYPES)
    pages = story.get("cover_pages", ["cover.xhtml"])
    images = [f for f in files if f.lower().endswith(IMAGE_EXTS)]
    cover_image = story.get("cover_image") or (
        "cover_image.png" if "cover_image.png" in images else (images[0] if images else None))
    return cover_dir, files, pages, cover_image


def transform_opf(opf, files, pages, cover_image):
    if 'href="{}"'.format(pages[0]) in opf:
        return opf
    items = "".join('    <item id="{0}" href="{0}" media-type="{1}"/>\n'.format(
        f, MEDIA_TYPES[os.path.splitext(f)[1].lower()]) for f in files)
    refs = "".join('    <itemref idref="{}"/>\n'.format(p) for p in pages)
    opf = re.sub(r"(<manifest[^>]*>\s*\n)", lambda m: m.group(1) + items, opf, count=1)
    opf = re.sub(r"(<spine[^>]*>\s*\n)", lambda m: m.group(1) + refs, opf, count=1)
    # Mark the cover so readers/library views show it as the book's thumbnail
    if cover_image and 'name="cover"' not in opf:
        opf = opf.replace("</metadata>",
                          '  <meta name="cover" content="{}"/>\n  </metadata>'.format(cover_image), 1)
    ref = '<reference type="cover" title="Cover" href="{}"/>'.format(pages[0])
    if "<guide>" in opf:
        opf = opf.replace("<guide>", "<guide>\n    " + ref, 1)
    elif "<guide/>" in opf:
        opf = opf.replace("<guide/>", "<guide>\n    " + ref + "\n  </guide>", 1)
    else:
        opf = opf.replace("</package>", "  <guide>\n    " + ref + "\n  </guide>\n</package>", 1)
    return opf


def format_epub(src, dest, story):
    """Apply the Sigil steps to src, write dest. Returns stats dict."""
    cover_dir, files, pages, cover_image = cover_files(story)
    stats = {"chapter_notes": 0, "chapter_titles": 0}
    zin = zipfile.ZipFile(src)
    names = zin.namelist()
    opf_name = next(n for n in names if n.endswith(".opf"))
    opf_dir = os.path.dirname(opf_name)

    def in_opf_dir(fname):
        return (opf_dir + "/" + fname) if opf_dir else fname

    tmp = dest + ".part"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        # mimetype must be first and uncompressed
        zout.writestr(zipfile.ZipInfo("mimetype"), b"application/epub+zip",
                      compress_type=zipfile.ZIP_STORED)
        for name in names:
            if name == "mimetype" or name.endswith("/"):
                continue
            data = zin.read(name)
            if name == opf_name:
                data = transform_opf(data.decode("utf-8"), files, pages, cover_image).encode("utf-8")
            elif os.path.basename(name) == "stylesheet.css":
                css = data.decode("utf-8")
                if "#750705" not in css:
                    css = CUSTOM_CSS + css
                data = css.encode("utf-8")
            elif name.endswith((".xhtml", ".html")):
                text = data.decode("utf-8")
                text, n1 = RE_CHAPTER_NOTES.subn("", text)
                text, n2 = RE_CHAPTER_TITLES.subn(r"\1\n\n  \2", text)
                stats["chapter_notes"] += n1
                stats["chapter_titles"] += n2
                data = text.encode("utf-8")
            # images are already compressed; store them to save time
            ctype = zipfile.ZIP_STORED if name.lower().endswith(IMAGE_EXTS) else zipfile.ZIP_DEFLATED
            zout.writestr(zin.getinfo(name), data, compress_type=ctype)
        for fname in files:
            target = in_opf_dir(fname)
            if target not in names:
                ctype = zipfile.ZIP_STORED if fname.lower().endswith(IMAGE_EXTS) else zipfile.ZIP_DEFLATED
                zout.write(os.path.join(cover_dir, fname), target, compress_type=ctype)
    zin.close()
    os.replace(tmp, dest)
    return stats


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_json(path, default):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def output_path(story, out_dir):
    # GitHub turns spaces in release file names into dots, so use underscores
    return os.path.join(out_dir, story.get("file", story["name"].replace(" ", "_")) + ".epub")


def process(story, out_dir, state, force, ci):
    name = story["name"]
    dest = output_path(story, out_dir)
    log("{}: checking AO3 work {}".format(name, story["work_id"]))
    url, stamp, chapters = find_epub_link(story["work_id"])
    prev = state.get(name, {})
    # On GitHub the output folder starts empty each run, so only the stamp counts there
    if not force and prev.get("updated_at") == stamp and (ci or os.path.exists(dest)):
        log("{}: no update (chapters {}), skipping".format(name, chapters))
        return False

    log("{}: new version (chapters {}), downloading {}".format(name, chapters, url))
    fd, raw = tempfile.mkstemp(suffix=".epub")
    os.close(fd)
    try:
        http_get(url, dest=raw)
        if not zipfile.is_zipfile(raw):
            raise RuntimeError("download is not an EPUB (AO3 may have sent an error page)")
        stats = format_epub(raw, dest, story)
    finally:
        os.remove(raw)
    log("{}: wrote {} ({:.1f} MB) - removed {} chapter-note blocks, emptied {} chapter titles"
        .format(name, dest, os.path.getsize(dest) / 1e6, stats["chapter_notes"], stats["chapter_titles"]))
    if stats["chapter_titles"] == 0:
        log("{}: WARNING - no chapter headings matched; AO3's EPUB layout may have changed".format(name))
    state[name] = {"updated_at": stamp, "chapters": chapters,
                   "built": datetime.datetime.now().isoformat(timespec="seconds")}
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="rebuild even if AO3 has no update")
    ap.add_argument("--local", help="format this EPUB file instead of downloading")
    ap.add_argument("--story", help="only this story (by name)")
    ap.add_argument("--only", choices=["daily", "weekly"],
                    help="only stories whose \"check\" is this (stories without one count as daily)")
    ap.add_argument("--ci", action="store_true",
                    help="GitHub mode: skip on unchanged AO3 stamp even if no output file exists")
    args = ap.parse_args()

    config = load_json(CONFIG_PATH, None)
    out_dir = os.path.join(HERE, config.get("output_dir", "output"))
    os.makedirs(out_dir, exist_ok=True)
    stories = [s for s in config["stories"]
               if (not args.story or s["name"] == args.story)
               and (not args.only or s.get("check", "daily") == args.only)]
    if not stories:
        sys.exit("no matching story in stories.json")

    if args.local:
        s = stories[0]
        dest = output_path(s, out_dir)
        stats = format_epub(args.local, dest, s)
        log("{}: formatted local file -> {} {}".format(s["name"], dest, stats))
        return 0

    state = load_json(STATE_PATH, {})
    failures = 0
    for story in stories:
        try:
            process(story, out_dir, state, args.force, args.ci)
        except Exception as e:
            failures += 1
            log("{}: FAILED - {}".format(story["name"], e))
        save_json(STATE_PATH, state)
        if len(stories) > 1:
            time.sleep(5)  # be gentle with AO3 between stories
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
