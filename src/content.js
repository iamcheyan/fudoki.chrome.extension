import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { arpabetToKatakana } from './arpabet_converter';
const cmuDict = require('cmu-pronouncing-dictionary');
// The library returns { dictionary: {} } structure or just the dictionary?
// Based on output, it returns { dictionary: { ... } }? 
// No, the output showed the whole object keys were words.
// Wait, the output starts with `phonesForWord: [Function: phonesForWord]`? No.
// The output of `node -e "console.log(require('cmu-pronouncing-dictionary'))"` showed a huge object like `{ a: 'AH0', ... }`.
// So it exports the dictionary directly as module.exports.
// There is no `phonesForWord` function exported!
// I must implement the lookup myself.

const phonesForWord = (word) => {
    return cmuDict[word];
};

const simpleFallback = (text) => {
    // Very basic mapping for unknown words
    // Vowels
    let s = text;
    s = s.replace(/a/g, 'ア');
    s = s.replace(/i/g, 'イ');
    s = s.replace(/u/g, 'ウ');
    s = s.replace(/e/g, 'エ');
    s = s.replace(/o/g, 'オ');
    // Consonants (rough)
    s = s.replace(/ba/g, 'バ').replace(/be/g, 'ベ').replace(/bi/g, 'ビ').replace(/bo/g, 'ボ').replace(/bu/g, 'ブ').replace(/b/g, 'ブ');
    s = s.replace(/da/g, 'ダ').replace(/de/g, 'デ').replace(/di/g, 'ディ').replace(/do/g, 'ド').replace(/du/g, 'ドゥ').replace(/d/g, 'ド');
    s = s.replace(/ga/g, 'ガ').replace(/ge/g, 'ゲ').replace(/gi/g, 'ギ').replace(/go/g, 'ゴ').replace(/gu/g, 'グ').replace(/g/g, 'グ');
    s = s.replace(/ka/g, 'カ').replace(/ke/g, 'ケ').replace(/ki/g, 'キ').replace(/ko/g, 'コ').replace(/ku/g, 'ク').replace(/k/g, 'ク');
    s = s.replace(/pa/g, 'パ').replace(/pe/g, 'ペ').replace(/pi/g, 'ピ').replace(/po/g, 'ポ').replace(/pu/g, 'プ').replace(/p/g, 'プ');
    s = s.replace(/ta/g, 'タ').replace(/te/g, 'テ').replace(/ti/g, 'ティ').replace(/to/g, 'ト').replace(/tu/g, 'チュ').replace(/t/g, 'ト');
    s = s.replace(/za/g, 'ザ').replace(/ze/g, 'ゼ').replace(/zi/g, 'ジ').replace(/zo/g, 'ゾ').replace(/zu/g, 'ズ').replace(/z/g, 'ズ');
    s = s.replace(/ma/g, 'マ').replace(/me/g, 'メ').replace(/mi/g, 'ミ').replace(/mo/g, 'モ').replace(/mu/g, 'ム').replace(/m/g, 'ム');
    s = s.replace(/na/g, 'ナ').replace(/ne/g, 'ネ').replace(/ni/g, 'ニ').replace(/no/g, 'ノ').replace(/nu/g, 'ヌ').replace(/n/g, 'ン');
    s = s.replace(/ra/g, 'ラ').replace(/re/g, 'レ').replace(/ri/g, 'リ').replace(/ro/g, 'ロ').replace(/ru/g, 'ル').replace(/r/g, 'ル');
    s = s.replace(/sa/g, 'サ').replace(/se/g, 'セ').replace(/si/g, 'シ').replace(/so/g, 'ソ').replace(/su/g, 'ス').replace(/s/g, 'ス');
    s = s.replace(/v/g, 'ヴ');
    s = s.replace(/l/g, 'ル');
    s = s.replace(/f/g, 'フ');
    s = s.replace(/j/g, 'ジ');
    s = s.replace(/h/g, 'ハ');
    s = s.replace(/w/g, 'ワ');
    s = s.replace(/y/g, 'イ');

    // Check if result is fully kana-ized (basic check)
    if (/[\u30A0-\u30FF]/.test(s)) return s;
    return null;
};

