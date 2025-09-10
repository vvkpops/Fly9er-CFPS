// src/services/api/weatherApi.js

import { BASE_API_URL, CORS_PROXY, IMAGE_BASE_URLS, GFA_TIME_PERIODS } from '../../utils/constants/apiEndpoints';

const fetchWithTimeout = async (url, options = {}, timeout = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal  
    });
    
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const fetchData = async (params) => {
  const fullUrl = `${BASE_API_URL}?${params.toString()}`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(fullUrl)}`;

  console.log('🌐 [WeatherAPI] Fetching:', fullUrl);
  console.log('🔗 [WeatherAPI] Proxy URL:', proxyUrl);

  try {
    const response = await fetchWithTimeout(proxyUrl);

    if (!response.ok) {
      console.warn(`⚠️ [WeatherAPI] HTTP ${response.status} for ${fullUrl}`);
      if (response.status === 404) {
        return { error: `Data not available (404 Not Found)`, status: 404 };
      }
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log('📥 [WeatherAPI] Response length:', text.length, 'chars');
    
    if (!text) {
      return { error: 'No data returned from API.', status: response.status };
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log('✅ [WeatherAPI] Successfully parsed JSON response');
      return parsed;
    } catch (e) {
      console.log('📝 [WeatherAPI] Non-JSON response, returning as raw text');
      return { raw: text };
    }

  } catch (error) {
    console.error('❌ [WeatherAPI] Fetch error:', error.message);
    return { error: error.message || 'A network error occurred' };
  }
};

export const fetchIndividualAlpha = (site, alpha) => {
  const params = new URLSearchParams({
    site,
    alpha,
    notam_choice: 'default',
    _: Date.now(),
  });
  return fetchData(params);
};

export const fetchIndividualImage = async (site, image) => {
  const params = new URLSearchParams({
    site,
    image,
    _: Date.now(),
  });
  
  console.log(`🖼️ [WeatherAPI] Fetching image data for ${site}/${image}`);
  const result = await fetchData(params);
  
  // Enhanced logging for image data
  if (result && !result.error) {
    console.log('🖼️ [WeatherAPI] Image data structure:', {
      hasData: !!result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
      hasImages: !!result.images,
      imagesLength: Array.isArray(result.images) ? result.images.length : 'not array',
      keys: Object.keys(result)
    });
  }
  
  return result;
};

export const fetchIndividualGFA = async (site, gfaRegion, gfaType) => {
  console.log(`🗺️ [WeatherAPI] Fetching GFA data for ${gfaRegion}/${gfaType}`);
  
  // First, try the API endpoint for GFA JSON data
  const gfaProduct = gfaType.split('/')[1];
  const params = new URLSearchParams({
    site,
    image: `GFA/${gfaRegion}/${gfaProduct}`,
    _: Date.now(),
  });

  const apiResult = await fetchData(params);

  // Check if the API returns usable data
  if (apiResult && !apiResult.error) {
    console.log('✅ [WeatherAPI] GFA API returned data');
    
    // Enhanced check for valid GFA data
    if (apiResult.data?.[0]?.text?.includes('frame_lists') || 
        (Array.isArray(apiResult.data) && apiResult.data.length > 0)) {
      console.log('✅ [WeatherAPI] GFA data appears valid');
      return apiResult;
    }
  }

  console.log('🔄 [WeatherAPI] Falling back to direct GFA image fetching');
  return fetchDirectGFAImages(site, gfaRegion, gfaProduct);
};

const fetchDirectGFAImages = async (site, gfaRegion, gfaProduct) => {
  const product = gfaProduct.toLowerCase();
  const region = gfaRegion.toLowerCase();
  
  console.log(`📡 [WeatherAPI] Direct GFA fetch for ${region}_${product}`);
  
  const imageData = {
    type: 'direct_gfa_images',
    gfa_region: gfaRegion,
    site,
    product: product,
    images: [],
    error: null,
  };

  const imageUrls = GFA_TIME_PERIODS.map(period => ({
    period,
    url: `${IMAGE_BASE_URLS.flightPlanning}${region}_${product}_${period}.gif`,
    proxy_url: `${CORS_PROXY}${encodeURIComponent(`${IMAGE_BASE_URLS.flightPlanning}${region}_${product}_${period}.gif`)}`
  }));

  console.log('🔍 [WeatherAPI] Testing', imageUrls.length, 'GFA image URLs');

  const imagePromises = imageUrls.map(async (img) => {
    try {
      console.log('🧪 [WeatherAPI] Testing image:', img.url);
      const response = await fetchWithTimeout(img.proxy_url, { method: 'HEAD' }, 8000);
      if (response.ok) {
        console.log('✅ [WeatherAPI] Image available:', img.url);
        return { 
          ...img, 
          content_type: response.headers.get('content-type'),
          verified: true
        };
      } else {
        console.log('❌ [WeatherAPI] Image not available:', img.url, response.status);
        return null;
      }
    } catch (error) {
      console.log('❌ [WeatherAPI] Image test failed:', img.url, error.message);
      return null;
    }
  });

  const results = await Promise.allSettled(imagePromises);
  imageData.images = results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);

  console.log(`📊 [WeatherAPI] Direct GFA result: ${imageData.images.length}/${imageUrls.length} images found`);

  if (imageData.images.length === 0) {
    imageData.error = `No direct GFA images found for ${gfaRegion}/${product}.`;
  }
  
  return imageData;
};

// Enhanced error handling and retry mechanism
export const fetchWithRetry = async (fetchFunction, maxRetries = 2, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fetchFunction();
      if (!result.error) {
        return result;
      }
      
      if (attempt <= maxRetries) {
        console.log(`🔄 [WeatherAPI] Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        return result; // Return the last error
      }
    } catch (error) {
      if (attempt <= maxRetries) {
        console.log(`🔄 [WeatherAPI] Retry ${attempt}/${maxRetries} due to exception:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
      } else {
        return { error: error.message };
      }
    }
  }
};