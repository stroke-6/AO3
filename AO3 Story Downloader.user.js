// ==UserScript==
// @name         AO3 Story Downloader - Full Page v7,6 — Working, no Notes
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Download AO3 stories from full work page into EPUB format with images
// @author       stroke6
// @match        https://archiveofourown.org/works/*?view_full_work=true
// @match        https://archiveofourown.org/works/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_download
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS styles for our button and status text
    GM_addStyle(`
        .epub-download-btn {
            background-color: #990000;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            border: none;
            margin: 0 8px;
            display: inline-block;
        }
        .epub-download-btn:hover {
            background-color: #660000;
        }
        .download-status {
            font-style: italic;
            display: block;
            margin-top: 5px;
            font-size: 0.9em;
            color: #333;
            text-align: center;
        }
        .download-container {
            display: inline-block;
            position: relative;
        }
    `);

    // Create and add the download button to the navigation menu
    function addDownloadButton() {
        // Find the navigation menu
        const navigationMenu = document.querySelector('ul.work.navigation.actions');
        if (!navigationMenu) return;

        // Create a new list item for our button
        const listItem = document.createElement('li');
        listItem.className = 'download-container';

        // Create the button
        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'epub-download-btn';
        downloadBtn.textContent = 'EPUB with Images —  Aligned';
        downloadBtn.href = '#';
        downloadBtn.addEventListener('click', startDownload);

        // Create status display (positioned under the button)
        const statusDiv = document.createElement('div');
        statusDiv.className = 'download-status';
        statusDiv.style.display = 'none';

        // Add elements to the navigation menu
        listItem.appendChild(downloadBtn);
        listItem.appendChild(statusDiv);
        navigationMenu.appendChild(listItem);
    }

    // Function to start the download process
    async function startDownload(event) {
        // Prevent default action if it's a link
        event.preventDefault();

        // Find the status div (now it's a sibling of the button)
        const statusDiv = event.target.parentNode.querySelector('.download-status');
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.textContent = 'Starting download...';
        }

        try {
            // Check if we're on a full work page
            const isFullWorkPage = window.location.href.includes('view_full_work=true');
            if (!isFullWorkPage) {
                // If not on full work page, redirect to it
                const fullWorkUrl = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'view_full_work=true';
                if (statusDiv) {
                    statusDiv.textContent = 'Redirecting to full work view...';
                }
                window.location.href = fullWorkUrl;
                return;
            }

            // Get story metadata
            const storyData = extractStoryMetadata();
            if (statusDiv) {
                statusDiv.textContent = `Preparing EPUB for "${storyData.title}"...`;
            }

            // Create a new JSZip instance
            const zip = new JSZip();

            // Add mimetype file (must be first and uncompressed)
            zip.file("mimetype", "application/epub+zip");

            // Add META-INF directory
            zip.file("META-INF/container.xml", createContainerXml());

            // Add OEBPS directory
            const oebps = zip.folder("OEBPS");

            // Add style file
            oebps.file("styles.css", extractAO3Styles());

            // Process all images on the page
            if (statusDiv) {
                statusDiv.textContent = 'Processing images...';
            }
            const imageData = await processAllImages(oebps);

            // Use the first image as the cover if available
            let coverImageId = null;
            if (imageData.manifestEntries.length > 0) {
                if (statusDiv) {
                    statusDiv.textContent = 'Creating cover image...';
                }
                const firstImage = imageData.manifestEntries[0];
                coverImageId = firstImage.id;

                // Create a cover HTML file
                oebps.file("cover.xhtml", createCoverXhtml(firstImage.href));
            }

            // Process chapters from the full work page
            if (statusDiv) {
                statusDiv.textContent = 'Processing chapters...';
            }
            const chapters = processChaptersFromPage();

            // Add chapters to the EPUB
            let actualChapterNumber = 1; // Keep track of real chapter numbers after filtering
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                if (statusDiv) {
                    statusDiv.textContent = `Processing chapter ${i+1}/${chapters.length}...`;
                }

                // Add chapter to zip with processed image references
                const processedHtml = await processChapterHtml(chapter.content, imageData);
                oebps.file(chapter.filename, createChapterXhtml(
                    {title: chapter.title, content: processedHtml},
                    actualChapterNumber
                ));
                actualChapterNumber++;
            }

            // Add content.opf file with image manifest entries
            oebps.file("content.opf", createContentOpf(storyData, chapters, imageData.manifestEntries, coverImageId));

            // Add toc.ncx file
            oebps.file("toc.ncx", createTocNcx(storyData, chapters, coverImageId));

            // Generate EPUB filename
            const safeTitle = storyData.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            const filename = `${safeTitle}.epub`;

            // Generate EPUB file
            if (statusDiv) {
                statusDiv.textContent = 'Creating EPUB file...';
            }
            const epubBlob = await zip.generateAsync({type: 'blob', compression: 'DEFLATE'});

            // Save the file
            saveAs(epubBlob, filename);
            if (statusDiv) {
                statusDiv.textContent = 'Download complete!';

                // Hide the status after a few seconds
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        } catch (error) {
            console.error('Error generating EPUB:', error);
            if (statusDiv) {
                statusDiv.textContent = `Error: ${error.message}`;
            }
        }
    }

    // Extract story metadata
    function extractStoryMetadata() {
        const title = document.querySelector('h2.title').textContent.trim();
        const author = document.querySelector('a[rel="author"]').textContent.trim();
        const summary = document.querySelector('.summary .userstuff')?.innerHTML || '';

        // Get tags
        const tags = [];
        document.querySelectorAll('.tags .tag').forEach(tag => {
            tags.push(tag.textContent.trim());
        });

        // Get publication date
        const pubDate = document.querySelector('.published').textContent.replace('Published:', '').trim();

        return {
            title,
            author,
            summary,
            tags,
            pubDate,
            language: 'en-US',
            uuid: 'urn:uuid:' + generateUUID()
        };
    }

    // Process all chapters from the full work page
    function processChaptersFromPage() {
        const chapters = [];
        let chapterCounter = 1;

        // Get all chapter divs
        const chapterDivs = document.querySelectorAll('#chapters .chapter');

        if (chapterDivs.length > 0) {
            // Multi-chapter story
            for (let i = 0; i < chapterDivs.length; i++) {
                const chapterDiv = chapterDivs[i];

                // Get the chapter title
                const chapterTitle = chapterDiv.querySelector('.title')?.textContent.trim() || `Chapter ${i + 1}`;

                // Skip chapters that are only author's notes (titles starting with AN:)
                if (chapterTitle.startsWith('AN:')) {
                    continue;
                }

                // Get the main chapter content
                const mainContent = chapterDiv.querySelector('.userstuff.module[role="article"]');

                if (mainContent) {
                    // Create a container for the chapter content
                    const fullChapterContent = document.createElement('div');

                    // Clone the main content and add it to our container
                    const contentClone = mainContent.cloneNode(true);
                    fullChapterContent.appendChild(contentClone);

                    // Process the content (cleanup, formatting)
                    cleanupChapterContent(fullChapterContent);

                    // Now process any notes that should be included (after the main content)
                    // Get preface groups (author's notes) within this chapter that should be included
                    const notesToInclude = [];
                    const prefaceGroups = chapterDiv.querySelectorAll('.chapter.preface.group');

                    prefaceGroups.forEach(prefaceGroup => {
                        // Skip preface groups that match the exclusion criteria
                        if (shouldExcludeNote(prefaceGroup)) {
                            return;
                        }

                        const notesClone = prefaceGroup.cloneNode(true);

                        // Add a class to style it as author's notes
                        notesClone.classList.add('author-notes-section');

                        // Add a heading if it doesn't already have one
                        if (!notesClone.querySelector('h3, h4, h5')) {
                            const heading = document.createElement('h3');
                            heading.className = 'author-notes-heading';
                            heading.textContent = "Author's Note";
                            notesClone.insertBefore(heading, notesClone.firstChild);
                        }

                        notesToInclude.push(notesClone);
                    });

                    // Add any included notes at the end of the chapter
                    for (const note of notesToInclude) {
                        fullChapterContent.appendChild(note);
                    }

                    // Create the chapter object
                    chapters.push({
                        number: chapterCounter,
                        filename: `chapter${chapterCounter}.xhtml`,
                        title: chapterTitle,
                        content: fullChapterContent.innerHTML
                    });

                    chapterCounter++;
                }
            }
        } else {
            // Single chapter story
            const content = document.querySelector('#chapters .userstuff');
            if (content) {
                // Create a container for chapter content
                const fullChapterContent = document.createElement('div');

                // Clone the main content and add it to our container
                const contentClone = content.cloneNode(true);
                fullChapterContent.appendChild(contentClone);

                // Process the content
                cleanupChapterContent(fullChapterContent);

                // Get preface groups (author's notes) that should be included
                const notesToInclude = [];
                const prefaceGroups = document.querySelectorAll('#chapters .preface.group');

                prefaceGroups.forEach(prefaceGroup => {
                    // Skip preface groups that match the exclusion criteria
                    if (shouldExcludeNote(prefaceGroup)) {
                        return;
                    }

                    const notesClone = prefaceGroup.cloneNode(true);

                    // Add a class to style it as author's notes
                    notesClone.classList.add('author-notes-section');

                    // Add a heading if it doesn't already have one
                    if (!notesClone.querySelector('h3, h4, h5')) {
                        const heading = document.createElement('h3');
                        heading.className = 'author-notes-heading';
                        heading.textContent = "Author's Note";
                        notesClone.insertBefore(heading, notesClone.firstChild);
                    }

                    notesToInclude.push(notesClone);
                });

                // Add any included notes at the end of the chapter
                for (const note of notesToInclude) {
                    fullChapterContent.appendChild(note);
                }

                chapters.push({
                    number: 1,
                    filename: 'chapter1.xhtml',
                    title: document.querySelector('h2.title')?.textContent.trim() || 'Chapter 1',
                    content: fullChapterContent.innerHTML
                });
            }
        }

        return chapters;
    }

    // Helper function to determine if a note should be excluded
    function shouldExcludeNote(noteElement) {
        // Check if this is a note that should be excluded based on the CSS selectors

        // Check for #notes ID
        if (noteElement.id === 'notes') {
            return true;
        }

        // Check for h3.title (parent check)
        if (noteElement.querySelector('h3.title')) {
            return true;
        }

        // Check for .preface.group div h3
        if (noteElement.classList.contains('preface') &&
            noteElement.classList.contains('group') &&
            noteElement.querySelector('div h3')) {
            return true;
        }

        return false;
    }

    // Clean up chapter content to remove unnecessary elements and apply formatting
    function cleanupChapterContent(contentElement) {
        // Remove "Chapter Text" headers
        const chapterTextHeaders = contentElement.querySelectorAll('h3');
        chapterTextHeaders.forEach(header => {
            if (header.textContent.trim() === 'Chapter Text') {
                header.remove();
            }
        });

        // Handle action menus and other AO3-specific UI elements
        const actionMenus = contentElement.querySelectorAll('ul.actions, ul.chapter.actions, .landmark.heading');
        actionMenus.forEach(menu => menu.remove());

        // No need to remove author's notes anymore since we want to keep them

        // Make all images centered
        const images = contentElement.querySelectorAll('img');
        images.forEach(img => {
            // Create a centered div container
            const centerDiv = document.createElement('div');
            centerDiv.style.textAlign = 'center';
            centerDiv.style.margin = '1em 0';

            // Replace the image with the centered container
            const parent = img.parentNode;
            parent.replaceChild(centerDiv, img);
            centerDiv.appendChild(img);

            // Make sure the image has a max-width
            img.style.maxWidth = '100%';
        });

        // Process bold text (except epigraphs) to use the specified color
        const boldElements = contentElement.querySelectorAll('b, strong');
        boldElements.forEach(boldElement => {
            // Check if it's not inside an epigraph
            if (!isInsideEpigraph(boldElement)) {
                boldElement.style.color = '#750705';
            }
        });
    }

    // Helper function to check if an element is inside an epigraph
    function isInsideEpigraph(element) {
        let parent = element.parentNode;
        while (parent) {
            if (parent.classList && (
                parent.classList.contains('epigraph') ||
                parent.classList.contains('blockquote')
            )) {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    // Process and download all images
    async function processAllImages(oebps) {
        const imgElements = document.querySelectorAll('#chapters img');
        const images = {};
        const manifestEntries = [];
        let imageCounter = 1;

        for (const img of imgElements) {
            const src = img.src;

            if (src && !images[src]) {
                try {
                    // Download the image
                    const imageBlob = await fetchImage(src);
                    const imageType = imageBlob.type || 'image/jpeg';
                    const extension = imageType.split('/')[1] || 'jpg';
                    const imageName = `image_${imageCounter}.${extension}`;

                    // Add image to the images object
                    images[src] = {
                        name: imageName,
                        type: imageType
                    };

                    // Add image to the manifest entries
                    manifestEntries.push({
                        id: `image_${imageCounter}`,
                        href: imageName,
                        mediaType: imageType
                    });

                    // Add the image to the EPUB
                    oebps.file(imageName, imageBlob);

                    imageCounter++;
                } catch (error) {
                    console.error(`Error downloading image ${src}:`, error);
                }
            }
        }

        return {
            images,
            manifestEntries
        };
    }

    // Fetch an image
    function fetchImage(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.response);
                    } else {
                        reject(new Error(`Failed to fetch image: ${response.status}`));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // Process chapter HTML to replace image sources
    async function processChapterHtml(html, imageData) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');

        // Process images
        const imgElements = doc.querySelectorAll('img');
        for (const img of imgElements) {
            const src = img.src;

            if (src && imageData.images[src]) {
                img.src = imageData.images[src].name;
            }

            // Ensure all images are centered
            const parent = img.parentNode;
            if (parent.tagName.toLowerCase() !== 'div' ||
                parent.style.textAlign !== 'center') {

                // Create a centered div container if not already in one
                const centerDiv = document.createElement('div');
                centerDiv.style.textAlign = 'center';
                centerDiv.style.margin = '1em 0';

                // Replace the image with the centered container
                parent.replaceChild(centerDiv, img);
                centerDiv.appendChild(img);
            }

            // Make sure the image has max-width
            img.style.maxWidth = '100%';
        }

        // Add special class to bold elements for coloring
        const boldElements = doc.querySelectorAll('b, strong');
        boldElements.forEach(boldElement => {
            // Check if it's not inside an epigraph
            if (!isInsideEpigraphNode(boldElement)) {
                boldElement.classList.add('special-bold');
            }
        });

        return doc.querySelector('div').innerHTML;
    }

    // Helper function to check if a node is inside an epigraph
    function isInsideEpigraphNode(node) {
        let parent = node.parentNode;
        while (parent && parent.nodeType === Node.ELEMENT_NODE) {
            if (parent.classList && (
                parent.classList.contains('epigraph') ||
                parent.classList.contains('blockquote') ||
                parent.tagName.toLowerCase() === 'blockquote'
            )) {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    // Create container.xml
    function createContainerXml() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    }

   // Update the createCoverXhtml function for better centering
function createCoverXhtml(coverImageHref) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .cover {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    .cover-image {
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="cover">
    <img src="${coverImageHref}" alt="Cover" class="cover-image" />
  </div>
</body>
</html>`;
}

    // Create content.opf
    function createContentOpf(storyData, chapters = [], imageManifestEntries = [], coverImageId = null) {
        let chaptersManifest = '';
        let chaptersSpine = '';
        let imagesManifest = '';
        let coverImageMeta = '';
        let coverXhtmlEntry = '';

        // Add cover metadata if a cover image is available
        if (coverImageId) {
            coverImageMeta = `    <meta name="cover" content="${coverImageId}" />\n`;
            coverXhtmlEntry = `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" />\n`;
        }

        // Add chapters to manifest and spine
        chapters.forEach(chapter => {
            chaptersManifest += `    <item id="chapter${chapter.number}" href="${chapter.filename}" media-type="application/xhtml+xml"/>\n`;
            chaptersSpine += `    <itemref idref="chapter${chapter.number}"/>\n`;
        });

        // Add images to manifest
        imageManifestEntries.forEach(entry => {
            imagesManifest += `    <item id="${entry.id}" href="${entry.href}" media-type="${entry.mediaType}"/>\n`;
        });

        // Format tags for metadata
        const subjectTags = storyData.tags.map(tag =>
            `    <dc:subject>${escapeXml(tag)}</dc:subject>`
        ).join('\n');

        let spine = '<spine toc="ncx">\n';

        // Add cover to spine if available
        if (coverImageId) {
            spine += '    <itemref idref="cover"/>\n';
        }

        spine += `${chaptersSpine}  </spine>`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(storyData.title)}</dc:title>
    <dc:creator opf:role="aut">${escapeXml(storyData.author)}</dc:creator>
    <dc:language>${storyData.language}</dc:language>
    <dc:identifier id="BookId">${storyData.uuid}</dc:identifier>
    <dc:date>${storyData.pubDate}</dc:date>
${coverImageMeta}${subjectTags}
    <dc:source>Archive of Our Own (archiveofourown.org)</dc:source>
    <dc:rights>This work was downloaded from Archive of Our Own (AO3), the fan fiction repository. The characters and settings in this work belong to their original creators. This work was created under the legal doctrine of fair use.</dc:rights>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="styles" href="styles.css" media-type="text/css"/>
${coverXhtmlEntry}${chaptersManifest}${imagesManifest}
  </manifest>
  ${spine}
</package>`;
    }

    // Create toc.ncx
    function createTocNcx(storyData, chapters = [], hasCover = false) {
        let navPoints = '';
        let playOrder = 1;

        // Add cover to navigation if available
        if (hasCover) {
            navPoints += `
    <navPoint id="navpoint-cover" playOrder="${playOrder}">
      <navLabel>
        <text>Cover</text>
      </navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`;
            playOrder++;
        }

        // Add chapters to navigation
        chapters.forEach(chapter => {
            navPoints += `
    <navPoint id="navpoint-${chapter.number}" playOrder="${playOrder}">
      <navLabel>
        <text>${escapeXml(chapter.title)}</text>
      </navLabel>
      <content src="${chapter.filename}"/>
    </navPoint>`;
            playOrder++;
        });

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${storyData.uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(storyData.title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(storyData.author)}</text>
  </docAuthor>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
    }

    // Extract AO3's CSS styles
    function extractAO3Styles() {
        let styles = `/* Base AO3 Styles */
/* Font family declaration is removed to let the e-reader decide */
body {
  line-height: 1.5;
  margin: 0.5em;
  padding: 0.5em;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 400;
  line-height: 1.2;
}

h1 {
  font-size: 1.5em;
  text-align: center;
  margin: 1em 0;
}

h2 {
  font-size: 1.2em;
  margin: 1em 0 0.5em;
}

a {
  color: #900;
  text-decoration: none;
}

p {
  margin: 0.75em 0;
}

blockquote {
  margin: 1em 2em;
  border-left: 2px solid #999;
  padding-left: 1em;
  font-style: italic;
}

hr {
  border: 0;
  border-top: 1px solid #ccc;
  margin: 1.5em 0;
}

.chapter-title {
  text-align: center;
  margin: 2em 0;
}

.chapter-text {
  margin-top: 1em;
}

/* Author's Notes styling */
.author-notes-section {
  margin: 1.5em 0;
  padding: 1em;
  background-color: #f9f9f9;
  border-left: 3px solid #990000;
}

.author-notes-heading {
  font-weight: bold;
  color: #990000;
  margin-top: 0;
  margin-bottom: 0.5em;
}

/* Chapter preface group styling (AO3 notes, summaries, etc.) */
.chapter.preface.group {
  margin: 1em 0;
  padding: 0.5em;
  border-bottom: 1px solid #ddd;
}

.chapter.preface.group h3 {
  color: #900;
  font-weight: bold;
  margin-top: 0;
}

.chapter.preface.group .notes {
  margin-bottom: 1em;
}

.chapter.preface.group .summary {
  font-style: italic;
}

/* Cover image styling */
.cover {
  text-align: center;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Extracted AO3 specific classes */
.userstuff {
  word-wrap: break-word;
}

.userstuff p {
  margin-bottom: 0;
}

.summary {
  margin-bottom: 1em;
}

/* Image styling */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

/* All images should be centered */
.image-container {
  text-align: center;
  margin: 1em auto;
}

/* Text styling */
b, strong {
  font-weight: bold;
}

.epigraph {
  width: 90%;
  font-size: 110%;
  margin-left: auto;
  margin-right: auto;
  font-family: 'EB Garamond', Garamond, Georgia, serif;
}

.strongred {
  font-size: 140%;
  font-weight: bold;
  font-family: PT Serif, Georgia;
  color: #750705;
}

p .red .strongred {
  font-size: 3em;
  line-height: 1;
  font-weight: bold;
}

.red {
  font-weight: bold;
  font-family: PT Serif;
  color: #750705;
  font-size: 1.2em;
}

/* Specific color for bold text */
.special-bold {
  color: #750705;
}

/* AO3 specific formatting */
.indent {
  text-indent: 3em;
}

.notice {
  background: #eee;
  padding: 0.5em;
  margin: 1em 0;
  border: 1px solid #ddd;
}
`;

        return styles;
    }

    // Create chapter XHTML
    function createChapterXhtml(chapterData, chapterNumber) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(chapterData.title || `Chapter ${chapterNumber}`)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <h1 class="chapter-title">${escapeXml(chapterData.title || `Chapter ${chapterNumber}`)}</h1>
  <div class="chapter-text userstuff">
    ${chapterData.content}
  </div>
</body>
</html>`;
    }

    // Helper function to escape XML special characters
    function escapeXml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Generate a UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Initialize the script
    addDownloadButton();
})();
