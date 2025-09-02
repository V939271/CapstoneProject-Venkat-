// Specific product image mappings based on your inventory
export const specificProductImages = {
  // Electronics
  'DELL-XPS13-2024': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  'SONY-WH1000XM5': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'SAMSUNG-GS23-128': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  'APPLE-AIRPODSPRO2': 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=300&fit=crop',
  
  // Computer Accessories
  'LOGI-MX-MECH-BRN': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
  'LOGI-MXMASTER3S': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop',
  'LOGI-C920X-HD': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
  
  // Furniture
  'CHR-ERG-MESH-BLK': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
  
  // Appliances
  'KEURIG-KCLASSIC': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
  
  // Office Supplies
  'MOLESKINE-3PK-RULED': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
  
  // Lifestyle
  'HYDRO-32OZ-BLUE': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=300&fit=crop',
};

// Category-based fallbacks
export const categoryImages = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
  'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  'Appliances': 'https://images.unsplash.com/photo-1556909114-4f6e4e2d2ee0?w=400&h=300&fit=crop',
  'Office Supplies': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  'Computer Accessories': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
  'Lifestyle': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=300&fit=crop',
};

// Name-based keyword matching
export const nameKeywords = {
  'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
  'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'phone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  'chair': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
  'coffee': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
  'notebook': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
  'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
  'mouse': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop',
  'webcam': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
  'airpods': 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=300&fit=crop',
  'flask': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400&h=300&fit=crop',
};

export const getProductImage = (product) => {
  // Priority 1: Check if product has custom uploaded image
  if (product.imageUrl) {
    return product.imageUrl;
  }
  
  // Priority 2: Check specific SKU mapping
  if (product.sku && specificProductImages[product.sku]) {
    return specificProductImages[product.sku];
  }
  
  // Priority 3: Check product name keywords
  const nameKey = product.name?.toLowerCase() || '';
  for (const [keyword, imageUrl] of Object.entries(nameKeywords)) {
    if (nameKey.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Priority 4: Check category
  if (product.category && categoryImages[product.category]) {
    return categoryImages[product.category];
  }
  
  // Priority 5: Default fallback
  return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop';
};

export const getStockStatus = (product) => {
  const { quantity, lowStockThreshold = 10 } = product;
  
  if (quantity === 0) {
    return { status: 'out-of-stock', color: 'bg-red-500 text-white', text: 'Out of Stock' };
  } else if (quantity <= lowStockThreshold) {
    return { status: 'low-stock', color: 'bg-yellow-500 text-white', text: `${quantity} left` };
  } else {
    return { status: 'in-stock', color: 'bg-green-500 text-white', text: 'In Stock' };
  }
};
