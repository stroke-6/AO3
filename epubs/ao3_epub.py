#!/usr/bin/env python3
"""
AO3 EPUB formatter.

For each story in stories.json:
  1. Read the AO3 work page to find the current EPUB download link
     (it carries an ?updated_at= stamp that changes with each update).
  2. If neither that stamp nor the story's formatting recipe changed since last time, skip.
  3. Otherwise download the EPUB and format it:
       - add the files in the story's cover folder (cover pages first in reading order)
       - prepend the custom CSS (with the story's colour) to stylesheet.css
       - "Remove Chapter Notes" and "Remove Chapter Titles" regexes  (unless "cleanup": false)
       - insert decorative chapter titles from a workskin file        ("chapter_titles")
       - drop whole chapters                                           ("remove_chapters")
  4. Write output/<file>.epub and remember the stamp in state.json.

Usage:
  python ao3_epub.py                  # all stories (only rebuilds changed ones)
  python ao3_epub.py --story Indra    # one story
  python ao3_epub.py --force          # rebuild even without changes
  python ao3_epub.py --local some.epub --story "Crimson Horizons"
                                      # format an EPUB you already downloaded
"""

import argparse
import datetime
import hashlib
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
from xml.sax.saxutils import escape

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
\tcolor: %s;
}

p {
  text-indent: 1.3em;
}

"""
DEFAULT_COLOR = "#750705"

# "Remove Chapter Notes" (class number loosened from calibre7 to any calibreN)
RE_CHAPTER_NOTES = re.compile(
    r'<p class="calibre\d+">Chapter Notes</p>\s*<div class="endnote-link">\s*'
    r'See the end of the chapter for\s*<a href="#endnotes(\d+)">notes</a>\s*</div>'
)
# "Remove Chapter Titles": keep the <h2> (TOC anchor), empty its text
RE_CHAPTER_TITLES = re.compile(r'(<h2 class="heading" id="calibre_toc_\d+">)[\s\S]*?(</h2>)')
# A chapter heading in AO3's EPUB, capturing the chapter number
RE_CHAPTER_HEADING = re.compile(r'<h2 class="heading" id="calibre_toc_\d+">\s*Chapter (\d+)\b')
# A whole chapter heading: number and (optional) chapter name
RE_CHAPTER_HEADING_FULL = re.compile(
    r'(<h2 class="heading" id="calibre_toc_\d+">)\s*Chapter (\d+)(?::\s*([\s\S]*?))?\s*(</h2>)')


def number_headings(text):
    """'Chapter 88: The Only True Things' -> '88', line break, 'The Only True Things'."""
    def fmt(m):
        name = '<br/>\n<span class="chapter-name">{}</span>'.format(m.group(3)) if m.group(3) else ""
        return '{}<span class="chapter-num">{}</span>{}{}'.format(m.group(1), m.group(2), name, m.group(4))
    return RE_CHAPTER_HEADING_FULL.subn(fmt, text)


def number_headings_css(color):
    return """
