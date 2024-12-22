document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
    const indexCurrentButton = document.getElementById('indexCurrentButton');
    const authButton = document.getElementById('authButton');
    
    // Get initial states
    chrome.storage.local.get(['indexingEnabled', 'waitingForAuth'], function(result) {
        const isEnabled = result.indexingEnabled || false;
        updateButtonState(isEnabled);
        
        if (result.waitingForAuth) {
            authButton.style.display = 'block';
        }
    });

    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get(['indexingEnabled'], function(result) {
            const newState = !result.indexingEnabled;
            chrome.storage.local.set({ 
                indexingEnabled: newState
            }, function() {
                updateButtonState(newState);
            });
        });
    });

    indexCurrentButton.addEventListener('click', () => {
        const collectionId = Date.now().toString();
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content.js']
                }).then(() => {
                    console.log('Content script injected successfully');
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: "collectData",
                        singlePage: true,
                        collectionId: collectionId
                    });
                }).catch((err) => {
                    console.error('Failed to inject content script:', err);
                });
            }
        });
    });

    authButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                chrome.runtime.sendMessage({ action: "authComplete" });
                authButton.style.display = 'none';
            }
        });
    });

    function updateButtonState(isEnabled) {
        toggleButton.classList.toggle('active', isEnabled);
        toggleButton.textContent = isEnabled ? 'Stop Indexing' : 'Index all pages';
    }
});
