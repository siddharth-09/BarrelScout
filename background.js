chrome.action.onClicked.addListener((tab) => {
  // Store the current tab URL using Chrome's storage API
  chrome.storage.local.set({ storedUrl: tab.url }, () => {
    console.log('URL stored:', tab.url);
  });
});
