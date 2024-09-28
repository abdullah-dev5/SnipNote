chrome.runtime.onInstalled.addListener(() => {
    console.log('SnipNote extension installed.');
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveNote') {
        chrome.storage.local.set({ note: message.note }, () => {
            console.log('Note saved:', message.note);
            sendResponse({ status: 'success' });
        });
        return true;
    }
});
