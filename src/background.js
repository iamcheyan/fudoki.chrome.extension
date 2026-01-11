// Background script to handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-furigana') {
        // Send message to active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleFurigana'
                });
            }
        });
    }
});

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'add-furigana',
        title: 'Add Furigana',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'add-furigana' && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            action: 'showFuriganaPopup',
            text: info.selectionText
        });
    }
});
