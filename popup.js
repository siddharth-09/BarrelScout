/**
 * Bottle Scraper Extension - Compares product prices with Baxus listings
 * 
 * This extension scrapes product information from the active tab,
 * fetches comparable products from Baxus API, and displays price comparisons.
 */

// Constants for configuration
const CONFIG = {
  API_URL: "https://services.baxus.co/api/search/listings?from=0&size=1480&listed=true",
  PRODUCT_URL_BASE: "https://www.baxus.co/asset/",
  MINIMUM_MATCH_PERCENTAGE: 0.7,
  MAX_KEYWORDS: 5
};

// Common price selectors used across different e-commerce platforms
const PRICE_SELECTORS = [
  '.product-price', '.price', '.current-price', '[itemprop="price"]',
  '.price-value', '.sale-price', '.product__price', 
  'span:contains("$")', '.product-main-price', '.offer-price',
  '.product-info-price', '.product-price-container', '.a-price .a-offscreen'
];

/**
 * Scrape product data from the active tab
 * @param {number} tabId - Active tab ID
 * @returns {Promise<Object>} Product name and price
 */
async function scrapeProductData(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (selectors) => {
      // Get product name from H1
      const h1Tag = document.querySelector("h1");
      const productName = h1Tag ? h1Tag.textContent.trim() : "";
      
      // Extract price using various selectors
      let price = null;
      
      for (const selector of selectors) {
        try {
          const priceElement = document.querySelector(selector);
          if (priceElement) {
            const priceText = priceElement.textContent.trim();
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              price = parseFloat(priceMatch[0].replace(/,/g, ''));
              break;
            }
          }
        } catch (err) {
          console.debug(`Error with selector ${selector}:`, err);
        }
      }
      
      return { productName, currentPrice: price };
    },
    args: [PRICE_SELECTORS]
  });
  
  return results[0].result;
}

/**
 * Normalize product name for better matching
 * @param {string} name - Raw product name
 * @returns {string} Cleaned product name
 */
function normalizeProductName(name) {
  return name
    .replace(/[-_]/g, " ")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
  return price !== null ? `$${price.toFixed(2)}` : 'N/A';
}

/**
 * Create savings element based on price difference
 * @param {number} currentPrice - Current product price
 * @param {number} baxusPrice - Baxus listing price
 * @returns {HTMLElement} Formatted savings element
 */
function createSavingsElement(currentPrice, baxusPrice) {
  const savings = currentPrice - baxusPrice;
  const savingsPercentage = (savings / currentPrice) * 100;
  const savingsElement = document.createElement("div");
  savingsElement.classList.add("savings");
  
  if (savings > 0) {
    // Positive savings
    savingsElement.classList.add("positive-savings");
    savingsElement.innerHTML = `Save <strong>${formatPrice(savings)}</strong> (${Math.abs(savingsPercentage).toFixed(0)}%)`;
  } else if (savings < 0) {
    // Negative savings (more expensive)
    savingsElement.classList.add("negative-savings");
    savingsElement.innerHTML = `<strong>${formatPrice(Math.abs(savings))}</strong> more expensive (${Math.abs(savingsPercentage).toFixed(0)}%)`;
  } else {
    // Same price
    savingsElement.textContent = `Same price`;
  }
  
  return savingsElement;
}

/**
 * Filter listings to find matching products
 * @param {Array} listings - Product listings from API
 * @param {Array} keywords - Keywords from current product name
 * @returns {Array} Filtered matching products
 */
function findMatchingProducts(listings, keywords) {
  const list = listings.map(item => ({
    id: item._id,
    name: item._source.name.toLowerCase(),
    price: item._source.price,
    image: item._source.imageUrl,
  }));
  
  const sortedList = list.sort((a, b) => a.name.localeCompare(b.name));
  
  return sortedList.filter(item => {
    const itemWords = item.name.split(" ");
    const matchedWords = keywords.filter(kw => {
      return itemWords.some(itemWord => itemWord.includes(kw));
    });
    return matchedWords.length >= Math.ceil(keywords.length * CONFIG.MINIMUM_MATCH_PERCENTAGE);
  });
}