console.log('Furigana Extension: Content script loaded.');

const kuroshiro = new Kuroshiro();
let isInitialized = false;
let initPromise = null;

const init = () => {
    if (isInitialized) return Promise.resolve();
    if (initPromise) return initPromise;

    initPromise = kuroshiro.init(new KuromojiAnalyzer({
        dictPath: chrome.runtime.getURL('dict/')
    })).then(() => {
        isInitialized = true;
        console.log('Furigana Extension: Initialized kuroshiro.');
    }).catch(err => {
        console.error('Furigana Extension: Init failed', err);
        initPromise = null;
    });

    return initPromise;
};

const updateStyles = (settings) => {
    let style = document.getElementById('furigana-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'furigana-style';
        document.head.appendChild(style);
    }

    const fontSize = settings.fontSize || 50;
    const displayMode = settings.displayMode || 'always';

    let css = `
    .furigana-wrapper rt {
      font-size: ${fontSize}% !important;
    }
  `;

    if (displayMode === 'hover') {
        css += `
      .furigana-wrapper ruby rt { opacity: 0; transition: opacity 0.2s; }
      .furigana-wrapper ruby:hover rt { opacity: 1; }
    `;
    } else {
        css += `
      .furigana-wrapper ruby rt { opacity: 1; }
    `;
    }

    style.textContent = css;
};

