document.addEventListener('DOMContentLoaded', () => {
  const hiraganaRadio = document.querySelector('input[value="hiragana"]');
  const katakanaRadio = document.querySelector('input[value="katakana"]');
  const fontSizeInput = document.getElementById('fontSize');
  const fontSizeVal = document.getElementById('fontSizeVal');
  const englishModeCheckbox = document.getElementById('englishMode');
  const sitePreferenceSelect = document.getElementById('sitePreference');
  const currentSiteSpan = document.getElementById('currentSite');
  const settingsBtn = document.getElementById('settingsBtn');
  const applyBtn = document.getElementById('applyBtn');

  let currentDomain = '';

  // Get current tab domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      currentDomain = url.hostname;
      currentSiteSpan.textContent = `Current site: ${currentDomain}`;

      // Load site preference
      loadSitePreference();
    }
  });

  // Load saved settings
  chrome.storage.sync.get(['mode', 'fontSize', 'englishMode'], (result) => {
    if (result.mode === 'katakana') {
      katakanaRadio.checked = true;
    } else {
      hiraganaRadio.checked = true;
    }

    if (result.fontSize) {
      fontSizeInput.value = result.fontSize;
      fontSizeVal.textContent = result.fontSize + '%';
    }



    if (result.englishMode) {
      englishModeCheckbox.checked = true;
    }
  });

  // Load site preference
  const loadSitePreference = () => {
    chrome.storage.sync.get(['sitePreferences'], (result) => {
      const prefs = result.sitePreferences || {};
      const sitePref = prefs[currentDomain] || 'default';
      sitePreferenceSelect.value = sitePref;
    });
  };

  // Update slider value display
  fontSizeInput.addEventListener('input', () => {
    fontSizeVal.textContent = fontSizeInput.value + '%';
  });

  // Save site preference when changed
  sitePreferenceSelect.addEventListener('change', () => {
    chrome.storage.sync.get(['sitePreferences'], (result) => {
      const prefs = result.sitePreferences || {};

      if (sitePreferenceSelect.value === 'default') {
        delete prefs[currentDomain];
      } else {
        prefs[currentDomain] = sitePreferenceSelect.value;
      }

      chrome.storage.sync.set({ sitePreferences: prefs });
    });
  });

  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'settings.html' });
  });

  // Apply button
  applyBtn.addEventListener('click', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const fontSize = fontSizeInput.value;
    const englishMode = englishModeCheckbox.checked;

    const settings = { mode, fontSize, displayMode: 'always', englishMode };

    chrome.storage.sync.set(settings, () => {
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateFurigana',
            settings: settings
          });
        }
      });
    });
  });
});
