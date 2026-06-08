// ==UserScript==
// @name         stroke6's AO3 + FFN All-In-One Combined — Reader Version
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Combined bundle of 10 user scripts for my own use, and 7 for you: AO3 enhancements + FanFiction.net Enhanced Reader
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
// @updateURL    https://stroke-6.github.io/AO3/stroke6%27s%20AO3%20%2B%20FFN%20All-In-One%20Combined%20%E2%80%94%20Reader%20Version.user.js
// @downloadURL  https://stroke-6.github.io/AO3/stroke6%27s%20AO3%20%2B%20FFN%20All-In-One%20Combined%20%E2%80%94%20Reader%20Version.user.js

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
 *  10. FanFiction.net Kanji Title (Indra + Indra: Extra)
 *  11. FanFiction.net Illustrations (Crimson Horizons/FTRWL)
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
    const isFFNKanjiTitleStory = () => onUrl(/^https?:\/\/(www\.|m\.)?fanfiction\.net\/s\/(14095149|14163903)\//);
    const isFFNIllustrationStory = () => onUrl(/^https?:\/\/(www\.|m\.)?fanfiction\.net\/s\/(14312002|14396658)\//);


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
    // Original @match: /users/stroke6*, /users/stroke6
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
            .ffn-leadin {
                color: #750705;
                text-transform: uppercase;
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
        // Indra (14095149) and Indra: Extra (14163903) opt out of the red
        // strong-tag colouring and the kanji / strong reveal animations —
        // the visual styling is not meant for these two works.
        function isStyleExemptStory() {
            return location.href.includes('fanfiction.net/s/14095149/') ||
                   location.href.includes('fanfiction.net/s/14163903/');
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

            // True if the text node sits inside italic markup — e.g. an
            // italicised location line we do NOT want the drop cap on.
            function isItalic(node) {
                let el = node.parentElement;
                while (el) {
                    if (el.tagName === 'EM' || el.tagName === 'I') return true;
                    const fs = window.getComputedStyle(el).fontStyle;
                    if (fs && fs.indexOf('italic') !== -1) return true;
                    if (el === root) break;
                    el = el.parentElement;
                }
                return false;
            }

            // Index in `after` (the text following the drop-cap letter) at which
            // the first `wordsWanted` words of the paragraph end. The drop-cap
            // letter itself counts as the first word.
            function leadInSplit(after, wordsWanted) {
                const isSpace = c => /\s/.test(c);
                const n = after.length;
                let i = 0;
                while (i < n && !isSpace(after[i])) i++; // finish word 1
                let words = 1;
                while (words < wordsWanted && i < n) {
                    while (i < n && isSpace(after[i])) i++;
                    let started = false;
                    while (i < n && !isSpace(after[i])) { i++; started = true; }
                    if (!started) break;
                    words++;
                }
                return i;
            }

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

                // Skip italicised text (e.g. a location line); the drop cap
                // belongs on the first plain, upright paragraph text.
                if (isItalic(node)) continue;

                const before = text.slice(0, idx);
                const ch = text[idx];
                const after = text.slice(idx + 1);

                const dropCap = document.createElement('span');
                dropCap.className = 'ffn-dropcap';
                dropCap.textContent = ch;

                // First few words after the drop cap: same colour, uppercase.
                const splitAt = leadInSplit(after, 4);
                const leadInText = after.slice(0, splitAt);
                const restText = after.slice(splitAt);

                const parent = node.parentNode;
                if (before) parent.insertBefore(document.createTextNode(before), node);
                parent.insertBefore(dropCap, node);
                if (leadInText) {
                    const leadIn = document.createElement('span');
                    leadIn.className = 'ffn-leadin';
                    leadIn.textContent = leadInText;
                    parent.insertBefore(leadIn, node);
                }
                if (restText) parent.insertBefore(document.createTextNode(restText), node);
                parent.removeChild(node);

                // Make sure the paragraph carrying the drop cap reads left-aligned.
                const block = dropCap.closest('p, div, li, blockquote');
                if (block) block.style.textAlign = 'left';
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
            // styleChapterElements (strong-tag colouring + kanji animation) and
            // applyChapterStyling (drop cap + strong colour animation) are skipped
            // for the style-exempt stories. Image-code buttons stay enabled.
            if (!isStyleExemptStory()) styleChapterElements();
            processImageCodes();
            if (!isStyleExemptStory()) applyChapterStyling();
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


    // =====================================================================
    // MODULE 10 — FanFiction.net Kanji Title
    // Original @match: FFN stories 14095149 (Indra), 14163903 (Indra: Extra)
    // =====================================================================
    if (isFFNKanjiTitleStory()) whenReady(() => (function moduleFFNKanjiTitle() {
        const CHAPTERS_14095149 = [
            { t: "Anatomy of a Disaster", k: "災厄解剖" },
            { t: "Sarutobi Naruto", k: "猿飛ナルト" },
            { t: "Burning of the Midnight Flame", k: "焼夜灯" },
            { t: "Training for the Job", k: "修行ノ業" },
            { t: "Training for the Job II", k: "修行ノ業・弐" },
            { t: "Monsoon", k: "雨季" },
            { t: "Her Last Stand", k: "最後ノ抗イ" },
            { t: "Life after Death", k: "死後生" },
            { t: "Hatake Kakashi's Cruel Tutelage", k: "畑鹿驚ノ酷導" },
            { t: "Into the Forest...!", k: "森ヘ…!" },
            { t: "Team Eight", k: "第八班" },
            { t: "The Boy from Suna...!", k: "砂ノ少年…!" },
            { t: "Pest Control", k: "害虫駆除" },
            { t: "Interlude", k: "幕間" },
            { t: "Leaves, Dancing", k: "葉舞" },
            { t: "Spellbound", k: "呪縛" },
            { t: "Their Eyes", k: "彼ラノ瞳" },
            { t: "Chuunin Exams Conclude", k: "中忍試験終幕" },
            { t: "The Forlorn Oasis", k: "寂寞ノ緑洲" },
            { t: "Kaleidoscope", k: "万華鏡" },
            { t: "The Boy who Leapt Through Space and Time", k: "時空跳ビ少年" },
            { t: "No Place To Call Home", k: "帰ル処無シ" },
            { t: "Snake's Bargain", k: "蛇ノ取引" },
            { t: "Under the Moon's Glare", k: "月光ノ下" },
            { t: "Of Ancient Gods", k: "古キ神々" },
            { t: "The Blade Itself", k: "刃ソノモノ" },
            { t: "The Songbird", k: "鳴鳥" },
            { t: "Ghost Hand", k: "幽手" },
            { t: "The Elder Son", k: "長子" },
            { t: "The Snake Sage", k: "蛇仙人" },
            { t: "The Thunder Gates", k: "雷門" },
            { t: "Long Way North", k: "北ヘノ長路" },
            { t: "Sea Change", k: "潮変" },
            { t: "Close Quarters", k: "接近戦" },
            { t: "The Place Under the Sun", k: "日向ノ地" },
            { t: "The Village Hidden in the Sea", k: "海隠レノ里" },
            { t: "The Relay", k: "継走" },
            { t: "Lucky Seven", k: "幸運ノ七" },
            { t: "Realizations", k: "悟リ" },
            { t: "The Village Hidden in the Leaf", k: "木ノ葉隠レノ里" },
            { t: "A Conversation With an Old Friend", k: "旧友トノ会話" },
            { t: "A Really Good Friend", k: "真ノ友" },
            { t: "The Divide", k: "隔タリ" },
            { t: "The Gray Zone", k: "灰色地帯" },
            { t: "To Kill a Shadow", k: "影殺シ" },
            { t: "The Underbelly", k: "暗部" },
            { t: "The Spider's Nest", k: "蜘蛛ノ巣" },
            { t: "Jailbreak", k: "脱獄" },
            { t: "The Latest Missing Ninja", k: "最新ノ抜ケ忍" },
            { t: "Remnants of the Bloody Mist", k: "血霧ノ残党" },
            { t: "Slaves", k: "奴隷" },
            { t: "No Way Back", k: "帰路無シ" },
            { t: "Far From Her Home", k: "故郷ヲ遠ク離レテ" },
            { t: "The Calm Before the Storm", k: "嵐ノ前ノ静寂" },
            { t: "Long Live Konoha", k: "木ノ葉万歳" },
            { t: "Down the Rift", k: "裂ケ目ヘ" },
            { t: "The Living Flame", k: "生キル炎" },
            { t: "Tales From the Front", k: "戦場便リ" },
            { t: "River Escape Plan", k: "河逃走計画" },
            { t: "The Frozen Land", k: "凍土" },
            { t: "Winter Springs", k: "冬泉" },
            { t: "Midnight Cat Eyes", k: "真夜中ノ猫眼" },
            { t: "Jinchuuriki", k: "人柱力" },
            { t: "Snowstorm", k: "吹雪" },
            { t: "Snowstorm II", k: "吹雪・弐" },
            { t: "Snowstorm III", k: "吹雪・参" },
            { t: "Snowstorm IV", k: "吹雪・四" },
            { t: "Beneath the Clouds", k: "雲ノ下" },
            { t: "Above the Clouds", k: "雲ノ上" },
            { t: "That Look", k: "アノ眼差シ" },
            { t: "Two of These Days", k: "アノ二日" },
            { t: "Firepit", k: "焚火" },
            { t: "Dawnbreaker", k: "暁砕キ" },
            { t: "Morningstar", k: "明星" },
            { t: "Twisted Horizon", k: "歪ンダ地平" },
            { t: "His Lives and Times", k: "彼ノ生涯" },
            { t: "Purple Noon", k: "紫ノ正午" },
            { t: "Leaves, Falling", k: "葉落" },
            { t: "Snake's Disciples", k: "蛇ノ弟子" },
            { t: "Changes", k: "変化" },
            { t: "Bonds", k: "絆" },
            { t: "Baptism by Fire", k: "炎ノ洗礼" },
            { t: "Unveilings", k: "露見" },
            { t: "Moonlighter", k: "月夜稼ギ" },
            { t: "Liminal Space", k: "境界" },
            { t: "Bad Omens", k: "凶兆" },
            { t: "Cascades", k: "滝雪崩" },
            { t: "The Great Fire", k: "大火" },
            { t: "Crucible", k: "坩堝" },
            { t: "Flight of Fancy", k: "気紛レノ飛翔" },
            { t: "Paper Idols", k: "紙ノ偶像" },
            { t: "Just This Once", k: "今度限リ" },
            { t: "An Island Unto Himself", k: "孤島ノ男" },
            { t: "Bonds II", k: "絆・弐" },
            { t: "The Unfortunate Consequences of Letting Others Handle Your Reputation", k: "他人任セノ評判" },
            { t: "Best Intentions", k: "最善ノ意図" },
            { t: "Lay Your Hearts", k: "心ヲ捧ゲヨ" },
            { t: "Training for the Job III", k: "修行ノ業・参" },
            { t: "A Terrible Mistake", k: "痛恨ノ過チ" },
            { t: "Leaves, Crumbling", k: "葉枯" },
            { t: "Anatomy of a Disaster II", k: "災厄解剖・弐" },
            { t: "Ashes/The Gathering Storm", k: "灰燼/嵐ノ予兆" },
            { t: "Ashes/Chasing the Wind", k: "灰燼/風ヲ追ウ者" },
            { t: "Ashes/An Ideal", k: "灰燼/一ツノ理想" },
            { t: "Fire, Wind, Lightning", k: "火・風・雷" },
            { t: "The Shadow of Konoha", k: "木ノ葉ノ影" },
            { t: "Night of the Long Knives", k: "長刀ノ夜" },
            { t: "The Furthest Place From Understanding", k: "理解ヨリ最モ遠キ所" },
            { t: "Faded Lightning", k: "褪セタ雷光" },
            { t: "To Kill a Shadow II", k: "影殺シ・弐" },
            { t: "Everything but the Rain", k: "雨以外全テ" },
            { t: "The Tale of the Four Ninja", k: "四忍ノ譚" },
            { t: "The Ever-Moving Dawn", k: "不断ノ曙" },
            { t: "Of Ghosts and Sharks", k: "幽霊ト鮫" },
            { t: "Family Matters", k: "家族ノ事" },
            { t: "The World's Problem", k: "世界ノ問題" },
            { t: "A Cold Alliance", k: "冷タキ同盟" },
            { t: "The Shape of Water", k: "水ノ形" },
            { t: "A Bargain", k: "取引" },
            { t: "Moon Under Water", k: "水面ノ月" },
            { t: "Thirty Days", k: "三十日" },
            { t: "Rending Thunder", k: "裂雷" },
            { t: "Knife in the Dark", k: "闇ノ刃" },
            { t: "Spellbound II", k: "呪縛・弐" },
            { t: "Mind/A Stronger Man", k: "心/強キ者" },
            { t: "Body/Indra", k: "体/インドラ" },
            { t: "Soul/Uzumaki Naruto", k: "魂/うずまきナルト" },
            { t: "Out of the Shadows", k: "影ヨリ出デテ" },
            { t: "Through the Shadows", k: "影ヲ抜ケテ" },
            { t: "Above the Shadows", k: "影ノ上ヘ" },
            { t: "A Lesser Godly Feat", k: "小神業" },
            { t: "Training for the Job IV", k: "修行ノ業・四" },
            { t: "A Fiery Truce", k: "火炎ノ休戦" },
            { t: "Spellbound III", k: "呪縛・参" },
            { t: "The Realm Outside of Time", k: "時ノ外ノ世界" },
            { t: "Flight/Nine Swords", k: "飛翔/九刀" },
            { t: "Moonlit Nights", k: "月夜" },
            { t: "Fire, Smoke, Water", k: "火・煙・水" },
            { t: "Castle in the Sky", k: "天空ノ城" },
            { t: "Caged Tiger", k: "檻ノ虎" },
            { t: "Puppets on Chains", k: "鎖ノ傀儡" },
            { t: "Tangled", k: "縺レ" },
            { t: "Heirs to the Sharingan", k: "写輪眼ノ継嗣" },
            { t: "The Cost of Peace", k: "平和ノ代価" },
            { t: "Soul Harvest", k: "魂狩リ" },
            { t: "An Explosion in the Sky", k: "空ノ爆発" },
            { t: "Storm Chasers", k: "嵐追ウ者" },
            { t: "Bonds III", k: "絆・参" },
            { t: "Uzumaki", k: "うずまき" },
            { t: "Those Who Remain", k: "残ル者" },
            { t: "Phantom Pains/The Pyre", k: "幻肢痛/火葬" },
            { t: "Phantom Pains/Time", k: "幻肢痛/時" },
            { t: "Phantom Pains/The Tenth", k: "幻肢痛/第十" },
            { t: "Morning and Noon of Existence", k: "生ノ朝ト昼" },
            { t: "Uzumaki II", k: "うずまき・弐" },
            { t: "Bonds IV", k: "絆・四" },
            { t: "A Journey's End", k: "旅路ノ果テ" },
            { t: "Shōgun", k: "将軍" },
            { t: "The Ever-Changing World", k: "移リ行ク世" },
            { t: "The Wind's Call", k: "風ノ呼ビ声" },
        ];

        const CHAPTERS_14163903 = [
            { t: "Through the Ninja Glass Darkly", k: "忍ノ闇鏡越シ" },
            { t: "Through the Mirror's Cracks", k: "鏡ノ罅越シ" },
            { t: "Through a Decent Night", k: "マシナ夜越シ" },
            { t: "Domestic Scenes", k: "家庭ノ情景" },
            { t: "Hold Your Hand Out", k: "手ヲ差シ伸ベヨ" },
            { t: "\"We're All Worried About -\"", k: "「皆案ジテイル―」" },
            { t: "Helping Hands", k: "助ケノ手" },
            { t: "All for a Good Cause!", k: "大義ノタメ!" },
            { t: "World Eaters' Den", k: "食世者ノ巣" },
            { t: "The Paths We Choose", k: "選ビシ道" },
            { t: "Rivals, Masters and Students", k: "好敵手・師・弟子" },
            { t: "To Sing a Song About...", k: "唄ニ謳ウハ…" },
            { t: "Signs", k: "兆シ" },
            { t: "Journeys", k: "旅路" },
            { t: "To and From The Beyond", k: "彼岸ト此岸" },
            { t: "A Really Good Bribe", k: "真ノ賄賂" },
            { t: "The Frog and the Snake (Are Lost in Space-Time)", k: "蛙ト蛇(時空ニ迷ウ)" },
            { t: "Child(ren) in Time", k: "時ノ中ノ子等" },
            { t: "The (Brave) New World", k: "(勇敢ナ)新世界" },
            { t: "Crossing Back I", k: "渡リ戻リ・壱" },
			{ t: "Crossing Back II", k: "渡リ戻リ・弐" },
            { t: "Keeping it in the Family", k: "家族内ノ事" },
            { t: "Interdimensional Matters", k: "異次元ノ事情" },
            { t: "From Outer Space", k: "宇宙ノ彼方" },
            { t: "Do Ōtsutsuki Dream of Hospitable Seed Worlds?", k: "大筒木ハ恵ミノ種界ヲ夢ミルカ?" },
            { t: "The One (Jutsu) They Feared", k: "畏レラレシ一術" },
            { t: "The Devil You Know", k: "知ル悪魔" },
            { t: "Relics", k: "遺物" },
            { t: "The Emperor's New Heir", k: "帝ノ新キ世継" },
            { t: "A Bad Case of Whisky", k: "酒ニ酔ウ災イ" },
            { t: "Gama's Bad Fur Day", k: "ガマノ厄日" },
            { t: "To Become a Chūnin, I Must", k: "中忍ヘ、我" },
            { t: "The Not-So-Legendary Trio", k: "半端ナ三忍" },
            { t: "The Emperor's Watchful Eyes", k: "帝ノ眼差シ" },
            { t: "The Broken Circle", k: "壊レタ環" },
            { t: "A Civilian Sort of Mind", k: "民間人ノ心" },
            { t: "The Illusion of Control", k: "統制ノ幻" },
            { t: "The Ever-Rising Sun", k: "昇リ続クル日" },
            { t: "The Lesser Clan Days", k: "小氏族ノ日々" },
            { t: "Ōmagatoki / Crow 9", k: "逢魔時/鴉九" },
            { t: "The Road to Solitude", k: "孤独ヘノ道" },
            { t: "The Waterlogged Maze", k: "水浸シノ迷宮" },
            { t: "The Invitation", k: "招待状" },
            { t: "Seashore Serenade", k: "浜辺ノ小夜曲" },
            { t: "Fireproof", k: "防火" },
            { t: "Home", k: "故郷" },
            { t: "Akimichi Chōji and the Terrible Three", k: "秋道チョウジト恐ロシキ三人組" },
            { t: "A Cozy Night in the Land of Fire", k: "火ノ国ノ安ラカナ夜" },
            { t: "Stained by Moonlight", k: "月光ニ染マリテ" },
            { t: "Close Enough to Touch", k: "触レルホド近ク" },
            { t: "Embracing the Unknown", k: "未知ヲ抱イテ" },
            { t: "Bound by Ink, Delivered by Thought", k: "墨ニ縛ラレ、念ニ運バレ" },
            { t: "The Journey Beyond", k: "彼方ヘノ旅" },
            { t: "Uchiha Sarada and the Goblet of Fire", k: "うちはサラダト炎ノ盃" },
            { t: "Between Heaven and Earth", k: "天地ノ間ニ" },
            { t: "The Redhead Who Killed a God", k: "神ヲ殺メシ赤髪" },
            { t: "Beneath a Scarlet Sky", k: "緋色ノ空ノ下" },
            { t: "Cat's Eye", k: "猫眼" },
            { t: "Kagutsuchi", k: "火之迦具土" },
            { t: "Nacchan's Year of Darkness", k: "ナッチャンノ暗黒年代" },
            { t: "Uchiha Shisui and the Twin Tyrants", k: "うちはシスイト双暴君" },
            { t: "Amenonuhoko", k: "天沼矛" },
            { t: "Highstorm", k: "大嵐" },
            { t: "Of Dreams and Stardust", k: "夢ト星屑" },
            { t: "The Lost Boys", k: "失ワレシ少年達" },
            { t: "In the Wake of Butterflies", k: "蝶ノ航跡" },
            { t: "Sunder", k: "裂断" },
            { t: "When Words Fail", k: "言葉尽キル時" },
            { t: "The Lightning Tree", k: "雷ノ樹" },
            { t: "Storms and Change", k: "嵐ト変革" },
            { t: "Stargazer", k: "観星者" },
            { t: "Above the Silent Heavens", k: "静寂ノ天ノ上" },
            { t: "Mitsuki and the Tournament Within the Tournament", k: "ミツキト大会内ノ大会" },
            { t: "The Journey Beyond II", k: "彼方ヘノ旅・弐" },
            { t: "Lord of the Morning", k: "朝ノ君主" },
            { t: "Ark", k: "方舟" },
            { t: "A Glimpse of Heaven", k: "天ノ一瞥" },
            { t: "The Comforting Caress of Home", k: "安ラギノ抱擁、故郷ノ" },
            { t: "For Your Eyes Only", k: "汝ノ眼ニノミ" },
            { t: "Bright Open Skies", k: "開ケタ青空" },
            { t: "The Wizard Great and Terrible", k: "偉大ニシテ恐ロシキ魔導士" },
            { t: "Blue Elegy", k: "蒼キ哀歌" },
            { t: "The Way", k: "道" },
            { t: "Echoes and Whispers to Reach the Very Heavens", k: "天ニ届ク反響ト囁キ" },
            { t: "Why the Woodwide Web Was a Mistake", k: "樹網ハ過チナリ" },
            { t: "Stars of Different Kinds", k: "異ナル星々" },
            { t: "Parts/Tempered Hearts", k: "部分/鍛エラレシ心" },
            { t: "Parts/One Month", k: "部分/一月" },
            { t: "Parts/Good Morning", k: "部分/良キ朝" },
            { t: "Kings of Heaven", k: "天ノ王者" },
            { t: "Kings of Hell", k: "地獄ノ王者" },
            { t: "Fear of the Sage", k: "仙人ヘノ畏レ" },
            { t: "A Certain Sweetness", k: "或ル甘味" },
            { t: "Celestials/A Place to Belong", k: "天人/居場所" },
            { t: "Celestials/Crossing Stars", k: "天人/星渡リ" },
            { t: "Celestials/Halfway to Heaven", k: "天人/天ノ半バ" },
            { t: "Before the Dawn", k: "夜明ケ前" },
            { t: "Takamagahara", k: "高天原" },
            { t: "The Ocean", k: "大海" },
            { t: "Wind and Flame", k: "風ト炎" },
            { t: "Blades of the Celestials", k: "天人ノ刃" },
            { t: "That Which Shatters Waves", k: "波ヲ砕ク者" },
            { t: "Into the Storm", k: "嵐ノ中ヘ" },
            { t: "Kin/Those Who Fight", k: "同胞/戦ウ者" },
            { t: "Kin/Light and Shadow", k: "同胞/光ト影" },
            { t: "Kin/A Field of Silvergrass", k: "同胞/芒野" },
            { t: "The Sword That Cuts Dreams", k: "夢ヲ断ツ剣" },
            { t: "Home/Sole Survivor", k: "故郷/唯一ノ生存者" },
            { t: "Home/Legacy", k: "故郷/遺産" },
            { t: "Home/Ring", k: "故郷/環" },
            { t: "Home/Bridges", k: "故郷/架ケ橋" },
            { t: "A Spire to the Stars", k: "星ヘノ尖塔" },
            { t: "Home II", k: "故郷・弐" },
            { t: "For Whom the Sun Shines", k: "日ノ照ラス者ヘ" },
            { t: "Hand in Hand, Heart to Heart", k: "手ニ手ヲ、心ニ心ヲ" },
            { t: "Pleasant Days", k: "穏ヤカナ日々" },
            { t: "The Great and Terrible Flame-Bearer", k: "偉大ニシテ恐ロシキ炎ノ担イ手" },
            { t: "These Invisible Moments", k: "見エザル刹那" },
            { t: "Uzumaki Naruto vs. Peace", k: "うずまきナルト対平和" },
            { t: "All the Lights in the Sky", k: "空ノ全テノ光" },
            { t: "From the Ring, with Love — Ch.1", k: "環ヨリ、愛ヲ込メテ・壱" },
        ];

        const STORIES = {
            '14095149': CHAPTERS_14095149,
            '14163903': CHAPTERS_14163903,
        };

        const THEMES = {
            '14095149': { color: 'rgb(106, 85, 124)', shadow: 'rgba(106, 85, 124, 0.2)' },
            '14163903': { color: 'rgb(137, 70, 87)',  shadow: 'rgba(137, 70, 87, 0.2)' },
        };
        const DEFAULT_THEME = { color: 'rgb(106, 85, 124)', shadow: 'rgba(106, 85, 124, 0.2)' };

        function injectStyles(theme) {
            if (document.getElementById('ffn-kt-styles')) return;
            const css = `
                .ffn-kt-wrap {
                    display: block;
                    width: 100%;
                    margin: 1.5em 0 0.75em;
                    text-align: left;
                }
                .ffn-kt-kanji {
                    writing-mode: vertical-rl;
                    text-orientation: upright;
                    color: ${theme.color};
                    font-size: 2.5em;
                    font-weight: 200;
                    font-family: "Yuji Syuku", Meiryo, Osaka, sans-serif;
                    letter-spacing: 0.15em;
                    text-shadow: 3px 2px 3px ${theme.shadow};
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    white-space: pre;
                    position: relative;
                    left: 50%;
                    transform: translateX(-50%);
                    width: fit-content;
                }
                .ffn-kt-title {
                    font-size: 140%;
                    font-weight: 600;
                    font-family: "Noto Serif", Georgia, serif;
                    color: ${theme.color};
                    text-transform: uppercase;
                    position: relative;
                    text-align: center;
                    display: inline-block;
                    margin: 1em auto;
                    padding: 15px 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(247, 243, 239, 0.1);
                }
                .ffn-kt-title::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border: 1px solid ${theme.color};
                }
                .ffn-kt-title::after {
                    content: '';
                    position: absolute;
                    top: 3px; left: 3px; right: 3px; bottom: 3px;
                    border: 1px solid ${theme.color};
                }
            `;
            const style = document.createElement('style');
            style.id = 'ffn-kt-styles';
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);

            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@300;400;700&family=Yuji+Syuku&display=swap';
            (document.head || document.documentElement).appendChild(fontLink);
        }

        function currentStoryId() {
            const m = location.pathname.match(/^\/s\/(\d+)\//);
            return m ? m[1] : null;
        }

        function currentChapterNumber() {
            const m = location.pathname.match(/^\/s\/\d+\/(\d+)/);
            if (m) return parseInt(m[1], 10);
            const sel = document.querySelector('#chap_select');
            if (sel && sel.value) {
                const n = parseInt(sel.value, 10);
                if (!isNaN(n)) return n;
            }
            return null;
        }

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

        function run() {
            if (document.getElementById('ffn-kt-wrap')) return true;

            const storyId = currentStoryId();
            const table = storyId && STORIES[storyId];
            if (!table || !table.length) return false;

            const n = currentChapterNumber();
            if (!n) return false;
            const data = table[n - 1];
            if (!data) {
                console.warn('[FFnet kanji title] no entry for chapter', n, 'of story', storyId);
                return false;
            }

            const story = document.querySelector('#storytext, .storytext, #storycontent');
            const firstSel = document.querySelector('[id="chap_select"]');
            if (!story && !firstSel) return false;

            injectStyles(THEMES[storyId] || DEFAULT_THEME);

            const wrap = document.createElement('div');
            wrap.className = 'ffn-kt-wrap';
            wrap.id = 'ffn-kt-wrap';

            const kanji = document.createElement('div');
            kanji.className = 'ffn-kt-kanji';
            kanji.setAttribute('aria-hidden', 'true');
            kanji.textContent = data.k;

            const title = document.createElement('div');
            title.className = 'ffn-kt-title';
            title.textContent = `${n} — ${data.t}`;

            wrap.appendChild(kanji);
            wrap.appendChild(title);

            if (story) {
                story.insertAdjacentElement('beforebegin', wrap);
            } else {
                firstSel.insertAdjacentElement('afterend', wrap);
            }

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => animateKanjiAppear(kanji));
            } else {
                animateKanjiAppear(kanji);
            }
            return true;
        }

        run();
    })());


    // =====================================================================
    // MODULE 11 — FanFiction.net Illustrations
    // Original @match: FFN stories 14312002 (Crimson Horizons), 14396658 (From the Ring, With Love)
    // =====================================================================
    if (isFFNIllustrationStory()) whenReady(() => (function moduleFFNIllustrations() {
        const INLINE_LABEL = 'i';
        const EXTRA_WORD   = /\bextra\b/i;
        const TOKEN_RE = new RegExp(`(?:^|\\s)((${INLINE_LABEL})\\s*\\/\\s*([A-Za-z0-9]+))`, 'gi');
        const AN_PATTERN = /\bAN\s*:|A\s*\/\s*N\s*:|A\.\s*N\.|author'?s?\s+note/i;

        const PLACEHOLDER_SIZES = new Set(['400x200', '200x400']);
        const MIN_AREA_OK = 350 * 350;
        const CAPTION_MAX = 80;

        function looksLikePlaceholder(w, h) {
            if (PLACEHOLDER_SIZES.has(`${w}x${h}`)) return true;
            if ((w * h) < MIN_AREA_OK) return true;
            const ar = w > h ? (w / h) : (h / w);
            if (ar >= 1.95 && ar <= 2.05 && (w * h) < (500 * 500)) return true;
            return false;
        }

        function tryImageUrls(code) {
            const subs = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const exts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
            const candidates = [];
            for (const s of subs) {
                for (const ext of exts) candidates.push(`https://${s}.l3n.co/i/${code}.${ext}`);
            }
            candidates.push(`https://c.l3n.co/i/${code}`);

            const probe = (url, timeoutMs = 8000) => new Promise((resolve, reject) => {
                const img = new Image();
                let timedOut = false;
                const timer = setTimeout(() => { timedOut = true; try { img.src = ''; } catch (_) {} reject(new Error('timeout')); }, timeoutMs);
                img.onload = () => {
                    if (timedOut) return;
                    clearTimeout(timer);
                    const w = img.naturalWidth || 0, h = img.naturalHeight || 0;
                    if (w > 0 && h > 0 && !looksLikePlaceholder(w, h)) resolve(url);
                    else reject(new Error('placeholder-or-tiny'));
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
                    try { return resolve(await Promise.any(batch.map(u => probe(u)))); }
                    catch { offset += batchSize; }
                }
                resolve(null);
            });
        }

        function storyRoot() {
            return document.querySelector('#storytext, .storytext, #storycontent');
        }

        function isExtraContext(block) {
            if (!block) return false;
            let text = block.textContent || '';
            const prev = block.previousElementSibling;
            if (prev) text += ' ' + (prev.textContent || '');
            return EXTRA_WORD.test(text);
        }

        function anInsertionPoint(root) {
            for (const el of Array.from(root.children)) {
                const txt = (el.textContent || '').trim();
                if (txt && AN_PATTERN.test(txt) && txt.length < 400) {
                    const prev = el.previousElementSibling;
                    if (prev && prev.tagName === 'HR') return prev;
                    return el;
                }
            }
            return null;
        }

        function injectStyles() {
            if (document.getElementById('cho-styles')) return;
            const css = `
                .cho-gallery { display: block; margin: 2em auto 1em; }
                .cho-illus { display: block; text-align: center; margin: 1.75em auto; }
                .cho-illus img {
                    max-width: 100%; height: auto; border-radius: 6px; cursor: zoom-in;
                }
                .cho-illus .cho-loading {
                    color: #999; font-style: italic;
                    font-family: "Noto Serif", "PT Serif", Georgia, serif; padding: .5em 0;
                }
                .cho-caption {
                    margin-top: .5em;
                    font-style: italic; font-size: .85em; color: #666;
                    font-family: "Noto Serif", "PT Serif", Georgia, serif;
                    text-align: center;
                }
                .cho-extra {
                    border: 1px solid rgba(117,7,5,.35);
                    border-radius: 12px;
                    padding: 1em 1.25em 1.25em;
                    margin: 2.5em auto 1em;
                    max-width: 65%;
                }
                .cho-extra > summary.cho-extra-label {
                    font-weight: 700; color: #750705;
                    font-family: "Noto Serif", "PT Serif", Georgia, serif;
                    text-transform: uppercase; letter-spacing: .08em; font-size: .9em;
                    text-align: center; margin-bottom: .75em;
                    cursor: pointer; list-style: none;
                }
                .cho-extra:not([open]) > summary.cho-extra-label { margin-bottom: 0; }
                .cho-extra > summary.cho-extra-label::-webkit-details-marker { display: none; }
                .cho-extra > summary.cho-extra-label::after { content: " ▸"; opacity: .7; }
                .cho-extra[open] > summary.cho-extra-label::after { content: " ▾"; }
                .cho-overlay {
                    position: fixed; inset: 0; z-index: 100000;
                    background: rgba(0,0,0,.85);
                    display: flex; align-items: center; justify-content: center; cursor: zoom-out;
                }
                .cho-overlay img { max-width: 92%; max-height: 92%; border-radius: 8px; box-shadow: 0 6px 30px rgba(0,0,0,.6); }
            `;
            const style = document.createElement('style');
            style.id = 'cho-styles';
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);

            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap';
            (document.head || document.documentElement).appendChild(fontLink);
        }

        function openImageOverlay(src) {
            const overlay = document.createElement('div');
            overlay.className = 'cho-overlay';
            const img = document.createElement('img');
            img.src = src;
            overlay.appendChild(img);
            overlay.addEventListener('click', () => overlay.remove());
            document.body.appendChild(overlay);
        }

        function buildIllustration(code, opts = {}) {
            const extra = !!opts.extra;
            const caption = opts.caption || '';

            const fig = document.createElement('figure');
            fig.className = 'cho-illus';

            const loading = document.createElement('div');
            loading.className = 'cho-loading';
            loading.textContent = 'Loading image…';
            fig.appendChild(loading);

            tryImageUrls(code).then((url) => {
                loading.remove();
                if (!url) return;
                const img = document.createElement('img');
                img.alt = caption || code;
                img.addEventListener('click', () => openImageOverlay(url));
                img.src = url;
                fig.appendChild(img);
                if (caption) {
                    const cap = document.createElement('figcaption');
                    cap.className = 'cho-caption';
                    cap.textContent = caption;
                    fig.appendChild(cap);
                }
            });

            if (!extra) return fig;

            const details = document.createElement('details');
            details.className = 'cho-extra';
            const summary = document.createElement('summary');
            summary.className = 'cho-extra-label';
            summary.textContent = 'Extra';
            details.appendChild(summary);
            details.appendChild(fig);
            return details;
        }

        function cleanResidual(block, codes) {
            let t = block.textContent || '';
            (codes || []).forEach((c) => { t = t.split(c).join(' '); });
            return t.replace(EXTRA_WORD, ' ')
                    .replace(/[\s:()\[\]|.–—\-]+/g, ' ')
                    .trim();
        }

        function collectCodes(root) {
            const refs = [];
            const touched = new Set();
            const codesByBlock = new Map();

            function register(code, block) {
                refs.push({ code, extra: isExtraContext(block), block });
                if (block) {
                    touched.add(block);
                    if (!codesByBlock.has(block)) codesByBlock.set(block, []);
                    codesByBlock.get(block).push(code);
                }
            }

            root.querySelectorAll('.ffn-image-btn').forEach((btn) => {
                const code = (btn.textContent || '').trim();
                if (!code) return;
                register(code, btn.closest('p, div, li, blockquote'));
                btn.remove();
            });

            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            const textNodes = [];
            let node;
            while ((node = walker.nextNode())) {
                const p = node.parentNode;
                if (!p) continue;
                if (p.closest && p.closest('script, style, .cho-illus, .cho-gallery')) continue;
                textNodes.push(node);
            }
            textNodes.forEach((tn) => {
                const text = tn.textContent;
                TOKEN_RE.lastIndex = 0;
                const hits = [];
                let m;
                while ((m = TOKEN_RE.exec(text)) !== null) {
                    const start = m.index + (m[0].length - m[1].length);
                    hits.push({ code: m[3], start, end: start + m[1].length });
                }
                if (!hits.length) return;

                const block = tn.parentNode.closest ? tn.parentNode.closest('p, div, li, blockquote') : null;
                let out = '';
                let last = 0;
                hits.forEach((h) => {
                    out += text.slice(last, h.start);
                    register(h.code, block);
                    last = h.end;
                });
                out += text.slice(last);
                tn.textContent = out;
            });

            const residualFor = new Map();
            touched.forEach((b) => residualFor.set(b, cleanResidual(b, codesByBlock.get(b))));
            refs.forEach((r) => {
                const res = r.block ? (residualFor.get(r.block) || '') : '';
                r.caption = res.length <= CAPTION_MAX ? res : '';
            });
            touched.forEach((b) => {
                if (!b.isConnected) return;
                if (b.querySelector('img, .cho-illus, .ffn-image-btn')) return;
                if ((residualFor.get(b) || '').length <= CAPTION_MAX) b.remove();
            });

            return {
                normals: refs.filter((r) => !r.extra),
                extras: refs.filter((r) => r.extra),
            };
        }

        function run() {
            const root = storyRoot();
            if (!root || root.dataset.choDone) return;
            root.dataset.choDone = '1';

            injectStyles();
            const { normals, extras } = collectCodes(root);
            if (!normals.length && !extras.length) return;

            if (normals.length) {
                const gallery = document.createElement('div');
                gallery.className = 'cho-gallery';
                normals.forEach((r) => gallery.appendChild(buildIllustration(r.code, { caption: r.caption })));
                const an = anInsertionPoint(root);
                if (an) root.insertBefore(gallery, an);
                else root.appendChild(gallery);
            }

            extras.forEach((r) => root.appendChild(buildIllustration(r.code, { extra: true, caption: r.caption })));
        }

        run();
    })());

})();