const processTextNodes = async (settings) => {
    await init();

    updateStyles(settings);

    console.log('Furigana Extension: Starting conversion...');

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip parents that break flow or already processed
                const tag = node.parentElement.tagName;
                if (['RUBY', 'RT', 'RP', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.parentElement.classList.contains('furigana-wrapper')) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (!node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Check if contains Kanji
                if (/[\u4e00-\u9faf\u3400-\u4dbf]/.test(node.textContent)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        }
    );

    const nodes = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
        nodes.push(currentNode);
    }

    console.log(`Furigana Extension: Found ${nodes.length} nodes to process.`);

    // Process nodes for Japanese
    for (const node of nodes) {
        const text = node.textContent;
        try {
            const converted = await kuroshiro.convert(text, {
                to: settings.mode || 'hiragana',
                mode: 'furigana'
            });

            if (converted !== text) {
                const wrapper = document.createElement('span');
                wrapper.className = 'furigana-wrapper';
                wrapper.dataset.original = text; // Store original for reversion
                wrapper.innerHTML = converted;
                node.replaceWith(wrapper);
            }
        } catch (e) {
            console.warn('Furigana Extension: Conversion error', e);
        }
    }

    // Process English if enabled
    if (settings.englishMode) {
        // We need a fresh walker or collection because we replaced nodes above
        // But actually English and Japanese are often mixed. 
        // The previous loop only processed nodes containing Kanji. 
        // We should scan for English now.

        const engWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const tag = node.parentElement.tagName;
                    if (['RUBY', 'RT', 'RP', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(tag)) return NodeFilter.FILTER_REJECT;
                    if (node.parentElement.classList.contains('furigana-wrapper')) return NodeFilter.FILTER_REJECT;

                    // Simple heuristic for English words: contains at least one English letter
                    // and doesn't contain Kanji (already processed or not a target)
                    // We actually want to target ONLY English words, potentially inside sentences
                    if (/[a-zA-Z]/.test(node.textContent)) return NodeFilter.FILTER_ACCEPT;

                    return NodeFilter.FILTER_SKIP;
                }
            }
        );

        const engNodes = [];
        let curr;
        while (curr = engWalker.nextNode()) {
            engNodes.push(curr);
        }

        for (const node of engNodes) {
            const text = node.textContent;
            // Split by non-word characters to isolate words, but keep delimiters to reconstruct
            // This is naive. A bedre approach is replacing matches.

            // Regex for English words, ignoring all-caps (often acronyms) unless they are short?
            // User said: exclude all caps.
            // Regex: \b[a-z]+[a-z\']*\b (starts with lowercase or is mixed case, but not full caps if distinct)
            // Actually user said: exclude ALL CAPS. Include mixed or lower.

            const words = text.split(/([a-zA-Z]+(?:['’][a-z]+)?)/g);

            if (words.length > 1) {
                const fragment = document.createDocumentFragment();
                let modified = false;

                words.forEach(segment => {
                    // Check if it's a word we want to process
                    // 1. Must be letters
                    // 2. Not full caps (unless it's like 'I' or 'A')
                    if (/^[a-zA-Z]+(?:['’][a-z]+)?$/.test(segment) && !/^[A-Z0-9_]+$/.test(segment)) {
                        const lower = segment.toLowerCase();
                        const phones = phonesForWord(lower);

                        if (phones && phones.length > 0) {
                            // Get the first pronunciation
                            // Convert phones (ARPABET) to IPA or directly map ARPABET to Katakana
                            // Our ipa_converter expects IPA, but cmu-pronouncing-dictionary gives ARPABET.
                            // Wait, cmu-pronouncing-dictionary gives ARPABET.
                            // The user plan mentioned IPA -> Katakana.
                            // BUT we are using cmu-pronouncing-dictionary which is ARPABET.
                            // We should map ARPABET -> Katakana directly or ARPABET -> IPA -> Katakana.
                            // Direct is faster. Let's adjust ipa_converter or create a local mapper here.
                            // Actually, let's just make a simple ARPABET to Katakana mapper since we have the data.

                            const katakana = arpabetToKatakana(phones[0]); // Helper function we'll add

                            if (katakana) {
                                const ruby = document.createElement('ruby');
                                ruby.appendChild(document.createTextNode(segment));
                                const rt = document.createElement('rt');
                                rt.textContent = katakana;
                                ruby.appendChild(rt);

                                // Wrap in our standard wrapper for style/revert
                                const wrapper = document.createElement('span');
                                wrapper.className = 'furigana-wrapper';
                                wrapper.dataset.original = segment;
                                wrapper.appendChild(ruby);

                                fragment.appendChild(wrapper);
                                modified = true;
                                return;
                            }
                        } else {
                            // Fallback for unknown words (e.g. Neovim)
                            // Simple heuristic mapping based on letters
                            // This is very rough but better than nothing for a "reading aid"
                            const fallback = simpleFallback(lower);
                            if (fallback) {
                                const ruby = document.createElement('ruby');
                                ruby.appendChild(document.createTextNode(segment));
                                const rt = document.createElement('rt');
                                rt.textContent = fallback;
                                ruby.appendChild(rt);

                                const wrapper = document.createElement('span');
                                wrapper.className = 'furigana-wrapper';
                                wrapper.dataset.original = segment;
                                wrapper.appendChild(ruby);

                                fragment.appendChild(wrapper);
                                modified = true;
                                return;
                            }
                        }
                    }
                    // If not processed, just append text
                    fragment.appendChild(document.createTextNode(segment));
                });

                if (modified) {
                    node.replaceWith(fragment);
                }
            }
        }
    }

    console.log('Furigana Extension: Processing complete.');
    console.log('Furigana Extension: Processing complete.');
};

const removeFurigana = () => {
    const wrappers = document.querySelectorAll('.furigana-wrapper');
    wrappers.forEach(wrapper => {
        // Try to recover original text from data attribute
        if (wrapper.dataset.original) {
            wrapper.replaceWith(document.createTextNode(wrapper.dataset.original));
            return;
        }

        // Fallback: Recover from ruby structure
        let originalText = '';
        const ruby = wrapper.querySelector('ruby');
        if (ruby) {
            ruby.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    originalText += nodetextContent;
                }
            });
        }

        if (originalText) {
            wrapper.replaceWith(document.createTextNode(originalText));
        } else {
            // Last resort: simple text content (includes kana, but better than nothing or losing text)
            // But actually, it's safer to not touch if we can't be sure, 
            // however for the purpose of "switching mode", we must replace.
            // If data-original is missing (old version), this might imply we just reloaded the extension
            // so maybe those old wrappers aren't even selectable by querySelector if the DOM is fresh?
            // Actually they are persistent in the page.
            // Let's rely on dataset.original primarily.
        }
    });
};

const processTextNodesWithRevert = async (settings) => {
    // Determine if we need to revert. 
    // If the user is requesting an update, we should probably revert to be safe and ensure
    // the new mode (Katakana/Hiragana) is applied to everything.

    // Check if there are existing wrappers
    const existing = document.querySelector('.furigana-wrapper');
    if (existing) {
        removeFurigana();
    }

    await processTextNodes(settings);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateFurigana') {
        processTextNodesWithRevert(request.settings);
        // Also start/restart observer with new settings
        startObserving(request.settings);
        sendResponse({ status: 'started' });
    } else if (request.action === 'toggleFurigana') {
        // Toggle visibility of all furigana wrappers
        const wrappers = document.querySelectorAll('.furigana-wrapper');
        if (wrappers.length > 0) {
            const firstWrapper = wrappers[0];
            const isHidden = firstWrapper.style.display === 'none';

            wrappers.forEach(wrapper => {
                wrapper.style.display = isHidden ? '' : 'none';
            });

            sendResponse({ status: 'toggled', visible: isHidden });
        } else {
            sendResponse({ status: 'no-furigana' });
        }
    } else if (request.action === 'showFuriganaPopup') {
        // Show popup from context menu
        if (request.text) {
            showFuriganaPopup(request.text);
            sendResponse({ status: 'popup-shown' });
        }
    }
    return true;
});

