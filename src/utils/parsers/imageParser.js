// src/utils/parsers/imageParser.js

import { CORS_PROXY } from '../constants/apiEndpoints.js';

/**
 * Enhanced image parser with comprehensive debugging and error handling.
 * Normalizes different image data structures into a consistent format.
 */
export function parseImageData(data) {
  console.log('🖼️ [ImageParser] Processing data:', data);

  if (!data) {
    console.warn('⚠️ [ImageParser] No data provided');
    return { images: [], error: 'No data provided to parser.' };
  }

  // Case 1: Data is already in our desired format (direct GFA fetch)
  if (Array.isArray(data.images)) {
    console.log('✅ [ImageParser] Found direct images array:', data.images.length, 'images');
    return {
      ...data,
      images: data.images.map(img => ({
        ...img,
        proxy_url: img.proxy_url || (img.url ? `${CORS_PROXY}${encodeURIComponent(img.url)}` : null)
      }))
    };
  }

  // Case 2: API returns data array with text field containing JSON
  if (Array.isArray(data.data) && data.data.length > 0) {
    console.log('🔍 [ImageParser] Processing data array with', data.data.length, 'items');
    
    try {
      const images = [];
      
      for (const item of data.data) {
        if (item.text) {
          let parsedText;
          
          // Handle both string and object text fields
          if (typeof item.text === 'string') {
            try {
              parsedText = JSON.parse(item.text);
            } catch (e) {
              console.warn('⚠️ [ImageParser] Failed to parse text field as JSON:', e.message);
              continue;
            }
          } else if (typeof item.text === 'object') {
            parsedText = item.text;
          } else {
            continue;
          }

          // Handle both array and single object formats
          const imageEntries = Array.isArray(parsedText) ? parsedText : [parsedText];
          
          for (const img of imageEntries) {
            if (img && (img.url || img.image_url || img.src)) {
              const imageUrl = img.url || img.image_url || img.src;
              const processedImage = {
                url: imageUrl,
                proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                period: img.valid_time || img.time || img.period || '',
                content_type: img.content_type || 'image/gif',
                product: img.product || '',
                metadata: {
                  original: img,
                  source: 'api_data_array'
                }
              };
              images.push(processedImage);
              console.log('✅ [ImageParser] Added image:', imageUrl);
            }
          }
        }
      }

      if (images.length > 0) {
        console.log('✅ [ImageParser] Successfully parsed', images.length, 'images from data array');
        return { images };
      }
    } catch (e) {
      console.error('❌ [ImageParser] Error processing data array:', e);
      return { images: [], error: `Failed to parse image data from 'data' array: ${e.message}` };
    }
  }

  // Case 3: Single image object
  if (data.url || data.proxy_url || data.image_url) {
    const imageUrl = data.url || data.image_url;
    const processedImage = {
      url: imageUrl,
      proxy_url: data.proxy_url || (imageUrl ? `${CORS_PROXY}${encodeURIComponent(imageUrl)}` : null),
      period: data.period || data.time || '',
      content_type: data.content_type || 'image/gif',
      product: data.product || '',
      metadata: {
        original: data,
        source: 'single_image'
      }
    };
    console.log('✅ [ImageParser] Processing single image:', imageUrl);
    return { images: [processedImage] };
  }

  // Case 4: Check for frame_lists (GFA format)
  if (data.frame_lists || (typeof data === 'string' && data.includes('frame_lists'))) {
    console.log('🔍 [ImageParser] Processing frame_lists format');
    
    try {
      let frameData = data;
      if (typeof data === 'string') {
        frameData = JSON.parse(data);
      }

      const images = [];
      if (frameData.frame_lists && Array.isArray(frameData.frame_lists)) {
        for (const frame of frameData.frame_lists) {
          if (frame.url || frame.image_url) {
            const imageUrl = frame.url || frame.image_url;
            images.push({
              url: imageUrl,
              proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
              period: frame.period || frame.time || '',
              content_type: 'image/gif',
              product: frameData.product || '',
              metadata: {
                original: frame,
                source: 'frame_lists'
              }
            });
          }
        }
      }

      if (images.length > 0) {
        console.log('✅ [ImageParser] Successfully parsed', images.length, 'images from frame_lists');
        return { images };
      }
    } catch (e) {
      console.error('❌ [ImageParser] Error processing frame_lists:', e);
      return { images: [], error: `Failed to parse frame_lists: ${e.message}` };
    }
  }

  // Case 5: Raw text that might contain image URLs
  if (typeof data === 'string') {
    console.log('🔍 [ImageParser] Processing raw string data');
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(data);
      return parseImageData(parsed); // Recursive call with parsed data
    } catch (e) {
      // Not JSON, check for URL patterns
      const urlMatches = data.match(/https?:\/\/[^\s]+\.(gif|png|jpg|jpeg)/gi);
      if (urlMatches && urlMatches.length > 0) {
        const images = urlMatches.map((url, index) => ({
          url,
          proxy_url: `${CORS_PROXY}${encodeURIComponent(url)}`,
          period: `${index}`,
          content_type: 'image/' + url.split('.').pop(),
          metadata: {
            source: 'url_extraction'
          }
        }));
        console.log('✅ [ImageParser] Extracted', images.length, 'URLs from text');
        return { images };
      }
    }
  }

  // Fallback: Log the unhandled structure for debugging
  console.warn('⚠️ [ImageParser] Unsupported data structure:', {
    type: typeof data,
    keys: typeof data === 'object' ? Object.keys(data) : 'N/A',
    sample: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data
  });

  return { 
    images: [], 
    error: 'Unsupported image data structure encountered.',
    debug: {
      dataType: typeof data,
      keys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
      hasData: !!data?.data,
      hasImages: !!data?.images,
      hasUrl: !!(data?.url || data?.image_url),
      structure: typeof data === 'object' ? Object.keys(data) : 'primitive'
    }
  };
}

/**
 * Validates if an image URL is accessible
 */
export async function validateImageUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ [ImageParser] Image validation failed for:', imageUrl, error.message);
    return false;
  }
}

/**
 * Filters out invalid images and adds fallback URLs
 */
export function enhanceImageData(images) {
  return images.map(img => {
    const enhanced = { ...img };
    
    // Add multiple proxy options for better reliability
    if (img.url && !img.proxy_url) {
      enhanced.proxy_url = `${CORS_PROXY}${encodeURIComponent(img.url)}`;
    }
    
    // Add alternative proxy URLs
    enhanced.fallback_urls = [
      enhanced.proxy_url,
      `https://cors-anywhere.herokuapp.com/${img.url}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(img.url)}`
    ].filter(Boolean);
    
    return enhanced;
  });
}