# 🥃 BarrelScout - Price Comparison Chrome Extension

**BarrelScout** is a smart Chrome extension that helps you make better purchase decisions while shopping for whisky or wine online. It scrapes the product name and price from the current tab and compares it with listings on the [BAXUS marketplace](https://www.baxus.co/), showing you the best deals in a simple UI popup.

---

## 🚀 Features

- 🔍 **Auto-detects Product**: Extracts the name and price of the bottle from any e-commerce site.
- 🧠 **Smart Comparison**: Compares the product with BAXUS listings using a keyword-matching algorithm.
- 💸 **Shows Savings**: Displays the difference in price and savings (or loss) percentage.
- 🔗 **Direct Links**: Links you directly to the matching BAXUS product.
- 💡 **Cross-site Support**: Works on multiple e-commerce platforms with different HTML structures.

---

## 🛠️ Installation

1. Clone this repository:
   ```bash
    https://github.com/siddharth-09/BarrelScout
   ```
2. Open Chrome and navigate to:
   ```bash
   chrome://extensions/
   ```
3. Enable Developer mode (top-right corner).
4. Click on Load unpacked and select the extension directory.
5. Pin the extension and click the button while on a product page.

---

## 🧩 How It Works

### 1. Scraping Product Data
- Uses chrome.scripting.executeScript to extract:
  - Product name from the `<h1>` tag.
  - Price from a list of common selectors.

### 2. Normalizing Data
- Cleans up product name by removing symbols and extra spaces for better matching.

### 3. Fetching Listings
- Calls the BAXUS API:
```bash
https://services.baxus.co/api/search/listings?from=0&size=1480&listed=true
```
### 4. Matching Algorithm
   
  - Tokenizes product names into keywords (max 5).

  - Filters BAXUS products based on how many keywords match.

  - A match threshold of 70% (configurable) is used.
### 5. Displaying Results
  - Shows:
    - Matched product name
    
    - BAXUS price

    - Savings or cost difference

    - Product image and direct link

---

## 📦 File Overview
```bash
📂 extension/
├── popup.html        # Popup UI
├── popup.css         # Popup styling
├── popup.js          # This core logic file (bottle scraper)
├── background.js     
├── content.js     
├── icon.png     
├── manifest.json     # Chrome extension manifest
```
---

## 🔧 Configuration

The extension uses the following config constants:

```js
const CONFIG = {
  API_URL: "https://services.baxus.co/api/search/listings?from=0&size=1480&listed=true",
  PRODUCT_URL_BASE: "https://www.baxus.co/asset/",
  MINIMUM_MATCH_PERCENTAGE: 0.7, // 70% match required
  MAX_KEYWORDS: 5 // Max number of keywords used for search
};
```

---

## 🧪 Example Sites to Test
Try these sample whisky/wine e-commerce sites:

[https://wineonlinedelivery.com/]

[https://www.wine-searcher.com/]

Just click the extension while viewing a product!
You can try with any link!!

---

## 🙌 Contributing
Feel free to submit issues, improvements, or PRs!
Let’s make this tool smarter together 🍷
