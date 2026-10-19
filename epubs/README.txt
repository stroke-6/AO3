Formatted EPUBs
===============

Every day GitHub runs .github/workflows/epubs.yml, which:
  1. reads each AO3 work page listed in stories.json,
  2. if AO3 has a new version, downloads it and applies the Sigil formatting
     (cover first, custom CSS, chapter notes + chapter titles removed),
  3. uploads it to the "epubs" release.

Reader links (permanent, always the newest version):
  https://github.com/stroke-6/AO3/releases/download/epubs/Crimson_Horizons.epub

Adding a story:
  - put cover.xhtml + cover_image.png in epubs/covers/<Short>/
  - add an entry to stories.json, e.g.
      { "name": "Indra", "work_id": 12345678, "cover_dir": "covers/Indra" }
  - its link will be .../releases/download/epubs/Indra.epub
    (spaces in the name become underscores)

Running it by hand:
  GitHub > Actions > "Build formatted EPUBs" > Run workflow
  (tick "Rebuild" to rebuild even without an AO3 update)

If a run fails (e.g. AO3 down all day), GitHub emails you; the next day's run tries again.


Card for index.html (paste inside the Crimson Horizons <div class="cards">):

            <a class="card ch" href="https://github.com/stroke-6/AO3/releases/download/epubs/Crimson_Horizons.epub">
              <div class="card-title">Download EPUB</div>
              <div class="card-desc">The full story, always up to date, with cover and custom formatting.</div>
            </a>
