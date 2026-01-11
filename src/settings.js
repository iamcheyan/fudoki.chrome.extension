document.addEventListener('DOMContentLoaded', () => {
    const globalAutoModeCheckbox = document.getElementById('globalAutoMode');
    const alwaysList = document.getElementById('alwaysList');
    const neverList = document.getElementById('neverList');
    const alwaysCount = document.getElementById('alwaysCount');
    const neverCount = document.getElementById('neverCount');

    // Load settings
    const loadSettings = () => {
        chrome.storage.sync.get(['globalAutoMode', 'sitePreferences'], (result) => {
            // Global setting
            if (result.globalAutoMode) {
                globalAutoModeCheckbox.checked = true;
            }

            // Site preferences
            const prefs = result.sitePreferences || {};
            renderSiteLists(prefs);
        });
    };

    // Render site lists
    const renderSiteLists = (prefs) => {
        const alwaysSites = [];
        const neverSites = [];

        Object.entries(prefs).forEach(([domain, preference]) => {
            if (preference === 'always') {
                alwaysSites.push(domain);
            } else if (preference === 'never') {
                neverSites.push(domain);
            }
        });

        // Update counts
        alwaysCount.textContent = alwaysSites.length;
        neverCount.textContent = neverSites.length;

        // Render always list
        if (alwaysSites.length === 0) {
            alwaysList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✓</div>
          <div class="empty-state-text">No sites configured to always enable</div>
        </div>
      `;
        } else {
            alwaysList.innerHTML = alwaysSites.map(domain => `
        <div class="site-item">
          <span class="site-domain">${domain}</span>
          <div class="site-actions">
            <span class="site-status status-always">Always</span>
            <button class="remove-btn" data-domain="${domain}">Remove</button>
          </div>
        </div>
      `).join('');
        }

        // Render never list
        if (neverSites.length === 0) {
            neverList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✕</div>
          <div class="empty-state-text">No sites configured to never enable</div>
        </div>
      `;
        } else {
            neverList.innerHTML = neverSites.map(domain => `
        <div class="site-item">
          <span class="site-domain">${domain}</span>
          <div class="site-actions">
            <span class="site-status status-never">Never</span>
            <button class="remove-btn" data-domain="${domain}">Remove</button>
          </div>
        </div>
      `).join('');
        }

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const domain = btn.dataset.domain;
                removeSite(domain);
            });
        });
    };

    // Remove site preference
    const removeSite = (domain) => {
        chrome.storage.sync.get(['sitePreferences'], (result) => {
            const prefs = result.sitePreferences || {};
            delete prefs[domain];

            chrome.storage.sync.set({ sitePreferences: prefs }, () => {
                loadSettings();
            });
        });
    };

    // Save global setting
    globalAutoModeCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ globalAutoMode: globalAutoModeCheckbox.checked });
    });

    // Initial load
    loadSettings();
});
