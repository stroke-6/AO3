// ==UserScript==
// @name         stroke6's AO3 + FFN All-In-One Combined — Reader Version
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Combined bundle of 9 user scripts for my own use, and 6 for you: AO3 enhancements + FanFiction.net Enhanced Reader
// @author       stroke6 (combined)
// @license      MIT
// @run-at       document-start
//
// @match        https://archiveofourown.org/*
//
// @match        https://www.fanfiction.net/s/14312002/*
// @match        https://www.fanfiction.net/s/14396658/*
// @match        https://www.fanfiction.net/s/14163903/*
// @match        https://www.fanfiction.net/s/14095149/*
// @match        https://www.fanfiction.net/s/14285217/*
// @match        https://fanfiction.net/s/14312002/*
// @match        https://fanfiction.net/s/14396658/*
// @match        https://fanfiction.net/s/14163903/*
// @match        https://fanfiction.net/s/14095149/*
// @match        https://fanfiction.net/s/14285217/*
// @match        https://m.fanfiction.net/s/14312002/*
// @match        https://m.fanfiction.net/s/14396658/*
// @match        https://m.fanfiction.net/s/14163903/*
// @match        https://m.fanfiction.net/s/14095149/*
// @match        https://m.fanfiction.net/s/14285217/*
//
// @grant        GM_xmlhttpRequest
// @connect      translate.googleapis.com
// ==/UserScript==

/*
 * Combined Tampermonkey script bundle. Each script lives in its own IIFE and only
 * runs when location.href matches its original target URL(s). To disable a
 * single module, wrap its IIFE in `if (false) { ... }` or comment it out. 
 * Or delete it, who am I to tell you how to live your life...?
 *
 * Bundled modules:
 *   1. AO3 Indra and Extra Kanji & Title Font Picker 
 *   2. [REMOVED]
 *   3. AO3 Story Image Display
 *   4. AO3 Add Updated Bookmarks Link
 *   5. AO3 Direct Chapter Index and List Button (Entire Website)
 *   6. AO3 Indent Paragraphs Button
 *   7. [REMOVED]
 *   8. [REMOVED]
 *   9. FanFiction.net Enhanced Reader
 */