// MutationObserver to watch for dynamic content
let observer = null;
let currentSettings = null;

const startObserving = (settings) => {
    currentSettings = settings;

    // Stop existing observer if any
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
        // Collect all added nodes
        const addedNodes = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                // Only process element nodes or text nodes
                if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                    addedNodes.push(node);
                }
            });
        });

        if (addedNodes.length > 0) {
            // Process new nodes with current settings
            processNewNodes(addedNodes, settings);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Furigana Extension: MutationObserver started');
};

const processNewNodes = async (nodes, settings) => {
    await init();
    updateStyles(settings);

    // Process each added node
    for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Direct text node
            await processTextNode(node, settings);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Element node - walk through its text nodes
            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (textNode) => {
                        const tag = textNode.parentElement?.tagName;
                        if (['RUBY', 'RT', 'RP', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(tag)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (textNode.parentElement?.classList.contains('furigana-wrapper')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (!textNode.textContent.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const textNodes = [];
            let currentNode;
            while (currentNode = walker.nextNode()) {
                textNodes.push(currentNode);
            }

            for (const textNode of textNodes) {
                await processTextNode(textNode, settings);
            }
        }
    }
};

const processTextNode = async (node, settings) => {
    const text = node.textContent;

    // Check for Japanese (Kanji)
    if (/[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
        try {
            const converted = await kuroshiro.convert(text, {
                to: settings.mode || 'hiragana',
                mode: 'furigana'
            });

            if (converted !== text) {
                const wrapper = document.createElement('span');
                wrapper.className = 'furigana-wrapper';
                wrapper.dataset.original = text;
                wrapper.innerHTML = converted;
                node.replaceWith(wrapper);
            }
        } catch (e) {
            console.warn('Furigana Extension: Conversion error', e);
        }
    }

    // Check for English if enabled
    if (settings.englishMode && /[a-zA-Z]/.test(text)) {
        const words = text.split(/([a-zA-Z]+(?:[''][a-z]+)?)/g);

        if (words.length > 1) {
            const fragment = document.createDocumentFragment();
            let modified = false;

            words.forEach(segment => {
                if (/^[a-zA-Z]+(?:[''][a-z]+)?$/.test(segment) && !/^[A-Z0-9_]+$/.test(segment)) {
                    const lower = segment.toLowerCase();
                    const phones = phonesForWord(lower);

                    if (phones) {
                        const katakana = arpabetToKatakana(phones);

                        if (katakana) {
                            const ruby = document.createElement('ruby');
                            ruby.appendChild(document.createTextNode(segment));
                            const rt = document.createElement('rt');
                            rt.textContent = katakana;
                            ruby.appendChild(rt);

                            const wrapper = document.createElement('span');
                            wrapper.className = 'furigana-wrapper';
                            wrapper.dataset.original = segment;
                            wrapper.appendChild(ruby);

                            fragment.appendChild(wrapper);
                            modified = true;
                            return;
                        }
                    } else {
                        const fallback = simpleFallback(lower);
                        if (fallback) {
                            const ruby = document.createElement('ruby');
                            ruby.appendChild(document.createTextNode(segment));
                            const rt = document.createElement('rt');
                            rt.textContent = fallback;
                            ruby.appendChild(rt);

                            const wrapper = document.createElement('span');
                            wrapper.className = 'furigana-wrapper';
                            wrapper.dataset.original = segment;
                            wrapper.appendChild(ruby);

                            fragment.appendChild(wrapper);
                            modified = true;
                            return;
                        }
                    }
                }
                fragment.appendChild(document.createTextNode(segment));
            });

            if (modified) {
                node.replaceWith(fragment);
            }
        }
    }
};

// Check if auto-enable should run for current site
const shouldAutoEnable = (globalAutoMode, sitePreferences) => {
    const currentHost = window.location.hostname;
    const sitePref = sitePreferences[currentHost];

    // Site-specific preference takes priority
    if (sitePref === 'always') {
        return true;
    } else if (sitePref === 'never') {
        return false;
    }

    // Fall back to global setting
    return globalAutoMode || false;
};

// Check auto-enable setting on load
chrome.storage.sync.get(['mode', 'fontSize', 'displayMode', 'globalAutoMode', 'englishMode', 'sitePreferences'], (result) => {
    const sitePreferences = result.sitePreferences || {};

    if (shouldAutoEnable(result.globalAutoMode, sitePreferences)) {
        console.log('Furigana Extension: Auto-enabling for this site');

        // Wait for DOM to be ready if it's not
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                processTextNodes(result);
                // Start observing for dynamic content
                startObserving(result);
            });
        } else {
            processTextNodes(result);
            // Start observing for dynamic content
            startObserving(result);
        }
    } else {
        console.log('Furigana Extension: Auto-enable disabled for this site');
    }
});

// Floating button for text selection
let floatingButton = null;
let floatingPopup = null;
let currentSelection = null;
let currentSelectionText = '';

const createFloatingButton = () => {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.id = 'furigana-float-btn';
    // Content 'あ' is now in CSS ::before
    document.body.appendChild(floatingButton);

    floatingButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentSelection && currentSelectionText) {
            await showFuriganaPopup(currentSelectionText);
            hideFloatingButton();
        }
    });
};

