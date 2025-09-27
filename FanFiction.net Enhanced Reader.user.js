// ==UserScript==
// @name         FanFiction.net Enhanced Reader — 1.3
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Display images from lensdump codes, style chapter titles, enable text selection, and enhance reading experience on fanfiction.net
// @author       stroke6
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
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // ---------- CSS ----------
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
    .strongred { font-size:140% !important; font-weight:bold !important; font-family: PT Serif, Georgia !important; color:#750705 !important; }
    p .red .strongred { font-size:3em !important; line-height:1 !important; font-weight:bold !important; }
    .ffn-kanji-styled { font-size:3em !important; line-height:1 !important; font-weight:bold !important; font-family: PT Serif, Georgia !important; color:#750705 !important; }
  `;
  const style = document.createElement('style');
  style.textContent = overlayCSS;
  document.head.appendChild(style);

  // Heuristics against Lensdump's black "no permission/deleted" image.
  // Tune here if they change assets (again)
  const PLACEHOLDER_SIZES = new Set([
    '400x200', // common landscape placeholder
    '200x400'  // (portrait)
  ]);
  const MIN_AREA_OK = 350 * 350; // require at least 122,500 px^2

  function looksLikePlaceholder(w, h) {
    const tag = `${w}x${h}`;
    if (PLACEHOLDER_SIZES.has(tag)) return true;
    if ((w * h) < MIN_AREA_OK) return true;
    const ar = w > h ? (w / h) : (h / w);
    if (ar >= 1.95 && ar <= 2.05 && (w * h) < (500 * 500)) return true;
    return false;
  }

  // ---------- Robust Lensdump resolution ----------
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
            resolve(url);                 // accept real image
          } else {
            reject(new Error('placeholder-or-tiny'));
          }
        }
      };
      img.onerror = () => { clearTimeout(timer); reject(new Error('error')); };

      // cache-bust
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
          return resolve(winner); // first non-placeholder
        } catch {
          offset += batchSize; // try next batch
        }
      }
      resolve(null);
    });
  }

  // ---------- Overlay ----------
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

  // ---------- Enable text selection ----------
  function enableTextSelection() {
    const style = document.createElement('style');
    style.textContent = `
      * { -webkit-user-select:text !important; -moz-user-select:text !important; -ms-user-select:text !important; user-select:text !important; }
    `;
    document.head.appendChild(style);

    // Also remove any existing user-select CSS
    const existingStyles = document.querySelectorAll('style');
    existingStyles.forEach(styleEl => {
      if (styleEl.textContent.includes('user-select: none')) {
        styleEl.textContent = styleEl.textContent.replace(/user-select:\s*none/g, 'user-select: text');
      }
    });
  }

  // ---------- Japanese detection ----------
  function isJapanese(char) {
    const code = char.charCodeAt(0);
    return (code >= 0x3040 && code <= 0x309F) || // Hiragana
           (code >= 0x30A0 && code <= 0x30FF) || // Katakana
           (code >= 0x4E00 && code <= 0x9FAF) || // CJK Unified Ideographs
           (code >= 0x3400 && code <= 0x4DBF);   // CJK Ext A
  }

  // ---------- Title helpers ----------
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

  // ---------- Style chapter titles + kanji ----------
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

    // Style centered Japanese lines
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
          const span = document.createElement('span'); span.className = 'ffn-kanji-styled'; span.textContent = txt; tn.parentNode.replaceChild(span, tn); break;
        }
        p = p.parentNode;
      }
    });
  }

  // ---------- Image code processing ----------
  function processImageCodes() {
    const chapterContent = document.querySelector('#storytext, .storytext, .userstuff, #content, .chapter-content, div[style*="font-family"], .mobile-chapter, .chapter-text');
    if (!chapterContent) {
      const bodyDivs = document.querySelectorAll('body div');
      let found = false;
      bodyDivs.forEach(div => {
        if ((div.textContent.includes('i/') || div.textContent.includes('i /')) && div.textContent.length > 100) { processTextInElement(div); found = true; }
      });
      if (!found) console.log('No content found to process');
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

  // ---------- Main ----------
  function runAllEnhancements() {
    enableTextSelection();
    styleChapterElements();
    processImageCodes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllEnhancements);
  } else {
    runAllEnhancements();
  }

  // Re-run on SPA-like navigations
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) { lastUrl = url; setTimeout(runAllEnhancements, 500); }
  }).observe(document, { subtree:true, childList:true });

  // Manual trigger
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') runAllEnhancements();
  });

})();
