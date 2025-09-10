// src/utils/parsers/imageParser.js

import { CORS_PROXY } from '../constants/apiEndpoints.js';

/**
 * Normalizes different image data structures into a consistent format.
 * The goal is to always return an object with an `images` array.
 * Each object in the `images` array should have a `url` or `proxy_url`.
 *
 * Handles:
 *  - Direct GFA image arrays from fallback fetcher.
 *  - API responses containing a `data` array with `text` field (which is a JSON string).
 *  - API responses where the root object contains `frame_lists` or image URLs.
 *  - Raw image URLs returned directly.
 */
export function parseImageData(data) {
  if (!data) {
    return { images: [], error: 'No data provided to parser.' };
  }

  // Case 1: Data is already in our desired format (e.g., from direct GFA fetch)
  if (Array.isArray(data.images)) {
    return data;
  }

  // Case 2: The API returns a `data` array where each element's `text` field is a JSON string of image info.
  // This is common for RADAR and SATELLITE imagery.
  if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].text) {
    try {
      const images = data.data.flatMap(item => {
        if (typeof item.text === 'string') {
          const parsedText = JSON.parse(item.text);
          // The parsed text can be an array of image objects or a single object
          const imageEntries = Array.isArray(parsedText) ? parsedText : [parsedText];
          return imageEntries.map(img => ({
            url: img.url,
            proxy_url: `${CORS_PROXY}${encodeURIComponent(img.url)}`,
            period: img.valid_time || img.time || '',
            content_type: 'image/gif' // Assumption
          }));
        }
        return [];
      });
      if (images.length > 0) {
        return { images };
      }
    } catch (e) {
      return { images: [], error: `Failed to parse image data from 'text' field: ${e.message}` };
    }
  }

  // Case 3: The data object itself contains image URLs or frame lists (another GFA format)
  // This part can be expanded as we discover more formats.
  if (data.url || data.proxy_url) {
     return { images: [data] };
  }

  // Fallback: If no other structure is matched, return an error.
  return { images: [], error: 'Unsupported image data structure encountered.' };
}