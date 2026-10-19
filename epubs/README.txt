Formatted EPUBs
===============

GitHub runs .github/workflows/epubs.yml, which:
  1. reads each AO3 work page listed in stories.json,
  2. if AO3 has a new version, downloads it and applies the Sigil formatting
     (cover pages first, custom CSS, chapter notes + chapter titles removed),
  3. uploads it to the "epubs" release.

Schedule (set per story with "check" in stories.json):
  daily   - every day, 05:17 UTC       (Crimson Horizons)
  weekly  - every Monday, 05:47 UTC    (From the Ring, With Love; Indra: Extra; Indra)

Reader links (permanent, always the newest version):
  https://github.com/stroke-6/AO3/releases/download/epubs/Crimson_Horizons.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/From_the_Ring_With_Love.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/Indra_Extra.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/Indra.epub

Adding a story:
  - put its cover files in epubs/covers/<Short>/ (everything in that folder is added to the EPUB)
  - add an entry to stories.json, e.g.
      { "name": "My Story", "work_id": 12345678, "check": "weekly", "cover_dir": "covers/MS" }
    optional:
      "file": "My_Story"                              download file name (default: name, spaces -> _)
      "cover_pages": ["cover.xhtml", "cover2.xhtml"]  pages put first, in this order (default: cover.xhtml)
      "cover_image": "something.png"                  thumbnail image (default: cover_image.png)

Running it by hand:
  GitHub > Actions > "Build formatted EPUBs" > Run workflow
  (checks every story; tick "Rebuild" to rebuild even without an AO3 update)

If a run fails (e.g. AO3 down all day), GitHub emails you; the next scheduled run tries again.


Cards for index.html (paste inside each story's <div class="cards">):

            <a class="card ch" href="https://github.com/stroke-6/AO3/releases/download/epubs/Crimson_Horizons.epub">
              <div class="card-title">Download EPUB</div>
              <div class="card-desc">The full story, always up to date, with cover and custom formatting.</div>
            </a>

            <a class="card ftrwl" href="https://github.com/stroke-6/AO3/releases/download/epubs/From_the_Ring_With_Love.epub">
              <div class="card-title">Download EPUB</div>
              <div class="card-desc">The full story, always up to date, with cover and custom formatting.</div>
            </a>

  Indra and Indra: Extra have no section on index.html yet; use the same card with their links.
