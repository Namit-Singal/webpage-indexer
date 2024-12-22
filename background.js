let isIndexing = false;
let visitedUrls = new Set();
let processingQueue = [];
let currentRunFolder = '';

function createRunFolderName() {
    const now = new Date();
    return `run_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${
        now.getDate().toString().padStart(2, '0')}_${
        now.getHours().toString().padStart(2, '0')}${
        now.getMinutes().toString().padStart(2, '0')}${
        now.getSeconds().toString().padStart(2, '0')}`;
}

function getFileTypeFolder(url) {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf':
            return 'pdfs';
        case 'doc':
        case 'docx':
            return 'docs';
        case 'xls':
        case 'xlsx':
            return 'spreadsheets';
        default:
            return 'other';
    }
}

async function downloadFile(url) {
    try {
        if (!currentRunFolder) {
            currentRunFolder = createRunFolderName();
        }

        const folder = getFileTypeFolder(url);
        const filename = `webpage_index/${currentRunFolder}/${folder}/${url.split('/').pop()}`;
        
        await chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        });
        console.log(`Downloaded ${folder} file:`, url);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}

function savePageData(data) {
    if (!currentRunFolder) {
        currentRunFolder = createRunFolderName();
    }

    const sanitizedTitle = data.title
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase()
        .slice(0, 50);
    
    const jsonString = JSON.stringify(data, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    
    chrome.downloads.download({
        url: dataUrl,
        filename: `webpage_index/${currentRunFolder}/${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.json`,
        saveAs: false
    });
}

async function processTab(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        chrome.tabs.sendMessage(tabId, { 
            action: "collectData",
            collectionId: Date.now().toString()
        });
    } catch (error) {
        console.error('Error processing tab:', error);
    }
}

async function processNextUrl() {
    if (!isIndexing || processingQueue.length === 0) {
        console.log("Indexing stopped or queue empty");
        return;
    }

    const nextUrl = processingQueue.shift();
    
    if (!nextUrl || visitedUrls.has(nextUrl)) {
        processNextUrl();
        return;
    }

    console.log(`Processing URL (${processingQueue.length + 1} remaining):`, nextUrl);
    visitedUrls.add(nextUrl);

    try {
        const tab = await chrome.tabs.create({ url: nextUrl, active: false });
        
        // Wait for page to load
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Process the page
                processTab(tab.id);
                
                // Close the tab after a delay
                setTimeout(() => {
                    chrome.tabs.remove(tab.id);
                    processNextUrl();
                }, 5000);
            }
        });
    } catch (error) {
        console.error('Error creating tab:', error);
        processNextUrl();
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processUrls" && isIndexing) {
        message.urls.forEach(url => {
            if (!visitedUrls.has(url)) {
                processingQueue.push(url);
            }
        });
        processNextUrl();
    } else if (message.action === "indexPage") {
        savePageData(message.data);
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.indexingEnabled) {
        isIndexing = changes.indexingEnabled.newValue;
        if (!isIndexing) {
            console.log("Indexing stopped");
            visitedUrls.clear();
            processingQueue = [];
            currentRunFolder = '';
        }
    }
});

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        indexingEnabled: false
    });
});

