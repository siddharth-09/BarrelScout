// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPrice") {
    // Try to find a price on the page
    const priceText = document.body.innerText.match(/\$\s?\d+(\.\d{1,2})?/);
    if (priceText) {
      const price = parseFloat(priceText[0].replace(/[^0-9.]/g, ""));
      sendResponse({ price });
    } else {
      sendResponse({ price: null });
    }
  }
  return true; // Needed for async response
});