h2.heading {
  font-family: "PT Serif", Georgia, serif;
  font-variant: small-caps;
  font-weight: normal;
  letter-spacing: 0.06em;
  color: %s;
  text-align: center;
  text-indent: 0;
  line-height: 1.4;
}
h2.heading .chapter-num {
  font-size: 0.6em;
  letter-spacing: 0.2em;
}
""" % color


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
# Decorative chapter titles (from an AO3 workskin)
# ---------------------------------------------------------------------------

# Layout properties that only make sense on AO3's page; the EPUB centres the title itself
SKIP_PROPS = {"display", "justify-content", "align-items", "position", "left", "transform", "width"}


def load_chapter_titles(path):
    """Parse an AO3 workskin: returns ({chapter_number: text}, css_declarations)."""
    with open(path, encoding="utf-8") as f:
        css = f.read()
    titles = {int(n): text for n, text in re.findall(
        r'#chapter-(\d+)[^{]*\{\s*content:\s*"([^"]*)"\s*;?\s*\}', css)}
    style = re.search(r'#workskin \.chapter \.preface\.group:first-of-type::before\s*\{([^}]*)\}', css)
    decls = []
    for prop, value in re.findall(r'([\w-]+)\s*:\s*([^;]+);', style.group(1) if style else ""):
        if prop in SKIP_PROPS:
            continue
        decls.append((prop, value.strip()))
        if prop in ("writing-mode", "text-orientation"):  # older e-reader engines
            decls += [("-webkit-" + prop, value.strip()), ("-epub-" + prop, value.strip())]
    return titles, decls


def chapter_titles_css(decls):
    body = "".join("  {}: {};\n".format(p, v) for p, v in decls)
    return ("\n.chapter-deco {\n  text-align: center;\n  margin: 0.5em 0 1em;\n  text-indent: 0;\n}\n"
            ".chapter-deco span {\n  display: inline-block;\n" + body + "}\n")


def add_chapter_titles(text, titles):
    def insert(m):
        title = titles.get(int(m.group(1)))
        if not title:
            return m.group(0)
        return '<div class="chapter-deco"><span>{}</span></div>\n'.format(escape(title)) + m.group(0)
    return RE_CHAPTER_HEADING.subn(insert, text)


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


def transform_opf(opf, files, pages, cover_image, dropped):
    # remove dropped files (whole chapters and images only they used)
    for href in dropped:
        m = re.search(r'<item [^>]*href="{}"[^>]*/>\s*\n?'.format(re.escape(href)), opf)
        if m:
            item_id = re.search(r'id="([^"]+)"', m.group(0)).group(1)
            opf = opf.replace(m.group(0), "")
            opf = re.sub(r'\s*<itemref idref="{}"\s*/>'.format(re.escape(item_id)), "", opf)
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


def transform_ncx(ncx, dropped):
    """Remove table-of-contents entries pointing at dropped files, renumber playOrder."""
    def drop(m):
        src = re.search(r'<content src="([^"#]+)', m.group(0))
        return "" if src and src.group(1) in dropped else m.group(0)
    # navPoints here are flat (one per chapter), so a non-nested match is enough
    ncx = re.sub(r'\s*<navPoint\b(?:(?!<navPoint\b)[\s\S])*?</navPoint>', drop, ncx)
    counter = iter(range(1, 100000))
    return re.sub(r'playOrder="\d+"', lambda m: 'playOrder="{}"'.format(next(counter)), ncx)


def find_dropped(zin, names, opf_dir, remove_chapters):
    """Hrefs (relative to the OPF) of chapter files to remove, plus images only they use."""
    if not remove_chapters:
        return set()
    rel = lambda n: n[len(opf_dir) + 1:] if opf_dir else n
    texts = {n: zin.read(n).decode("utf-8") for n in names if n.endswith((".xhtml", ".html"))}
    dropped = set()
    for n, t in texts.items():
        m = RE_CHAPTER_HEADING.search(t)
        if m and int(m.group(1)) in remove_chapters:
            dropped.add(rel(n))
    used_elsewhere = set()
    for n, t in texts.items():
        if rel(n) not in dropped:
            used_elsewhere.update(re.findall(r'(?:src|href)="([^"#]+)"', t))
    for n in list(dropped):
        for img in re.findall(r'src="([^"#]+)"', texts[(opf_dir + "/" + n) if opf_dir else n]):
            if img not in used_elsewhere:
                dropped.add(img)
    return dropped


def format_epub(src, dest, story):
    """Format src according to the story's settings, write dest. Returns stats dict."""
    cover_dir, files, pages, cover_image = cover_files(story)
    cleanup = story.get("cleanup", True)
    color = story.get("color", DEFAULT_COLOR)
    titles, title_decls = ({}, None)
    if story.get("chapter_titles"):
        titles, title_decls = load_chapter_titles(os.path.join(HERE, story["chapter_titles"]))
    numbered = story.get("chapter_headings") == "numbered"
    stats = {"chapter_notes": 0, "chapter_titles": 0, "deco_titles": 0, "numbered_headings": 0,
             "removed_files": 0}

    zin = zipfile.ZipFile(src)
    names = zin.namelist()
    opf_name = next(n for n in names if n.endswith(".opf"))
    opf_dir = os.path.dirname(opf_name)

    def in_opf_dir(fname):
        return (opf_dir + "/" + fname) if opf_dir else fname

    dropped = find_dropped(zin, names, opf_dir, set(story.get("remove_chapters", [])))
    stats["removed_files"] = len(dropped)

    tmp = dest + ".part"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        # mimetype must be first and uncompressed
        zout.writestr(zipfile.ZipInfo("mimetype"), b"application/epub+zip",
                      compress_type=zipfile.ZIP_STORED)
        for name in names:
            if name == "mimetype" or name.endswith("/"):
                continue
            if name in {in_opf_dir(d) for d in dropped}:
                continue
            data = zin.read(name)
            if name == opf_name:
                data = transform_opf(data.decode("utf-8"), files, pages, cover_image, dropped).encode("utf-8")
            elif name.endswith(".ncx") and dropped:
                data = transform_ncx(data.decode("utf-8"), dropped).encode("utf-8")
            elif os.path.basename(name) == "stylesheet.css":
                css = data.decode("utf-8")
                if not css.startswith("strong {"):
                    css = (CUSTOM_CSS % color) + css
                    if title_decls is not None:
                        css += chapter_titles_css(title_decls)
                    if numbered:
                        css += number_headings_css(color)
                data = css.encode("utf-8")
            elif name.endswith((".xhtml", ".html")):
                text = data.decode("utf-8")
                if titles:
                    text, n = add_chapter_titles(text, titles)
                    stats["deco_titles"] += n
                if numbered:
                    text, n = number_headings(text)
                    stats["numbered_headings"] += n
                if cleanup:
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
        json.dump(data, f, indent=2, ensure_ascii=False)