/**
 * Create and append result item to container
 * @param {Object} item - Product item data
 * @param {number|null} currentPrice - Current product price for comparison
 * @param {HTMLElement} container - Container to append result to
 */
function createResultItem(item, currentPrice, container) {
  const resultElement = document.createElement("div");
  resultElement.classList.add("resultItem");

  // Add product image
  const productImage = document.createElement("img");
  productImage.src = item.image || "default_image_url.jpg";
  productImage.classList.add("resultImage");
  productImage.alt = item.name;
  productImage.onerror = () => { productImage.src = "default_image_url.jpg"; };

  // Add product details
  const resultDetails = document.createElement("div");
  resultDetails.classList.add("resultDetails");

  const productName = document.createElement("strong");
  productName.textContent = item.name;

  const productPrice = document.createElement("div");
  productPrice.classList.add("baxusPrice");
  productPrice.textContent = formatPrice(item.price);
  
  // Add price comparison and savings if current price is available
  if (currentPrice) {
    resultDetails.appendChild(createSavingsElement(currentPrice, item.price));
  }

  const resultLink = document.createElement("a");
  resultLink.href = `${CONFIG.PRODUCT_URL_BASE}${item.id}`;
  resultLink.classList.add("baxusLink");
  resultLink.textContent = "View Product";
  resultLink.target = "_blank";

  // Append the elements to the result container
  resultDetails.appendChild(productName);
  resultDetails.appendChild(productPrice);
  resultDetails.appendChild(resultLink);

  resultElement.appendChild(productImage);
  resultElement.appendChild(resultDetails);

  container.appendChild(resultElement);
}

/**
 * Update UI with loading state
 * @param {boolean} isLoading - Whether the app is in loading state
 */
function updateLoadingState(isLoading) {
  const button = document.getElementById("fetchUrlButton");
  
  if (isLoading) {
    button.disabled = true;
    button.textContent = "Loading...";
    document.getElementById("urlDisplay").textContent = "Searching products...";
  } else {
    button.disabled = false;
    button.textContent = "Compare Prices";
  }
}

/**
 * Main function to handle button click
 */
document.getElementById("fetchUrlButton").addEventListener("click", async () => {
  try {
    updateLoadingState(true);
    
    // Get active tab information
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    // Scrape data from active page
    const pageData = await scrapeProductData(tab.id);
    
    // Check if product name was found
    if (!pageData.productName || pageData.productName === "") {
      throw new Error("No product name found in h1 tag!");
    }

    // Process product name and price
    const pdname = normalizeProductName(pageData.productName);
    const currentPrice = pageData.currentPrice;
    
    // Update UI with product info
    document.getElementById("urlDisplay").textContent = `Searching for: ${pdname}`;
    if (currentPrice) {
      document.getElementById("urlDisplay").textContent += ` | Current price: ${formatPrice(currentPrice)}`;
    }

    // Extract keywords for search
    const keywords = pdname.toLowerCase().split(" ").slice(0, CONFIG.MAX_KEYWORDS);

    // Fetch Baxus listings
    const response = await fetch(CONFIG.API_URL);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const listings = await response.json();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results

    // Find matching products
    const matchingProducts = findMatchingProducts(listings, keywords);

    // Display results
    if (matchingProducts.length === 0) {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.textContent = "No similar products found.";
      resultsContainer.appendChild(noResultsMessage);
    } else {
      // Display comparison header if current price was found
      if (currentPrice) {
        const comparisonHeader = document.createElement("div");
        comparisonHeader.classList.add("comparison-header");
        comparisonHeader.innerHTML = `<h3>Price Comparison</h3>`;
        resultsContainer.appendChild(comparisonHeader);
      }
      
      // Create result items
      matchingProducts.forEach(item => {
        createResultItem(item, currentPrice, resultsContainer);
      });
    }

  } catch (error) {
    console.error("Extension Error:", error);
    document.getElementById("results").innerHTML = `
      <div class="error-message">
        <p>Error: ${error.message}</p>
      </div>
    `;
  } finally {
    updateLoadingState(false);
  }
});