// Add a flag to window object to track if we've already collected data
if (!window._hasCollectedData) {
    window._hasCollectedData = false;
}

// Keep track of collection status
let isCollecting = false;

// Keep track of the last collection ID
let lastCollectionId = null;

function getFileType(url) {
    const lowercaseUrl = url.toLowerCase();
    
    // Define file type patterns
    const fileTypes = {
        document: ['.pdf', '.doc', '.docx'],
        presentation: ['.ppt', '.pptx'],
        spreadsheet: ['.xls', '.xlsx'],
        archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        media: ['.mp4', '.mp3', '.wav'],
        other: ['.txt', '.csv', '.json', '.xml']
    };

    for (const [type, extensions] of Object.entries(fileTypes)) {
        if (extensions.some(ext => lowercaseUrl.endsWith(ext))) {
            return type;
        }
    }
    
    return 'webpage';
}

async function waitForElements(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            return elements;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return [];
}

function collectPageData(collectionId) {
    try {
        // Get all links
        const allLinks = Array.from(document.getElementsByTagName('a'));
        
        // Filter and process URLs
        const validUrls = allLinks
            .map(link => link.href)
            .filter(url => {
                try {
                    if (!url || !url.startsWith('http')) return false;
                    
                    const linkDomain = new URL(url).hostname;
                    const currentDomain = window.location.hostname;
                    
                    // Only process URLs from same domain that aren't anchors
                    return linkDomain === currentDomain && !url.includes('#');
                } catch (e) {
                    console.log('Error processing URL:', e);
                    return false;
                }
            });

        console.log(`Found ${validUrls.length} valid URLs:`, validUrls);

        // Send URLs to background script for processing
        chrome.runtime.sendMessage({
            action: "processUrls",
            urls: validUrls,
            collectionId: collectionId
        });

        // Collect page data
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            textContent: document.body.innerText,
            links: allLinks.map(link => ({
                text: link.innerText,
                href: link.href
            }))
        };

        // Send page data to background script
        chrome.runtime.sendMessage({
            action: "indexPage",
            data: pageData,
            collectionId: collectionId
        });

    } catch (error) {
        console.error('Error collecting page data:', error);
        chrome.runtime.sendMessage({
            action: "indexPage",
            data: { url: window.location.href, error: error.message },
            collectionId: collectionId
        });
    }
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "collectData") {
        collectPageData(request.collectionId);
    }
});
