Formatted EPUBs
===============

GitHub runs .github/workflows/epubs.yml, which:
  1. reads each AO3 work page listed in stories.json,
  2. if AO3 has a new version (or the story's formatting settings changed),
     downloads it and formats it,
  3. uploads it to the "epubs" release.

When stories are checked (set with "check" in stories.json):
  daily   - every day at 05:17 UTC        (Crimson Horizons)
  manual  - only when you run the workflow (From the Ring, With Love; Indra: Extra; Indra)

Running it by hand:
  GitHub > Actions > "Build formatted EPUBs" > Run workflow
  - "Which story to check": one story, or All stories
  - "Rebuild": rebuild even if nothing changed on AO3

Reader links (permanent, always the newest version):
  https://github.com/stroke-6/AO3/releases/download/epubs/Crimson_Horizons.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/From_the_Ring_With_Love.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/Indra_Extra.epub
  https://github.com/stroke-6/AO3/releases/download/epubs/Indra.epub


Story settings (stories.json)
-----------------------------
  "name"             story name (also used in the "Which story" menu of the workflow)
  "work_id"          AO3 work number
  "check"            "daily" or "manual"
  "color"            colour of bold text (strong), e.g. "#750705"
  "cover_dir"        folder whose files are all added to the EPUB (cover pages + images)
  optional:
  "file"             download file name without .epub (default: name, spaces -> _)
  "cover_pages"      pages put first, in this order (default: ["cover.xhtml"])
  "cover_image"      thumbnail image (default: cover_image.png)
  "cleanup": false   do NOT remove chapter notes / chapter titles (Indra, IE)
  "chapter_titles"   AO3 workskin CSS with per-chapter decorative titles (workskins/*.css);
                     each "#chapter-N ... content: "..."" becomes a title above chapter N,
                     styled like the workskin's ::before rule
  "remove_chapters"  chapter numbers to drop entirely, e.g. [121]

Updating the decorative titles: paste the new workskin into workskins/Indra.css or IE.css.
Changing any setting, cover file or workskin makes the next run rebuild that story.

Adding a story: put its cover files in covers/<Short>/, add an entry to stories.json,
and add its name to the "options" list in .github/workflows/epubs.yml.

If a run fails (e.g. AO3 down all day), GitHub emails you.


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
