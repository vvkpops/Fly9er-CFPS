// src/utils/parsers/imageParser.js

import { CORS_PROXY } from '../constants/apiEndpoints.js';

/**
 * Enhanced image parser with better error handling and URL construction
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
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    console.log('🔍 [ImageParser] Processing data array with', data.data.length, 'items');
    
    try {
      const images = [];
      
      for (const item of data.data) {
        console.log('🔍 [ImageParser] Processing data item:', item);
        
        if (item.text) {
          let parsedText;
          
          if (typeof item.text === 'string') {
            try {
              parsedText = JSON.parse(item.text);
              console.log('✅ [ImageParser] Parsed text as JSON:', parsedText);
            } catch (e) {
              console.warn('⚠️ [ImageParser] Failed to parse text field as JSON:', e.message);
              continue;
            }
          } else if (typeof item.text === 'object') {
            parsedText = item.text;
          } else {
            continue;
          }

          // Handle NAV Canada frame_lists format
          if (parsedText?.frame_lists && Array.isArray(parsedText.frame_lists)) {
            console.log('🔍 [ImageParser] Processing frame_lists with', parsedText.frame_lists.length, 'frames');
            
            for (const frameList of parsedText.frame_lists) {
              if (frameList.frames && Array.isArray(frameList.frames)) {
                for (const frame of frameList.frames) {
                  if (frame.images && Array.isArray(frame.images)) {
                    for (const img of frame.images) {
                      if (img.id) {
                        // Construct NAV Canada image URL
                        const imageUrl = `https://plan.navcanada.ca/weather/images/${img.id}.image`;
                        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(imageUrl)}`;
                        
                        images.push({
                          url: imageUrl,
                          proxy_url: proxyUrl,
                          period: frame.sv || frameList.sv || '',
                          content_type: 'image/gif',
                          product: parsedText.product || '',
                          geography: parsedText.geography || '',
                          frame_info: {
                            start_validity: frame.sv || frameList.sv,
                            end_validity: frame.ev || frameList.ev,
                            created: img.created
                          },
                          metadata: {
                            image_id: img.id,
                            original: item,
                            parsedText,
                            source: 'nav_canada_api'
                          }
                        });
                        console.log('✅ [ImageParser] Added NAV Canada image:', imageUrl);
                      }
                    }
                  }
                }
              }
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
      return { images: [], error: `Failed to parse image data: ${e.message}` };
    }
  }

  // Case 3: Handle empty data arrays gracefully
  if (data.data && Array.isArray(data.data) && data.data.length === 0) {
    console.log('ℹ️ [ImageParser] Empty data array - no images available');
    return { images: [], error: null };
  }

  // Fallback: Log unhandled structure
  console.warn('⚠️ [ImageParser] Unsupported data structure:', {
    type: typeof data,
    keys: typeof data === 'object' ? Object.keys(data) : 'N/A'
  });

  return { 
    images: [], 
    error: 'Unsupported image data structure.',
    debug: {
      dataType: typeof data,
      keys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
      hasData: !!data?.data,
      dataArrayLength: Array.isArray(data?.data) ? data.data.length : 'not array'
    }
  };
}

/**
 * Enhanced image data with better fallback handling
 */
export function enhanceImageData(images) {
  return images.map(img => {
    const enhanced = { ...img };
    
    // Ensure we have a proper proxy URL
    if (img.url && !img.proxy_url) {
      enhanced.proxy_url = `${CORS_PROXY}${encodeURIComponent(img.url)}`;
    }
    
    // Create fallback URLs for different scenarios
    enhanced.fallback_urls = [
      enhanced.proxy_url,
      // Direct URL (without proxy) for testing
      img.url
    ].filter(Boolean);
    
    // Add debugging info
    enhanced.debug_info = {
      original_url: img.url,
      proxy_url: enhanced.proxy_url,
      image_id: img.metadata?.image_id || 'unknown'
    };
    
    return enhanced;
  });
}