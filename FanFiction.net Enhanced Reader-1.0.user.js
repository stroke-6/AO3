// ==UserScript==
// @name         FanFiction.net Enhanced Reader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Display images from lensdump codes, style chapter titles, enable text selection, and enhance reading experience on fanfiction.net — for me, at least
// @author       stroke6
// @match        https://www.fanfiction.net/*
// @match        https://fanfiction.net/*
// @match        https://m.fanfiction.net/*
// @grant        none
// @updateURL
// @downloadURL
// ==/UserScript==

(function() {
    'use strict';

    // ========================================
    // STROKE6'S FANFICTION.NET ENHANCED READER SCRIPT
    // ========================================
    // Features:
    // - Convert i/[code] patterns into clickable image buttons
    // - Automatically style chapter titles and Japanese text — the latter is for Crimson Horizons
    // - Enable text selection on pages, because I dislike not being able to do so.
    // - Support for both desktop and mobile versions — probably
    //
    // Usage:
    // - Image codes like i/D7UmSr become clickable buttons
    // - Buttons try multiple subdomains (a-z.l3n.co) to find images
    // ========================================

    // CSS for the image overlay and styling
    const overlayCSS = `
        .ffn-image-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        }

        .ffn-image-overlay img {
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .ffn-image-btn {
            background-color: rgba(117,7,5, 0.2);
            color: inherit;
            border: none;
            padding: 0.25em;
            margin: 0 4px;
            border-radius: 4px;
            border-bottom: 1px solid #891111;
            cursor: pointer;
            font-size: inherit;
            text-decoration: none;
            display: inline-block;
            transition-duration: 0.2s;
            position: relative;
        }

        .ffn-image-btn:hover {
            color: #111;
            text-decoration: none;
            border-bottom: 1px solid;
            box-shadow: 2px 2px 0px #891111;
        }

        .ffn-image-btn:active {
            color: #111;
            background: #ccc;
            border-color: #fff;
            box-shadow: inset 1px 1px 3px #333;
            transform: translateY(4px);
        }

        .ffn-image-btn::before {
            content: url('https://c.l3n.co/i/vJpYDq.png');
            transform: scale(0.05);
            display: inline-block;
            width: 1em;
            height: 1em;
            vertical-align: top;
            margin-right: 0.5em;
            position: relative;
            top: -0.1em;
        }

        .ffn-image-btn::after {
            content: " ↓";
        }

        .ffn-image-title {
            font-size: 140%;
            font-weight: bold;
            font-family: PT Serif, Georgia;
            color: #750705;
        }

        .ffn-image-loading {
            color: #666;
            font-style: italic;
        }

        .strongred {
            font-size: 140% !important;
            font-weight: bold !important;
            font-family: PT Serif, Georgia !important;
            color: #750705 !important;
        }

        p .red .strongred {
            font-size: 3em !important;
            line-height: 1 !important;
            font-weight: bold !important;
        }

        .ffn-kanji-styled {
            font-size: 3em !important;
            line-height: 1 !important;
            font-weight: bold !important;
            font-family: PT Serif, Georgia !important;
            color: #750705 !important;
        }
    `;

    // Add CSS to page
    const style = document.createElement('style');
    style.textContent = overlayCSS;
    document.head.appendChild(style);

    // Function to try loading image from different subdomains
    function tryImageUrls(code, callback) {
        const subdomains = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        let currentIndex = 0;

        function tryNext() {
            if (currentIndex >= subdomains.length) {
                callback(null); // All failed
                return;
            }

            const subdomain = subdomains[currentIndex];
            const url = `https://${subdomain}.l3n.co/i/${code}.png`;

            // Create a test image to check if URL works
            const testImg = new Image();
            testImg.onload = function() {
                callback(url); // Success!
            };
            testImg.onerror = function() {
                currentIndex++;
                tryNext(); // Try next subdomain
            };
            testImg.src = url;
        }

        tryNext();
    }

    // Function to create image overlay
    function createImageOverlay(imageCode) {
        const overlay = document.createElement('div');
        overlay.className = 'ffn-image-overlay';

        // Add loading indicator
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Finding image...';
        loadingText.className = 'ffn-image-loading';
        overlay.appendChild(loadingText);

        // Close overlay when clicked
        overlay.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        document.body.appendChild(overlay);

        // Try to find working image URL
        tryImageUrls(imageCode, function(workingUrl) {
            if (workingUrl) {
                // Success - load the actual image
                const img = document.createElement('img');
                img.src = workingUrl;
                img.alt = 'Chapter Image';

                img.onload = function() {
                    overlay.innerHTML = '';

                    // Create title element
                    const title = document.createElement('div');
                    title.className = 'ffn-image-title';
                    title.textContent = 'Linked Picture';
                    title.style.position = 'absolute';
                    title.style.top = '20px';
                    title.style.left = '50%';
                    title.style.transform = 'translateX(-50%)';
                    title.style.zIndex = '10001';
                    title.style.textAlign = 'center';
                    title.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    title.style.padding = '10px 20px';
                    title.style.borderRadius = '8px';

                    overlay.appendChild(title);
                    overlay.appendChild(img);

                    // Re-add click handler since we cleared innerHTML
                    overlay.addEventListener('click', function() {
                        document.body.removeChild(overlay);
                    });
                };

                img.onerror = function() {
                    overlay.innerHTML = '<div style="color: white; text-align: center;">Failed to load image</div>';
                };
            } else {
                // All subdomains failed
                overlay.innerHTML = '<div style="color: white; text-align: center;">Image not found on any server</div>';
            }
        });
    }

    // Function to enable text selection
    function enableTextSelection() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;
        document.head.appendChild(style);

        // Also remove any existing user-select CSS
        const existingStyles = document.querySelectorAll('style');
        existingStyles.forEach(styleEl => {
            if (styleEl.textContent.includes('user-select: none')) {
                styleEl.textContent = styleEl.textContent.replace(/user-select:\s*none/g, 'user-select: text');
            }
        });

        console.log('Text selection enabled');
    }

    // Function to detect and style Japanese characters (kanji, hiragana, katakana)
    function isJapanese(char) {
        const code = char.charCodeAt(0);
        return (code >= 0x3040 && code <= 0x309F) || // Hiragana
               (code >= 0x30A0 && code <= 0x30FF) || // Katakana
               (code >= 0x4E00 && code <= 0x9FAF) || // CJK Unified Ideographs (Kanji)
               (code >= 0x3400 && code <= 0x4DBF);   // CJK Extension A
    }

    // Function to check if we're on the specific fanfiction that has Y-code titles
    function isSpecificFanfiction() {
        return window.location.href.includes('fanfiction.net/s/14396658/') ||
               window.location.href.includes('m.fanfiction.net/s/14396658/');
    }

    // Function to check if text matches Y-code pattern (Y[code]AC or Y[code]BC)
    function isYCodeTitle(text) {
        return /^Y\d+[AB]C:/.test(text.trim());
    }

    // Function to check if text is all uppercase (ignoring spaces, numbers, and punctuation)
    function isAllUppercase(text) {
        const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
        return lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
    }

    // Function to check if element is between HR tags
    function isBetweenHrTags(element) {
        let prevSibling = element.previousElementSibling;
        let nextSibling = element.nextElementSibling;

        // Look for HR before this element
        let hasHrBefore = false;
        while (prevSibling) {
            if (prevSibling.tagName === 'HR') {
                hasHrBefore = true;
                break;
            }
            if (prevSibling.textContent.trim().length > 0) break; // Stop if we find substantial content
            prevSibling = prevSibling.previousElementSibling;
        }

        // Look for HR after this element
        let hasHrAfter = false;
        while (nextSibling) {
            if (nextSibling.tagName === 'HR') {
                hasHrAfter = true;
                break;
            }
            if (nextSibling.textContent.trim().length > 0) break; // Stop if we find substantial content
            nextSibling = nextSibling.nextElementSibling;
        }

        return hasHrBefore && hasHrAfter;
    }

    // Function to style chapter titles and kanji
    function styleChapterElements() {
        // Find all centered paragraphs (works on both desktop and mobile)
        const centeredParagraphs = document.querySelectorAll('p[style*="text-align:center"], p[style*="text-align: center"], .center, .text-center');

        centeredParagraphs.forEach(p => {
            const textContent = p.textContent.trim();
            const isBetweenHrs = isBetweenHrTags(p);

            // Check strong elements first
            const strongElements = p.querySelectorAll('strong');
            strongElements.forEach(strong => {
                const strongText = strong.textContent.trim();

                // Skip if already styled
                if (strong.classList.contains('strongred')) {
                    return;
                }

                // Check for Y-code titles on specific fanfiction
                if (isSpecificFanfiction() && isYCodeTitle(strongText)) {
                    strong.classList.add('strongred');
                    console.log('Styled Y-code title:', strongText);
                }
                // Only style if text is ALL UPPERCASE (or contains chapter number pattern)
                else if ((strongText.match(/^\d+\s*[—–-]\s*.+/) && isAllUppercase(strongText.replace(/^\d+\s*[—–-]\s*/, ''))) ||
                    isAllUppercase(strongText)) {
                    strong.classList.add('strongred');
                    console.log('Styled chapter title (strong):', strongText);
                }
            });

            // Also check if the entire paragraph matches Y-code pattern (even without strong tags)
            if (strongElements.length === 0) {
                // Skip if already has a styled child
                if (p.querySelector('.strongred')) {
                    return;
                }

                if (isSpecificFanfiction() && isYCodeTitle(textContent)) {
                    const span = document.createElement('span');
                    span.className = 'strongred';
                    span.innerHTML = p.innerHTML;
                    p.innerHTML = '';
                    p.appendChild(span);
                    console.log('Styled Y-code title (no strong):', textContent);
                }
                else if (isAllUppercase(textContent) && textContent.length > 2) {
                    // Add a span wrapper to style the text
                    const span = document.createElement('span');
                    span.className = 'strongred';
                    span.innerHTML = p.innerHTML;
                    p.innerHTML = '';
                    p.appendChild(span);
                    console.log('Styled chapter title (full caps):', textContent);
                }
                // Special case for text between HR tags - but still must be uppercase
                else if (isBetweenHrs && isAllUppercase(textContent) && textContent.length > 2) {
                    const span = document.createElement('span');
                    span.className = 'strongred';
                    span.innerHTML = p.innerHTML;
                    p.innerHTML = '';
                    p.appendChild(span);
                    console.log('Styled chapter title (between HRs):', textContent);
                }
            }
        });

        // Find and style Japanese text (kanji, hiragana, katakana)
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Skip if inside script, style, or already processed elements
            if (node.parentNode.tagName === 'SCRIPT' ||
                node.parentNode.tagName === 'STYLE' ||
                node.parentNode.classList.contains('ffn-image-btn')) {
                continue;
            }
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            let hasJapanese = false;

            // Skip if already processed or inside styled elements
            if (textNode.parentNode.classList.contains('ffn-kanji-styled') ||
                textNode.parentNode.classList.contains('strongred') ||
                textNode.parentNode.classList.contains('ffn-image-btn')) {
                return;
            }

            // Check if text contains Japanese characters
            for (let char of text) {
                if (isJapanese(char)) {
                    hasJapanese = true;
                    break;
                }
            }

            if (hasJapanese) {
                // Check if it's in a centered paragraph
                let parent = textNode.parentNode;
                while (parent && parent !== document.body) {
                    if (parent.tagName === 'P' &&
                        (parent.style.textAlign === 'center' ||
                         parent.getAttribute('style')?.includes('text-align:center') ||
                         parent.getAttribute('style')?.includes('text-align: center') ||
                         parent.classList.contains('center') ||
                         parent.classList.contains('text-center'))) {

                        // Wrap Japanese text in styled span
                        const span = document.createElement('span');
                        span.className = 'ffn-kanji-styled';
                        span.textContent = text;
                        textNode.parentNode.replaceChild(span, textNode);
                        console.log('Styled Japanese text:', text.trim());
                        break;
                    }
                    parent = parent.parentNode;
                }
            }
        });
    }

    // Function to process image codes
    function processImageCodes() {
        // Find the chapter content - try multiple selectors for both desktop and mobile fanfiction.net
        const chapterContent = document.querySelector('#storytext, .storytext, .userstuff, #content, .chapter-content, div[style*="font-family"], .mobile-chapter, .chapter-text');

        if (!chapterContent) {
            console.log('Could not find chapter content');
            // Try to find any div containing text in the body
            const bodyDivs = document.querySelectorAll('body div');
            let foundContent = false;

            bodyDivs.forEach(div => {
                if (div.textContent.includes('i/') && div.textContent.length > 100) {
                    processTextInElement(div);
                    foundContent = true;
                }
            });

            if (!foundContent) {
                console.log('No content found to process');
            }
            return;
        }

        console.log('Found chapter content, processing...');
        processTextInElement(chapterContent);
    }

    // Function to process text in a specific element
    function processTextInElement(element) {

        // Regular expression to match i/code format (without quotes)
        const imageRegex = /i\/([A-Za-z0-9]+)/g;

        // Get all text nodes in the element
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        console.log(`Found ${textNodes.length} text nodes to process`);

        // Process each text node
        textNodes.forEach(function(textNode) {
            const text = textNode.textContent;
            let match;
            const matches = [];

            // Reset regex lastIndex to avoid issues with global regex
            imageRegex.lastIndex = 0;

            // Find all matches in this text node
            while ((match = imageRegex.exec(text)) !== null) {
                matches.push({
                    fullMatch: match[0],
                    code: match[1],
                    index: match.index
                });
                console.log(`Found image code: ${match[1]}`);
            }

            // If we found matches, replace the text node with HTML
            if (matches.length > 0) {
                const parent = textNode.parentNode;
                const fragment = document.createDocumentFragment();

                let lastIndex = 0;

                matches.forEach(function(match) {
                    // Add text before the match
                    if (match.index > lastIndex) {
                        const beforeText = text.slice(lastIndex, match.index);
                        fragment.appendChild(document.createTextNode(beforeText));
                    }

                    // Create the image button
                    const button = document.createElement('button');
                    button.className = 'ffn-image-btn';
                    button.textContent = match.code;
                    button.title = `Click to view image: ${match.code}`;

                    // Add click event to show image
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        createImageOverlay(match.code);
                    });

                    fragment.appendChild(button);

                    lastIndex = match.index + match.fullMatch.length;
                });

                // Add remaining text after the last match
                if (lastIndex < text.length) {
                    const afterText = text.slice(lastIndex);
                    fragment.appendChild(document.createTextNode(afterText));
                }

                // Replace the original text node with our fragment
                parent.replaceChild(fragment, textNode);
            }
        });
    }

    // Main function to run all enhancements
    function runAllEnhancements() {
        enableTextSelection();
        styleChapterElements();
        processImageCodes();
    }

    // Wait for the page to load, then run all enhancements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllEnhancements);
    } else {
        runAllEnhancements();
    }

    // Also run when navigating between chapters (for sites that use AJAX)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(runAllEnhancements, 500); // Small delay to ensure content is loaded
        }
    }).observe(document, {subtree: true, childList: true});

    // Add keyboard shortcut to manually trigger the script (Ctrl+Shift+I)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            console.log('Manual trigger activated');
            runAllEnhancements();
        }
    });

})();