def output_path(story, out_dir):
    # GitHub turns spaces in release file names into dots, so use underscores
    return os.path.join(out_dir, story.get("file", story["name"].replace(" ", "_")) + ".epub")


def recipe_hash(story):
    """Fingerprint of everything that shapes the output, so formatting changes trigger a rebuild."""
    h = hashlib.sha256(json.dumps(story, sort_keys=True).encode())
    paths = [os.path.abspath(__file__)]
    cover_dir = os.path.join(HERE, story["cover_dir"])
    paths += [os.path.join(cover_dir, f) for f in sorted(os.listdir(cover_dir))]
    if story.get("chapter_titles"):
        paths.append(os.path.join(HERE, story["chapter_titles"]))
    for p in paths:
        with open(p, "rb") as f:
            h.update(f.read().replace(b"\r\n", b"\n"))
    return h.hexdigest()[:16]


def stats_text(stats):
    parts = []
    if stats["chapter_notes"] or stats["chapter_titles"]:
        parts.append("removed {} chapter-note blocks, emptied {} chapter titles".format(
            stats["chapter_notes"], stats["chapter_titles"]))
    if stats["deco_titles"]:
        parts.append("added {} decorative chapter titles".format(stats["deco_titles"]))
    if stats["numbered_headings"]:
        parts.append("restyled {} chapter headings".format(stats["numbered_headings"]))
    if stats["removed_files"]:
        parts.append("removed {} files of dropped chapters".format(stats["removed_files"]))
    return "; ".join(parts) or "no text changes"


def process(story, out_dir, state, force, ci):
    name = story["name"]
    dest = output_path(story, out_dir)
    log("{}: checking AO3 work {}".format(name, story["work_id"]))
    url, stamp, chapters = find_epub_link(story["work_id"])
    recipe = recipe_hash(story)
    prev = state.get(name, {})
    unchanged = prev.get("updated_at") == stamp and prev.get("recipe") == recipe
    # On GitHub the output folder starts empty each run, so only the state counts there
    if not force and unchanged and (ci or os.path.exists(dest)):
        log("{}: no update (chapters {}), skipping".format(name, chapters))
        return False

    reason = "new version" if prev.get("updated_at") != stamp else "formatting changed" if not force else "forced"
    log("{}: {} (chapters {}), downloading {}".format(name, reason, chapters, url))
    fd, raw = tempfile.mkstemp(suffix=".epub")
    os.close(fd)
    try:
        http_get(url, dest=raw)
        if not zipfile.is_zipfile(raw):
            raise RuntimeError("download is not an EPUB (AO3 may have sent an error page)")
        stats = format_epub(raw, dest, story)
    finally:
        os.remove(raw)
    log("{}: wrote {} ({:.1f} MB) - {}".format(name, dest, os.path.getsize(dest) / 1e6, stats_text(stats)))
    if story.get("cleanup", True) and stats["chapter_titles"] == 0:
        log("{}: WARNING - no chapter headings matched; AO3's EPUB layout may have changed".format(name))
    if story.get("chapter_titles") and stats["deco_titles"] == 0:
        log("{}: WARNING - no decorative chapter titles inserted".format(name))
    state[name] = {"updated_at": stamp, "recipe": recipe, "chapters": chapters,
                   "built": datetime.datetime.now().isoformat(timespec="seconds")}
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="rebuild even if nothing changed")
    ap.add_argument("--local", help="format this EPUB file instead of downloading")
    ap.add_argument("--story", help="only this story (by name)")
    ap.add_argument("--ci", action="store_true",
                    help="GitHub mode: skip on unchanged state even if no output file exists")
    ap.add_argument("--state", default=STATE_PATH, help="state file to use (default: state.json)")
    args = ap.parse_args()

    config = load_json(CONFIG_PATH, None)
    out_dir = os.path.join(HERE, config.get("output_dir", "output"))
    os.makedirs(out_dir, exist_ok=True)
    stories = [s for s in config["stories"] if not args.story or s["name"] == args.story]
    if not stories:
        sys.exit("no matching story in stories.json")

    if args.local:
        s = stories[0]
        dest = output_path(s, out_dir)
        stats = format_epub(args.local, dest, s)
        log("{}: formatted local file -> {} ({})".format(s["name"], dest, stats_text(stats)))
        return 0

    state = load_json(args.state, {})
    failures = 0
    for i, story in enumerate(stories):
        if i:
            time.sleep(5)  # be gentle with AO3 between stories
        try:
            process(story, out_dir, state, args.force, args.ci)
        except Exception as e:
            failures += 1
            log("{}: FAILED - {}".format(story["name"], e))
        save_json(args.state, state)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