const createFloatingPopup = () => {
    if (floatingPopup) return;

    floatingPopup = document.createElement('div');
    floatingPopup.id = 'furigana-popup';
    floatingPopup.innerHTML = `
        <div id="furigana-popup-header">
            <div id="furigana-popup-title">振り仮名 Furigana</div>
            <div id="furigana-popup-controls">
                <div id="furigana-popup-theme-toggle">☀️</div>
                <div id="furigana-popup-close">×</div>
            </div>
        </div>
        <div id="furigana-popup-font-control">
            <span id="furigana-popup-font-label">Size</span>
            <input type="range" id="furigana-popup-font-slider" min="12" max="32" value="18">
            <span id="furigana-popup-font-value">18px</span>
        </div>
        <div id="furigana-popup-content"></div>
    `;
    document.body.appendChild(floatingPopup);

    // Theme toggle
    const themeToggle = floatingPopup.querySelector('#furigana-popup-theme-toggle');
    themeToggle.addEventListener('click', () => {
        floatingPopup.classList.toggle('light-theme');
        themeToggle.textContent = floatingPopup.classList.contains('light-theme') ? '🌙' : '☀️';
    });

    // Font size slider
    const fontSlider = floatingPopup.querySelector('#furigana-popup-font-slider');
    const fontValue = floatingPopup.querySelector('#furigana-popup-font-value');
    const content = floatingPopup.querySelector('#furigana-popup-content');

    fontSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        fontValue.textContent = size + 'px';
        content.style.fontSize = size + 'px';
    });

    // Make popup draggable
    const header = floatingPopup.querySelector('#furigana-popup-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on controls
        if (e.target.closest('#furigana-popup-controls')) {
            return;
        }

        isDragging = true;
        initialX = e.clientX - (floatingPopup.offsetLeft || 0);
        initialY = e.clientY - (floatingPopup.offsetTop || 0);

        // Disable transition during drag
        floatingPopup.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            floatingPopup.style.left = currentX + 'px';
            floatingPopup.style.top = currentY + 'px';
            floatingPopup.style.transform = 'none';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // Re-enable transition
            floatingPopup.style.transition = 'opacity 0.3s, transform 0.3s';
        }
    });

    // Close button only
    const closeBtn = floatingPopup.querySelector('#furigana-popup-close');
    closeBtn.addEventListener('click', hideFloatingPopup);
};