(function bundleRoot() {
    'use strict';

    const here = () => location.href;
    const onUrl = (re) => re.test(location.href);

    function whenReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    // URL predicates --------------------------------------------------------
    const isCrimsonWork    = () => onUrl(/^https:\/\/archiveofourown\.org\/works\/(39294225|42794847)(\/|\?|$)/);
    const isStroke6User    = () => onUrl(/^https:\/\/archiveofourown\.org\/users\/stroke6(\/|\?|$)/);
    const isAnyAO3Page     = () => onUrl(/^https:\/\/archiveofourown\.org\//);
    const isAO3WorkPage    = () => onUrl(/^https:\/\/archiveofourown\.org\/works\//);
    const isAO3WorkOrChap  = () => onUrl(/^https:\/\/archiveofourown\.org\/(works|chapters)\//);
    const isAO3WordCountTarget = () => {
        const path = location.pathname;
        return /\/navigate\/?$/.test(path) || /\/chapters\/\d+\/?$/.test(path);
    };
    const isTargetedFFNStory = () => onUrl(/^https?:\/\/(www\.|m\.)?fanfiction\.net\/s\/(14312002|14396658|14163903|14095149|14285217)\//);


    // =====================================================================
    // MODULE 1 — Indra and Extra Kanji & Title Font Picker
    // Original @match: /works/39294225*, /works/42794847*
    // =====================================================================
    if (isCrimsonWork()) (function moduleCrimsonHorizons() {
        // ---- Theme colour -------------------------------------------------------
        const THEME_COLOR = window.location.href.includes('/works/39294225')
            ? 'rgb(106, 85, 124)'
            : 'rgb(137, 70, 87)';
        const THEME_SHADOW = window.location.href.includes('/works/39294225')
            ? 'rgba(106, 85, 124, 0.2)'
            : 'rgba(137, 70, 87, 0.2)';

        // ---- Font catalog -------------------------------------------------------
        const KANJI_FONTS = [
            { label: 'System (default)',              family: 'serif',           googleName: null,             titleIdx: 0 },
            { label: 'Yuji Mai (wet cursive brush)',  family: 'Yuji Mai',        googleName: 'Yuji+Mai',       titleIdx: 1 },
            { label: 'Yuji Syuku (formal brush)',     family: 'Yuji Syuku',      googleName: 'Yuji+Syuku',     titleIdx: 2 },
            { label: 'Yuji Boku (dry brush)',         family: 'Yuji Boku',       googleName: 'Yuji+Boku',      titleIdx: 3 },
            { label: 'Klee One (handwritten)',        family: 'Klee One',        googleName: 'Klee+One',       titleIdx: 4 },
            { label: 'Shippori Mincho (literary)',    family: 'Shippori Mincho', googleName: 'Shippori+Mincho',titleIdx: 5 },
            { label: 'Noto Serif JP (clean mincho)',  family: 'Noto Serif JP',   googleName: 'Noto+Serif+JP',  titleIdx: 6 },
            { label: 'Hina Mincho (delicate)',        family: 'Hina Mincho',     googleName: 'Hina+Mincho',    titleIdx: 7 },
            { label: 'Kaisei Decol (warm serif)',     family: 'Kaisei Decol',    googleName: 'Kaisei+Decol',   titleIdx: 8 },
            { label: 'Zen Kurenaido (handwritten)',   family: 'Zen Kurenaido',   googleName: 'Zen+Kurenaido',  titleIdx: 9 },
        ];

        const TITLE_FONTS = [
            { label: 'System (default)',                  family: null,                  googleName: null },
            { label: 'Cormorant Garamond (calligraphic)', family: 'Cormorant Garamond',  googleName: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400' },
            { label: 'Cormorant SC (formal small caps)',  family: 'Cormorant SC',        googleName: 'Cormorant+SC:wght@400;600' },
            { label: 'IM Fell English (inky, rough)',     family: 'IM Fell English',     googleName: 'IM+Fell+English:ital@0;1' },
            { label: 'Caveat (handwritten)',              family: 'Caveat',              googleName: 'Caveat:wght@400;600' },
            { label: 'EB Garamond (literary serif)',      family: 'EB Garamond',         googleName: 'EB+Garamond:ital,wght@0,400;0,600;1,400' },
            { label: 'Noto Serif (clean serif)',          family: 'Noto Serif',          googleName: 'Noto+Serif:ital,wght@0,400;0,700;1,400' },
            { label: 'Cormorant (delicate serif)',        family: 'Cormorant',           googleName: 'Cormorant:ital,wght@0,400;0,600;1,400' },
            { label: 'Lora (warm reading serif)',         family: 'Lora',                googleName: 'Lora:ital,wght@0,400;0,600;1,400' },
            { label: 'Indie Flower (casual hand)',        family: 'Indie Flower',        googleName: 'Indie+Flower' },
        ];

        // ---- Preload all Google Fonts ------------------------------------------
        const allGoogleFamilies = [...KANJI_FONTS, ...TITLE_FONTS]
            .filter(f => f.googleName)
            .map(f => `family=${f.googleName}`)
            .join('&');

        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = `https://fonts.googleapis.com/css2?${allGoogleFamilies}&display=swap`;
        document.documentElement.appendChild(fontLink);

        // ---- Style tags --------------------------------------------------------
        const kanjiStyleTag = document.createElement('style');
        kanjiStyleTag.id = 'kanji-font-override';
        document.documentElement.appendChild(kanjiStyleTag);

        const titleStyleTag = document.createElement('style');
        titleStyleTag.id = 'title-font-override';
        document.documentElement.appendChild(titleStyleTag);

        function applyKanjiFont(family) {
            kanjiStyleTag.textContent = `
                #workskin .chapter .preface.group::before {
                    font-family: "${family}", Meiryo, Osaka, sans-serif !important;
                    opacity: 0;
                }
                #workskin .chapter .preface.group.kft-animating::before {
                    position: absolute !important;
                    opacity: 0 !important;
                }
                #workskin .chapter .preface.group.kft-done::before {
                    opacity: 1 !important;
                }
                .kft-kanji-overlay {
                    writing-mode: vertical-rl;
                    text-orientation: upright;
                    color: ${THEME_COLOR};
                    font-size: 2.5em;
                    font-weight: 200;
                    font-family: "${family}", Meiryo, Osaka, sans-serif;
                    letter-spacing: 0.15em;
                    text-shadow: 3px 2px 3px ${THEME_SHADOW};
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    white-space: pre;
                    position: relative;
                    left: 50%;
                    transform: translateX(-50%);
                    width: fit-content;
                }
            `;
        }

        function applyTitleFont(family) {
            if (!family) { titleStyleTag.textContent = ''; return; }
            titleStyleTag.textContent = `
                #workskin .chapter .preface.group h3.title,
                #workskin .chapter .preface.group h3.title a {
                    font-family: "${family}", serif !important;
                }
            `;
        }

        const savedKanjiIdx = parseInt(localStorage.getItem('kft-last-idx') || '0', 10);
        const initialKanjiIdx = isNaN(savedKanjiIdx)
            ? 0
            : Math.max(0, Math.min(savedKanjiIdx, KANJI_FONTS.length - 1));

        const savedTitleRaw = localStorage.getItem('kft-title-idx');
        const savedTitleExplicit = savedTitleRaw !== null;
        let initialTitleIdx;
        if (savedTitleExplicit) {
            const parsed = parseInt(savedTitleRaw, 10);
            initialTitleIdx = isNaN(parsed)
                ? KANJI_FONTS[initialKanjiIdx].titleIdx
                : Math.max(0, Math.min(parsed, TITLE_FONTS.length - 1));
        } else {
            initialTitleIdx = KANJI_FONTS[initialKanjiIdx].titleIdx;
        }

        applyKanjiFont(KANJI_FONTS[initialKanjiIdx].family);
        applyTitleFont(TITLE_FONTS[initialTitleIdx].family);

        function getKanjiContent(prefaceEl) {
            const cs = window.getComputedStyle(prefaceEl, '::before');
            let content = cs.content || '';
            if (content === 'none' || content === 'normal') return '';
            if ((content.startsWith('"') && content.endsWith('"')) ||
                (content.startsWith("'") && content.endsWith("'"))) {
                content = content.slice(1, -1);
            }
            content = content
                .replace(/\\A\s?/g, '\n')
                .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) =>
                    String.fromCodePoint(parseInt(hex, 16))
                );
            return content;
        }

        function animateKanji(prefaceEl) {
            if (!prefaceEl) return;
            const kanjiText = getKanjiContent(prefaceEl);
            if (!kanjiText.trim()) return;

            const old = prefaceEl.querySelector('.kft-kanji-overlay');
            if (old) old.remove();
            prefaceEl.classList.remove('kft-done');

            const overlay = document.createElement('span');
            overlay.className = 'kft-kanji-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.style.pointerEvents = 'none';

            const inner = document.createElement('span');
            inner.style.display = 'inline-block';
            inner.style.writingMode = 'inherit';
            inner.style.textOrientation = 'inherit';
            inner.style.whiteSpace = 'inherit';

            const chars = Array.from(kanjiText);
            const fragment = document.createDocumentFragment();
            for (const ch of chars) {
                if (ch === '\n') {
                    fragment.appendChild(document.createElement('br'));
                } else if (/\s/.test(ch)) {
                    fragment.appendChild(document.createTextNode(ch));
                } else {
                    const s = document.createElement('span');
                    s.className = 'kft-letter';
                    s.style.display = 'inline-block';
                    s.style.opacity = '0';
                    s.textContent = ch;
                    fragment.appendChild(s);
                }
            }
            inner.appendChild(fragment);
            overlay.appendChild(inner);
            prefaceEl.insertBefore(overlay, prefaceEl.firstChild);
            prefaceEl.classList.add('kft-animating');

            const letters = overlay.querySelectorAll('.kft-letter');
            const perCharDelay = 70;
            const charDuration = 950;
            let lastAnimation = null;

            letters.forEach((el, i) => {
                const anim = el.animate(
                    [
                        { transform: 'scale(4)', opacity: 0 },
                        { transform: 'scale(1)', opacity: 1 },
                    ],
                    {
                        duration: charDuration,
                        delay: perCharDelay * i,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards',
                    }
                );
                if (i === letters.length - 1) lastAnimation = anim;
            });

            const handoff = () => {
                requestAnimationFrame(() => {
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    prefaceEl.classList.remove('kft-animating');
                    prefaceEl.classList.add('kft-done');
                });
            };

            if (lastAnimation) {
                lastAnimation.addEventListener('finish', handoff, { once: true });
            } else {
                handoff();
            }
        }

        function triggerAnimationOnAllPrefaces() {
            const prefaces = document.querySelectorAll('#workskin .chapter .preface.group');
            prefaces.forEach(animateKanji);
        }

        function injectPicker() {
            const navList = document.querySelector('ul.work.navigation.actions');
            if (!navList) return false;
            if (document.getElementById('kanji-font-picker-li')) return true;

            let currentKanjiIdx = initialKanjiIdx;
            let currentTitleIdx = initialTitleIdx;
            let titleIsExplicit = savedTitleExplicit;

            const li = document.createElement('li');
            li.className = 'kanji-font';
            li.id = 'kanji-font-picker-li';
            li.innerHTML = `
                <button class="collapsed kft-button">Fonts</button>
                <ul class="expandable secondary hidden kft-menu">
                    <li class="kft-row">
                        <span class="kft-label">Kanji</span>
                        <select class="kft-select kft-kanji-select">
                            ${KANJI_FONTS.map((f, i) => `<option value="${i}"${i === currentKanjiIdx ? ' selected' : ''}>${f.label}</option>`).join('')}
                        </select>
                    </li>
                    <li class="kft-row">
                        <span class="kft-label">Title <span class="kft-hint">(auto-paired)</span></span>
                        <select class="kft-select kft-title-select">
                            ${TITLE_FONTS.map((f, i) => `<option value="${i}"${i === currentTitleIdx ? ' selected' : ''}>${f.label}</option>`).join('')}
                        </select>
                    </li>
                    <li class="kft-divider"></li>
                    <li class="kft-row kft-actions">
                        <a href="#" class="kft-action kft-reset-pairing">↺ Reset title to suggested pairing</a>
                        <a href="#" class="kft-action kft-replay">▶ Replay kanji animation</a>
                    </li>
                </ul>
            `;

            const bookmarkLi = navList.querySelector('li.bookmark');
            if (bookmarkLi) navList.insertBefore(li, bookmarkLi);
            else navList.appendChild(li);

            if (!document.getElementById('kft-styles')) {
                const styleUI = document.createElement('style');
                styleUI.id = 'kft-styles';
                styleUI.textContent = `
                    #kanji-font-picker-li { position: relative; }
                    #kanji-font-picker-li .kft-menu {
                        min-width: 300px;
                        position: absolute;
                        z-index: 1000;
                        right: auto;
                        left: auto;
                    }
                    .kft-row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 5px 8px;
                    }
                    .kft-actions {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 2px;
                    }
                    .kft-label {
                        font-size: 0.85em;
                        opacity: 0.7;
                        white-space: nowrap;
                        min-width: 36px;
                    }
                    .kft-hint {
                        font-weight: normal;
                        font-size: 0.9em;
                        opacity: 0.7;
                    }
                    .kft-select {
                        flex: 1;
                        font-size: 0.85em;
                        cursor: pointer;
                    }
                    .kft-action {
                        display: block;
                        padding: 2px 0;
                        font-size: 0.85em;
                    }
                    .kft-divider {
                        height: 1px;
                        background: rgba(0,0,0,0.1);
                        margin: 4px 0;
                        pointer-events: none;
                    }
                `;
                document.documentElement.appendChild(styleUI);
            }

            const button = li.querySelector('.kft-button');
            const menu = li.querySelector('.kft-menu');
            const kanjiSelect = li.querySelector('.kft-kanji-select');
            const titleSelect = li.querySelector('.kft-title-select');
            const resetBtn = li.querySelector('.kft-reset-pairing');
            const replayBtn = li.querySelector('.kft-replay');

            button.addEventListener('click', (e) => {
                e.preventDefault();
                const collapsed = button.classList.toggle('collapsed');
                menu.classList.toggle('hidden', collapsed);
            });

            kanjiSelect.addEventListener('change', () => {
                const idx = parseInt(kanjiSelect.value, 10);
                currentKanjiIdx = idx;
                applyKanjiFont(KANJI_FONTS[idx].family);
                localStorage.setItem('kft-last-idx', idx);

                if (!titleIsExplicit) {
                    const newTitleIdx = KANJI_FONTS[idx].titleIdx;
                    currentTitleIdx = newTitleIdx;
                    titleSelect.value = String(newTitleIdx);
                    applyTitleFont(TITLE_FONTS[newTitleIdx].family);
                }

                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => triggerAnimationOnAllPrefaces());
                } else {
                    triggerAnimationOnAllPrefaces();
                }
            });

            titleSelect.addEventListener('change', () => {
                const idx = parseInt(titleSelect.value, 10);
                currentTitleIdx = idx;
                titleIsExplicit = true;
                applyTitleFont(TITLE_FONTS[idx].family);
                localStorage.setItem('kft-title-idx', idx);
            });

            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                titleIsExplicit = false;
                localStorage.removeItem('kft-title-idx');
                const pairedIdx = KANJI_FONTS[currentKanjiIdx].titleIdx;
                currentTitleIdx = pairedIdx;
                titleSelect.value = String(pairedIdx);
                applyTitleFont(TITLE_FONTS[pairedIdx].family);
            });

            replayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                triggerAnimationOnAllPrefaces();
                button.classList.add('collapsed');
                menu.classList.add('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!li.contains(e.target) && !menu.classList.contains('hidden')) {
                    button.classList.add('collapsed');
                    menu.classList.add('hidden');
                }
            });

            return true;
        }

        function tryBoot() {
            const pickerInjected = injectPicker();
            const prefaces = document.querySelectorAll('#workskin .chapter .preface.group');
            if (pickerInjected && prefaces.length > 0) {
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => triggerAnimationOnAllPrefaces());
                } else {
                    triggerAnimationOnAllPrefaces();
                }
                return true;
            }
            return false;
        }

        if (!tryBoot()) {
            const observer = new MutationObserver(() => {
                if (tryBoot()) observer.disconnect();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 10000);
        }
    })();


    // =====================================================================
    // MODULE 3 — AO3 Story Image Display
    // Original @match: /users/stroke6/*, /users/stroke6
    // =====================================================================
    if (isStroke6User()) whenReady(() => (function moduleStoryImageDisplay() {
        const storyData = {
            "Indra": {
                img: "https://a.l3n.co/i/D8fgtM.png",
                url: "https://archiveofourown.org/works/39294225/chapters/98328066"
            },
            "Indra: Extra": {
                img: "https://b.l3n.co/i/D8PicP.png",
                url: "https://archiveofourown.org/works/42794847/chapters/107503575"
            },
            "From the Ring, With Love": {
                img: "https://d.l3n.co/i/D8PWHZ.png",
                url: "https://archiveofourown.org/works/59274742/chapters/151165909"
            },
            "Crimson Horizons": {
                img: "https://a.l3n.co/i/D8P25c.png",
                url: "https://archiveofourown.org/works/52616674/chapters/133092478"
            },
            "In the Quiet Confines of the Hokage's Office": {
                img: "https://d.l3n.co/DiQ2uH.png",
                url: "https://archiveofourown.org/works/50560177"
            }
        };

        function getStoryDataForTitle(title) {
            const normalized = title.trim().toLowerCase();
            const key = Object.keys(storyData)
                .find(k => k.trim().toLowerCase() === normalized);
            return key ? storyData[key] : null;
        }

        function addImagesToListings() {
            document.querySelectorAll(".work.blurb").forEach(blurb => {
                if (blurb.querySelector(".story-custom-image")) return;
                const titleEl  = blurb.querySelector('h4.heading a[href*="/works/"]');
                const authorEl = blurb.querySelector('h4.heading a[rel="author"]');
                if (!titleEl || !authorEl) return;

                const data = getStoryDataForTitle(titleEl.textContent);
                if (authorEl.textContent.trim() === "stroke6" && data) {
                    const tagsEl = blurb.querySelector(".required-tags");
                    if (tagsEl) addImageToListing(tagsEl, data);
                }
            });
        }

        function addImageToWorkPage() {
            const titleEl  = document.querySelector("h2.title.heading");
            const authorEl = document.querySelector("h3.byline a[rel=\"author\"]");
            if (!titleEl || !authorEl) return;
            const data = getStoryDataForTitle(titleEl.textContent);
            if (authorEl.textContent.trim() === "stroke6" && data) {
                const tagsContainer = document.querySelector("dl.work.meta.group dd.tags");
                if (tagsContainer) addImage(tagsContainer, data);
            }
        }

        function addImageToListing(targetElement, data) {
            const link = document.createElement("a");
            link.href = data.url;
            link.className = "story-custom-image-link";
            const img = document.createElement("img");
            img.src = data.img;
            img.className = "story-custom-image";
            img.style.cssText = `
                max-width:100%;
                max-height:200px;
                display:block;
                margin:10px auto;
                border-radius:8px;
                cursor:pointer;
            `;
            img.onerror = () => link.style.display = "none";
            link.appendChild(img);
            targetElement.insertAdjacentElement("beforebegin", link);
        }

        function addImage(targetElement, data) {
            if (document.querySelector(".story-custom-image")) return;
            const link = document.createElement("a");
            link.href = data.url;
            link.className = "story-custom-image-link";
            const img = document.createElement("img");
            img.src = data.img;
            img.className = "story-custom-image";
            img.style.cssText = `
                max-width:100%;
                height:auto;
                display:block;
                margin:20px auto;
                border-radius:8px;
                cursor:pointer;
            `;
            img.onerror = () => link.style.display = "none";
            link.appendChild(img);
            targetElement.insertAdjacentElement("beforebegin", link);
        }

        function addImageToStory() {
            if (document.querySelector("h2.title.heading")) {
                addImageToWorkPage();
            } else {
                addImagesToListings();
            }
        }

        addImageToStory();

        const observer = new MutationObserver(mutations => {
            for (let m of mutations) {
                if (m.type === "childList" && m.addedNodes.length) {
                    setTimeout(addImageToStory, 100);
                    break;
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    })());


    // =====================================================================
    // MODULE 4 — AO3 Add Updated Bookmarks Link
    // Original @match: /users/stroke6*, /users/stroke6, /users/*
    // =====================================================================
    if (isStroke6User()) whenReady(() => (function moduleAddUpdatedBookmarks() {
        setTimeout(function() {
            const allNavs = document.querySelectorAll('#dashboard ul.navigation');
            let targetNav = null;
            allNavs.forEach(nav => {
                const bookmarkLink = nav.querySelector('a[href*="/bookmarks"]');
                if (bookmarkLink && bookmarkLink.textContent.includes('Bookmarks (')) {
                    targetNav = nav;
                }
            });

            if (targetNav) {
                const bookmarksLink = targetNav.querySelector('a[href*="/bookmarks"]');
                if (bookmarksLink) {
                    const newListItem = document.createElement('li');
                    const newLink = document.createElement('a');
                    newLink.href = 'https://archiveofourown.org/bookmarks?commit=Sort+and+Filter&bookmark_search%5Bsort_column%5D=bookmarkable_date&bookmark_search%5Bother_tag_names%5D=&bookmark_search%5Bother_bookmark_tag_names%5D=&bookmark_search%5Bexcluded_tag_names%5D=&bookmark_search%5Bexcluded_bookmark_tag_names%5D=&bookmark_search%5Bbookmarkable_query%5D=&bookmark_search%5Bbookmark_query%5D=&bookmark_search%5Blanguage_id%5D=&bookmark_search%5Brec%5D=0&bookmark_search%5Bwith_notes%5D=0&user_id=stroke6';
                    newLink.textContent = '→ Updated';
                    newListItem.appendChild(newLink);
                    const bookmarksListItem = bookmarksLink.parentNode;
                    bookmarksListItem.parentNode.insertBefore(newListItem, bookmarksListItem.nextSibling);
                }
            }
        }, 1000);
    })());


    // =====================================================================
    // MODULE 5 — AO3 Direct Chapter Index and List Button (Entire Website)
    // Original @match: /*
    // =====================================================================
    if (isAnyAO3Page()) (function moduleChapterIndexButton() {
        function addButtonOnWorkPage() {
            const navContainer = document.querySelector("#main > ul.work.navigation.actions");
            const workIdMatch = window.location.href.match(/works\/(\d+)/);

            if (navContainer && workIdMatch && workIdMatch[1]) {
                const newButtonItem = document.createElement("li");
                const button = document.createElement("a");
                button.innerHTML = "Go to Chapter Index";
                button.classList.add("button");
                button.style.cursor = "pointer";
                button.href = `https://archiveofourown.org/works/${workIdMatch[1]}/navigate`;
                newButtonItem.appendChild(button);
                navContainer.appendChild(newButtonItem);
            }
        }

        function addButtonOnDashboard() {
            const workElements = document.querySelectorAll('[id^="work_"] ul.actions');
            workElements.forEach(function(workElement) {
                const workId = workElement.closest('[id^="work_"]').id.replace('work_', '');
                if (workId) {
                    const smallButton = document.createElement("a");
                    smallButton.innerHTML = "Chapter Index";
                    smallButton.classList.add("button");
                    smallButton.style.cursor = "pointer";
                    smallButton.href = `https://archiveofourown.org/works/${workId}/navigate`;
                    workElement.appendChild(smallButton);
                }
            });
        }

        function addChapterListLinkToWorksOrBookmarks() {
            const bookmarkElements = document.querySelectorAll('[id^="bookmark_"] dl');
            const workElements = document.querySelectorAll('[id^="work_"] dl');

            bookmarkElements.forEach(function(bookmarkElement) {
                const workLinkEl = bookmarkElement.querySelector('a[href*="/works/"]');
                if (!workLinkEl) return;
                const workIdMatch = workLinkEl.href.match(/works\/(\d+)/);
                if (!workIdMatch) return;
                const workId = workIdMatch[1];
                if (workId) {
                    const chapterListElement = document.createElement("dd");
                    const chapterListLink = document.createElement("a");
                    chapterListLink.innerHTML = "Chapter Index";
                    chapterListLink.href = `https://archiveofourown.org/works/${workId}/navigate`;
                    chapterListLink.style.cursor = "pointer";
                    chapterListElement.appendChild(chapterListLink);
                    bookmarkElement.appendChild(chapterListElement);
                }
            });

            workElements.forEach(function(workElement) {
                const workId = workElement.closest('[id^="work_"]').id.replace('work_', '');
                if (workId) {
                    const chapterListElement = document.createElement("dd");
                    const chapterListLink = document.createElement("a");
                    chapterListLink.innerHTML = "Chapter Index";
                    chapterListLink.href = `https://archiveofourown.org/works/${workId}/navigate`;
                    chapterListLink.style.cursor = "pointer";
                    chapterListElement.appendChild(chapterListLink);
                    workElement.appendChild(chapterListElement);
                }
            });
        }

        function handlePage() {
            const currentURL = window.location.href;
            if (currentURL.includes("/works/")) {
                addButtonOnWorkPage();
                addChapterListLinkToWorksOrBookmarks();
            } else if (currentURL.includes("/collections/")) {
                addButtonOnWorkPage();
                addButtonOnDashboard();
                addChapterListLinkToWorksOrBookmarks();
            } else if (currentURL.includes("/users/")) {
                addButtonOnDashboard();
                addChapterListLinkToWorksOrBookmarks();
            } else if (currentURL.includes("/bookmarks/")) {
                addChapterListLinkToWorksOrBookmarks();
            } else {
                addChapterListLinkToWorksOrBookmarks();
            }
        }

        window.addEventListener('load', handlePage);
    })();


    // =====================================================================
    // MODULE 6 — AO3 Indent Paragraphs Button
    // Original @match: /works/*
    // =====================================================================
    if (isAO3WorkPage()) whenReady(() => (function moduleIndentParagraphs() {
        const navBar = document.querySelector('ul.work.navigation.actions');
        if (!navBar) return;

        const buttonLi = document.createElement('li');
        buttonLi.className = 'share';

        const indentButton = document.createElement('a');
        indentButton.href = '#';
        indentButton.textContent = 'Indent Paragraphs';
        indentButton.style.cursor = 'pointer';
        buttonLi.appendChild(indentButton);

        const shareButton = navBar.querySelector('li.share');
        if (shareButton) navBar.insertBefore(buttonLi, shareButton);
        else navBar.appendChild(buttonLi);

        let indented = false;
        const INDENT = '1.5em';

        indentButton.addEventListener('click', function(e) {
            e.preventDefault();
            const chapterContent = document.querySelector('div#chapters');
            if (!chapterContent) return;
            const paragraphs = chapterContent.querySelectorAll('p');

            paragraphs.forEach(p => {
                if (p.querySelector('.red, .strongred')) return;
                const computed = window.getComputedStyle(p);
                const align = computed.textAlign;
                const inlineAlign = p.style.textAlign;
                const isNeutralOrLeft =
                    align === 'left' ||
                    align === 'start' ||
                    (align === '' && inlineAlign === '') ||
                    (!inlineAlign && align !== 'center' && align !== 'right' && align !== 'justify');
                if (!isNeutralOrLeft) return;

                if (!indented) {
                    p.dataset.originalIndent = p.style.textIndent || '';
                    p.style.textIndent = INDENT;
                } else {
                    p.style.textIndent = p.dataset.originalIndent || '';
                    delete p.dataset.originalIndent;
                }
            });

            indented = !indented;
            indentButton.textContent = indented ? 'Remove Indent' : 'Indent Paragraphs';
        });
    })());



    // =====================================================================
    // MODULE 9 — FanFiction.net Enhanced Reader
    // Original @match: specific FFN story IDs (see header)
    // =====================================================================
    if (isTargetedFFNStory()) whenReady(() => (function moduleFFNEnhancedReader() {
        const overlayCSS = `
            .ffn-image-overlay {
                position: fixed; inset: 0;
                background-color: rgba(0,0,0,.8);
                display: flex; justify-content: center; align-items: center;
                z-index: 10000; cursor: pointer;
            }
            .ffn-image-overlay img {
                max-width: 90%; max-height: 90%;
                border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,.5);
            }
            .ffn-image-btn {
                background-color: rgba(117,7,5,.2);
                color: inherit; border: none; padding: .25em; margin: 0 4px;
                border-radius: 4px; border-bottom: 1px solid #891111;
                cursor: pointer; font-size: inherit; text-decoration: none;
                display: inline-block; transition: .2s; position: relative;
            }
            .ffn-image-btn:hover { color:#111; border-bottom:1px solid; box-shadow: 2px 2px 0 #891111; }
            .ffn-image-btn:active { color:#111; background:#ccc; border-color:#fff; box-shadow: inset 1px 1px 3px #333; transform: translateY(4px); }
            .ffn-image-btn::before { content: url('https://c.l3n.co/i/vJpYDq.png'); transform: scale(.05); display:inline-block; width:1em; height:1em; vertical-align:top; margin-right:.5em; position:relative; top:-.1em; }
            .ffn-image-btn::after { content:" ↓"; }
            .ffn-image-title {
                font-size: 140%; font-weight: bold; font-family: PT Serif, Georgia; color: #750705;
                position:absolute; top:20px; left:50%; transform: translateX(-50%);
                z-index:10001; text-align:center; background: rgba(255,255,255,.9);
                padding:10px 20px; border-radius:8px;
            }
            .ffn-image-loading { color:#ddd; font-style: italic; font-family: PT Serif, Georgia; background: rgba(0,0,0,.4); padding:8px 12px; border-radius:6px; }
            .strongred {
                font-size:140% !important;
                font-weight:bold !important;
                font-family: "Noto Serif", PT Serif, Georgia !important;
                color:#750705 !important;
                display: inline-block !important;
                position: relative !important;
                padding: 0.5em 0 !important;
            }
            .strongred::before, .strongred::after {
                content: '';
                position: absolute;
                left: 12.5%;
                width: 75%;
                height: 1px;
                background-color: #750705;
            }
            .strongred::before { top: 0; }
            .strongred::after  { bottom: 0; }
            p .red .strongred { font-size:3em !important; line-height:1 !important; font-weight:bold !important; }
            .ffn-kanji-styled { font-size:3em !important; line-height:1 !important; font-weight:bold !important; font-family: "Yuji Syuku", PT Serif, Georgia !important; color:#750705 !important; }
            .ffn-dropcap {
                font-size: 3em;
                line-height: 1;
                font-family: 'PT Serif', Georgia, serif;
                color: #750705;
            }
        `;
        const style = document.createElement('style');
        style.textContent = overlayCSS;
        document.head.appendChild(style);

        // Load Google Fonts for chapter title (Noto Serif) and centered kanji (Yuji Syuku)
        const ffnFontLink = document.createElement('link');
        ffnFontLink.rel = 'stylesheet';
        ffnFontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Yuji+Syuku&display=swap';
        document.head.appendChild(ffnFontLink);

        const PLACEHOLDER_SIZES = new Set(['400x200','200x400']);
        const MIN_AREA_OK = 350 * 350;

        function looksLikePlaceholder(w, h) {
            const tag = `${w}x${h}`;
            if (PLACEHOLDER_SIZES.has(tag)) return true;
            if ((w * h) < MIN_AREA_OK) return true;
            const ar = w > h ? (w / h) : (h / w);
            if (ar >= 1.95 && ar <= 2.05 && (w * h) < (500 * 500)) return true;
            return false;
        }

        function tryImageUrls(code) {
            const subs = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const exts = ['png','jpg','jpeg','webp','gif'];
            const candidates = [];
            for (const s of subs) {
                for (const ext of exts) {
                    candidates.push(`https://${s}.l3n.co/i/${code}.${ext}`);
                }
            }
            candidates.push(`https://c.l3n.co/i/${code}`);

            const loadAsPromise = (url, timeoutMs = 8000) => new Promise((resolve, reject) => {
                const img = new Image();
                let timedOut = false;
                const timer = setTimeout(() => { timedOut = true; try { img.src = ''; } catch(_){}; reject(new Error('timeout')); }, timeoutMs);
                img.onload = () => {
                    if (!timedOut) {
                        clearTimeout(timer);
                        const w = img.naturalWidth || 0;
                        const h = img.naturalHeight || 0;
                        if (w > 0 && h > 0 && !looksLikePlaceholder(w, h)) {
                            resolve(url);
                        } else {
                            reject(new Error('placeholder-or-tiny'));
                        }
                    }
                };
                img.onerror = () => { clearTimeout(timer); reject(new Error('error')); };
                const sep = url.includes('?') ? '&' : '?';
                img.src = url + sep + '_=' + Date.now();
            });

            const batchSize = 8;
            let offset = 0;
            return new Promise(async (resolve) => {
                while (offset < candidates.length) {
                    const batch = candidates.slice(offset, offset + batchSize);
                    try {
                        const winner = await Promise.any(batch.map(u => loadAsPromise(u)));
                        return resolve(winner);
                    } catch {
                        offset += batchSize;
                    }
                }
                resolve(null);
            });
        }

        function createImageOverlay(imageCode) {
            const overlay = document.createElement('div');
            overlay.className = 'ffn-image-overlay';
            const loadingText = document.createElement('div');
            loadingText.textContent = 'Finding image...';
            loadingText.className = 'ffn-image-loading';
            overlay.appendChild(loadingText);
            overlay.addEventListener('click', () => document.body.removeChild(overlay));
            document.body.appendChild(overlay);

            let done = false;
            tryImageUrls(imageCode).then((workingUrl) => {
                if (!workingUrl) {
                    if (!done) overlay.innerHTML = '<div style="color:#fff;text-align:center;">Image not found on any server</div>';
                    return;
                }
                if (done) return;

                const img = document.createElement('img');
                img.alt = 'Chapter Image';
                img.onload = () => {
                    if (done) return;
                    done = true;
                    overlay.innerHTML = '';
                    const title = document.createElement('div');
                    title.className = 'ffn-image-title';
                    title.textContent = 'Linked Picture';
                    overlay.appendChild(title);
                    overlay.appendChild(img);
                };
                img.onerror = () => {
                    if (!done) overlay.innerHTML = '<div style="color:#fff;text-align:center;">Failed to load image</div>';
                };
                const sep = workingUrl.includes('?') ? '&' : '?';
                img.src = workingUrl + sep + '_=' + Date.now();
            });
        }

        function enableTextSelection() {
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                * { -webkit-user-select:text !important; -moz-user-select:text !important; -ms-user-select:text !important; user-select:text !important; }
            `;
            document.head.appendChild(styleEl);
            const existingStyles = document.querySelectorAll('style');
            existingStyles.forEach(s => {
                if (s.textContent.includes('user-select: none')) {
                    s.textContent = s.textContent.replace(/user-select:\s*none/g, 'user-select: text');
                }
            });
        }

        function isJapanese(char) {
            const code = char.charCodeAt(0);
            return (code >= 0x3040 && code <= 0x309F) ||
                   (code >= 0x30A0 && code <= 0x30FF) ||
                   (code >= 0x4E00 && code <= 0x9FAF) ||
                   (code >= 0x3400 && code <= 0x4DBF);
        }

        function isSpecificFanfiction() {
            return location.href.includes('fanfiction.net/s/14396658/') ||
                   location.href.includes('m.fanfiction.net/s/14396658/');
        }
        function isYCodeTitle(text) { return /^Y\d+[AB]C:/.test(text.trim()); }
        function isAllUppercase(text) {
            const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
            return lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
        }
        function isBetweenHrTags(el) {
            let p = el.previousElementSibling, n = el.nextElementSibling, before=false, after=false;
            while (p) { if (p.tagName === 'HR') { before = true; break; } if (p.textContent.trim().length > 0) break; p = p.previousElementSibling; }
            while (n) { if (n.tagName === 'HR') { after = true; break; } if (n.textContent.trim().length > 0) break; n = n.nextElementSibling; }
            return before && after;
        }

        function styleChapterElements() {
            const centeredParagraphs = document.querySelectorAll('p[style*="text-align:center"], p[style*="text-align: center"], .center, .text-center');

            centeredParagraphs.forEach(p => {
                const textContent = p.textContent.trim();
                const between = isBetweenHrTags(p);
                const strongEls = p.querySelectorAll('strong');

                strongEls.forEach(str => {
                    const t = str.textContent.trim();
                    if (str.classList.contains('strongred')) return;
                    if (isSpecificFanfiction() && isYCodeTitle(t)) { str.classList.add('strongred'); return; }
                    if ((t.match(/^\d+\s*[—–-]\s*.+/) && isAllUppercase(t.replace(/^\d+\s*[—–-]\s*/, ''))) || isAllUppercase(t)) {
                        str.classList.add('strongred');
                    }
                });

                if (strongEls.length === 0) {
                    if (p.querySelector('.strongred')) return;
                    if (isSpecificFanfiction() && isYCodeTitle(textContent)) {
                        const span = document.createElement('span'); span.className = 'strongred'; span.innerHTML = p.innerHTML; p.innerHTML = ''; p.appendChild(span);
                    } else if (isAllUppercase(textContent) && textContent.length > 2) {
                        const span = document.createElement('span'); span.className = 'strongred'; span.innerHTML = p.innerHTML; p.innerHTML = ''; p.appendChild(span);
                    } else if (between && isAllUppercase(textContent) && textContent.length > 2) {
                        const span = document.createElement('span'); span.className = 'strongred'; span.innerHTML = p.innerHTML; p.innerHTML = ''; p.appendChild(span);
                    }
                }
            });

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            const nodes = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE' || node.parentNode.classList.contains('ffn-image-btn')) continue;
                nodes.push(node);
            }
            nodes.forEach(tn => {
                const txt = tn.textContent;
                if (tn.parentNode.classList.contains('ffn-kanji-styled') || tn.parentNode.classList.contains('strongred') || tn.parentNode.classList.contains('ffn-image-btn')) return;
                let hasJP = false;
                for (let ch of txt) { if (isJapanese(ch)) { hasJP = true; break; } }
                if (!hasJP) return;

                let p = tn.parentNode;
                while (p && p !== document.body) {
                    if (p.tagName === 'P' && (p.style.textAlign === 'center' || p.getAttribute('style')?.includes('text-align:center') || p.getAttribute('style')?.includes('text-align: center') || p.classList.contains('center') || p.classList.contains('text-center'))) {
                        const span = document.createElement('span'); span.className = 'ffn-kanji-styled'; span.textContent = txt; tn.parentNode.replaceChild(span, tn);
                        animateKanjiAppear(span);
                        break;
                    }
                    p = p.parentNode;
                }
            });
        }

        // Per-character reveal
        function animateKanjiAppear(spanEl) {
            const text = spanEl.textContent;
            spanEl.textContent = '';

            const letters = [];
            for (const ch of Array.from(text)) {
                if (/\s/.test(ch)) {
                    spanEl.appendChild(document.createTextNode(ch));
                } else {
                    const s = document.createElement('span');
                    s.style.display = 'inline-block';
                    s.style.opacity = '0';
                    s.textContent = ch;
                    spanEl.appendChild(s);
                    letters.push(s);
                }
            }

            const perCharDelay = 70;
            const charDuration = 950;

            letters.forEach((el, i) => {
                el.animate(
                    [
                        { transform: 'scale(4)', opacity: 0 },
                        { transform: 'scale(1)', opacity: 1 },
                    ],
                    {
                        duration: charDuration,
                        delay: perCharDelay * i,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards',
                    }
                );
            });
        }

        function processImageCodes() {
            const chapterContent = document.querySelector('#storytext, .storytext, .userstuff, #content, .chapter-content, div[style*="font-family"], .mobile-chapter, .chapter-text');
            if (!chapterContent) {
                const bodyDivs = document.querySelectorAll('body div');
                bodyDivs.forEach(div => {
                    if ((div.textContent.includes('i/') || div.textContent.includes('i /')) && div.textContent.length > 100) {
                        processTextInElement(div);
                    }
                });
                return;
            }
            processTextInElement(chapterContent);
        }

        function processTextInElement(element) {
            const imageRegex = /(?:^|\s)(i\s*\/\s*([A-Za-z0-9]+))/g;
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) textNodes.push(node);

            textNodes.forEach(textNode => {
                const text = textNode.textContent;
                let m; const matches = [];
                imageRegex.lastIndex = 0;
                while ((m = imageRegex.exec(text)) !== null) {
                    matches.push({ fullMatch: m[1], code: m[2], index: m.index + (m[0].length - m[1].length) });
                }
                if (!matches.length) return;

                const parent = textNode.parentNode;
                const frag = document.createDocumentFragment();
                let last = 0;
                matches.forEach(mm => {
                    if (mm.index > last) frag.appendChild(document.createTextNode(text.slice(last, mm.index)));
                    const btn = document.createElement('button');
                    btn.className = 'ffn-image-btn';
                    btn.textContent = mm.code;
                    btn.title = `Click to view image: ${mm.code}`;
                    btn.addEventListener('click', ev => { ev.preventDefault(); createImageOverlay(mm.code); });
                    frag.appendChild(btn);
                    last = mm.index + mm.fullMatch.length;
                });
                if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
                parent.replaceChild(frag, textNode);
            });
        }

        // ---- Drop-cap + per-character red-color animation on <strong> tags ----
        
        function applyChapterStyling() {
            const chapterContent = document.querySelector('#storytext, .storytext, .userstuff, #content, .chapter-content, .mobile-chapter, .chapter-text');
            if (!chapterContent) return;
            const firstTitle = chapterContent.querySelector('.strongred');
            if (!firstTitle) return;
            applyDropCap(chapterContent, firstTitle);
            animateStrongsAfterTitle(chapterContent, firstTitle);
        }

        function applyDropCap(root, title) {
            if (root.querySelector('.ffn-dropcap')) return;

            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            let pastTitle = false;
            let node;
            while ((node = walker.nextNode())) {
                if (!pastTitle) {
                    const cmp = title.compareDocumentPosition(node);
                    if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) pastTitle = true;
                    else continue;
                }
                if (title.contains(node)) continue;

                const text = node.textContent;
                const idx = text.search(/\p{L}/u);
                if (idx === -1) continue;

                const before = text.slice(0, idx);
                const ch = text[idx];
                const after = text.slice(idx + 1);

                const dropCap = document.createElement('span');
                dropCap.className = 'ffn-dropcap';
                dropCap.textContent = ch;

                const parent = node.parentNode;
                if (before) parent.insertBefore(document.createTextNode(before), node);
                parent.insertBefore(dropCap, node);
                if (after) parent.insertBefore(document.createTextNode(after), node);
                parent.removeChild(node);
                return;
            }
        }

        function animateStrongsAfterTitle(root, title) {
            // Stop scanning once we hit author's-note marker or an image link.
            const stopPattern = /\bAN\s*:|A\s*\/\s*N\s*:|A\.\s*N\./i;
            // Skip individual strongs that mention these — keep them black —
            // but continue scanning past them.
            const skipPattern = /lensdump/i;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
            let pastTitle = false;
            const toAnimate = [];
            let node;
            while ((node = walker.nextNode())) {
                if (!pastTitle) {
                    const cmp = title.compareDocumentPosition(node);
                    if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) pastTitle = true;
                    else continue;
                }
                if (title.contains(node)) continue;

                if (node.nodeType === Node.TEXT_NODE) {
                    if (stopPattern.test(node.textContent)) break;
                    continue;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && node.classList.contains('ffn-image-btn')) break;
                    if (node.tagName === 'STRONG') {
                        const txt = node.textContent;
                        if (stopPattern.test(txt)) break;      // strong is the AN: marker → stop
                        if (skipPattern.test(txt)) continue;   // "lensdump" → leave black, keep scanning
                        if (node.classList.contains('strongred')) continue;
                        if (node.classList.contains('ffn-strong-animated')) continue;
                        toAnimate.push(node);
                    }
                }
            }
            toAnimate.forEach(animateStrongColor);
        }

        function animateStrongColor(strong) {
            if (strong.classList.contains('ffn-strong-animated')) return;
            strong.classList.add('ffn-strong-animated');

            const endColor = 'rgb(117, 7, 5)';
            const letters = [];

            // Wrap each visible character in a span tagged with its parent's
            // current colour, so the drop cap (already red) animates red→red
            // (no visible change) while surrounding strong text animates from
            // its computed colour (typically black) → red.
            function processNode(n) {
                if (n.nodeType === Node.TEXT_NODE) {
                    const parentColor = window.getComputedStyle(n.parentElement).color;
                    const frag = document.createDocumentFragment();
                    for (const ch of n.textContent) {
                        if (/\s/.test(ch)) {
                            frag.appendChild(document.createTextNode(ch));
                        } else {
                            const s = document.createElement('span');
                            s.textContent = ch;
                            s.style.color = parentColor;
                            s.dataset.startColor = parentColor;
                            frag.appendChild(s);
                            letters.push(s);
                        }
                    }
                    n.parentNode.replaceChild(frag, n);
                } else if (n.nodeType === Node.ELEMENT_NODE) {
                    Array.from(n.childNodes).forEach(processNode);
                }
            }
            Array.from(strong.childNodes).forEach(processNode);

            const perCharDelay = 40;
            const charDuration = 700;
            letters.forEach((el, i) => {
                el.animate(
                    [{ color: el.dataset.startColor }, { color: endColor }],
                    {
                        duration: charDuration,
                        delay: perCharDelay * i,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards',
                    }
                );
            });
        }

        function runAllEnhancements() {
            enableTextSelection();
            styleChapterElements();
            processImageCodes();
            applyChapterStyling();
        }

        runAllEnhancements();

        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) { lastUrl = url; setTimeout(runAllEnhancements, 500); }
        }).observe(document, { subtree:true, childList:true });

        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') runAllEnhancements();
        });
    })());

})();
