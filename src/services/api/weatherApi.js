// src/services/api/weatherApi.js

import { BASE_API_URL, CORS_PROXY, IMAGE_BASE_URLS, GFA_TIME_PERIODS } from '../../utils/constants/apiEndpoints';

const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(url, {
    ...options,
    signal: controller.signal  
  });
  
  clearTimeout(id);
  return response;
};

const fetchData = async (params) => {
  const fullUrl = `${BASE_API_URL}?${params.toString()}`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(fullUrl)}`;

  try {
    const response = await fetchWithTimeout(proxyUrl);

    if (!response.ok) {
      // 404 is a common "not found" response, not necessarily a critical error.
      if (response.status === 404) {
        return { error: `Data not available (404 Not Found)`, status: 404 };
      }
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    // The API sometimes returns empty or non-JSON responses for valid requests that have no data.
    if (!text) {
        return { error: 'No data returned from API.', status: response.status };
    }
    
    try {
        return JSON.parse(text);
    } catch (e) {
        // Handle cases where API returns non-JSON text (e.g., for some GFA queries)
        return { raw: text };
    }

  } catch (error) {
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

export const fetchIndividualImage = (site, image) => {
  const params = new URLSearchParams({
    site,
    image,
    _: Date.now(),
  });
  return fetchData(params);
};

export const fetchIndividualGFA = async (site, gfaRegion, gfaType) => {
  // First, try the API endpoint for GFA JSON data
  const gfaProduct = gfaType.split('/')[1];
  const params = new URLSearchParams({
    site,
    image: `GFA/${gfaRegion}/${gfaProduct}`,
    _: Date.now(),
  });

  const apiResult = await fetchData(params);

  // If the API returns data with frame lists, it's good.
  if (apiResult && !apiResult.error && apiResult.data?.[0]?.text?.includes('frame_lists')) {
    return apiResult;
  }

  // If the API fails or returns no data, fall back to fetching direct image URLs
  return fetchDirectGFAImages(site, gfaRegion, gfaProduct);
};

const fetchDirectGFAImages = async (site, gfaRegion, gfaProduct) => {
  const product = gfaProduct.toLowerCase();
  const region = gfaRegion.toLowerCase();
  
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

  const imagePromises = imageUrls.map(async (img) => {
    try {
      const response = await fetchWithTimeout(img.proxy_url, { method: 'HEAD' }, 5000);
      if (response.ok) {
        return { ...img, content_type: response.headers.get('content-type') };
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(imagePromises);
  imageData.images = results.filter(Boolean);

  if (imageData.images.length === 0) {
    imageData.error = `No direct GFA images found for ${gfaRegion}/${product}.`;
  }
  
  return imageData;
};