const showFuriganaPopup = async (text) => {
    if (!floatingPopup) createFloatingPopup();

    await init();

    // Get current settings
    chrome.storage.sync.get(['mode', 'fontSize', 'displayMode', 'englishMode'], async (result) => {
        const settings = result;

        try {
            let convertedHTML = '';

            // Check if text contains Japanese
            if (/[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
                const converted = await kuroshiro.convert(text, {
                    to: settings.mode || 'hiragana',
                    mode: 'furigana'
                });
                convertedHTML = converted;
            }
            // Check if text contains English
            else if (settings.englishMode && /[a-zA-Z]/.test(text)) {
                const words = text.split(/\s+/);
                const parts = [];

                words.forEach(word => {
                    if (/^[a-zA-Z]+$/.test(word)) {
                        const lower = word.toLowerCase();
                        const phones = phonesForWord(lower);

                        if (phones) {
                            const katakana = arpabetToKatakana(phones);
                            if (katakana) {
                                parts.push(`<ruby>${word}<rt>${katakana}</rt></ruby>`);
                            } else {
                                parts.push(word);
                            }
                        } else {
                            const fallback = simpleFallback(lower);
                            if (fallback) {
                                parts.push(`<ruby>${word}<rt>${fallback}</rt></ruby>`);
                            } else {
                                parts.push(word);
                            }
                        }
                    } else {
                        parts.push(word);
                    }
                });

                convertedHTML = parts.join(' ');
            } else {
                convertedHTML = text;
            }

            // Update popup content
            const content = floatingPopup.querySelector('#furigana-popup-content');
            content.innerHTML = convertedHTML;

            // Position popup in center of viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            floatingPopup.style.left = '50%';
            floatingPopup.style.top = '50%';
            floatingPopup.style.transform = 'translate(-50%, -50%) scale(0.9)';

            // Show popup
            setTimeout(() => {
                floatingPopup.classList.add('show');
                floatingPopup.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);

        } catch (e) {
            console.error('Furigana Extension: Error showing popup', e);
        }
    });
};

const hideFloatingPopup = () => {
    if (floatingPopup) {
        floatingPopup.classList.remove('show');
    }
};

const showFloatingButton = (x, y) => {
    if (!floatingButton) createFloatingButton();

    floatingButton.style.left = `${x}px`;
    floatingButton.style.top = `${y}px`;

    // Force reflow
    void floatingButton.offsetHeight;

    floatingButton.classList.add('show');
    console.log('Furigana Extension: Button shown at', x, y);
};

const hideFloatingButton = () => {
    if (floatingButton) {
        floatingButton.classList.remove('show');
    }
    currentSelection = null;
    currentSelectionText = '';
};

const addFuriganaToSelection = async (selection) => {
    // This function is no longer used - we show popup instead
    // Keeping it for backward compatibility
};

// Listen for text selection
document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0) {
            // Check if selection contains Japanese or English
            const hasJapanese = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(selectedText);
            const hasEnglish = /[a-zA-Z]/.test(selectedText);

            if (hasJapanese || hasEnglish) {
                currentSelection = selection;
                currentSelectionText = selectedText;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // Position button near selection
                const x = rect.left + rect.width / 2 - 22;
                const y = rect.top - 50;

                showFloatingButton(x, y);
            }
        } else {
            hideFloatingButton();
        }
    }, 10);
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', (e) => {
    if (floatingButton && !floatingButton.contains(e.target)) {
        hideFloatingButton();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && floatingPopup && floatingPopup.classList.contains('show')) {
        hideFloatingPopup();
    }
});
