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

  // Case 2: API returns data array with text field containing JSON (FIXED)
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    console.log('🔍 [ImageParser] Processing data array with', data.data.length, 'items');
    
    try {
      const images = [];
      
      for (const item of data.data) {
        console.log('🔍 [ImageParser] Processing data item:', item);
        
        if (item.text) {
          let parsedText;
          
          // Handle both string and object text fields
          if (typeof item.text === 'string') {
            try {
              parsedText = JSON.parse(item.text);
              console.log('✅ [ImageParser] Parsed text as JSON:', parsedText);
            } catch (e) {
              console.warn('⚠️ [ImageParser] Failed to parse text field as JSON:', e.message);
              // Try to treat as raw text with URLs
              const urlMatches = item.text.match(/https?:\/\/[^\s]+\.(gif|png|jpg|jpeg)/gi);
              if (urlMatches && urlMatches.length > 0) {
                for (const url of urlMatches) {
                  images.push({
                    url,
                    proxy_url: `${CORS_PROXY}${encodeURIComponent(url)}`,
                    period: item.valid_time || item.time || '',
                    content_type: 'image/' + url.split('.').pop(),
                    metadata: {
                      original: item,
                      source: 'text_url_extraction'
                    }
                  });
                }
              }
              continue;
            }
          } else if (typeof item.text === 'object') {
            parsedText = item.text;
            console.log('✅ [ImageParser] Text is already an object:', parsedText);
          } else {
            console.log('⚠️ [ImageParser] Skipping item with non-string/non-object text');
            continue;
          }

          // Handle different parsedText structures
          if (parsedText) {
            // Check if parsedText has frame_lists (common GFA/satellite format)
            if (parsedText.frame_lists && Array.isArray(parsedText.frame_lists)) {
              console.log('🔍 [ImageParser] Processing frame_lists with', parsedText.frame_lists.length, 'frames');
              
              for (const frameList of parsedText.frame_lists) {
                if (frameList.frames && Array.isArray(frameList.frames)) {
                  for (const frame of frameList.frames) {
                    if (frame.images && Array.isArray(frame.images)) {
                      for (const img of frame.images) {
                        if (img.id) {
                          // NAV Canada image format
                          const imageUrl = `https://plan.navcanada.ca/weather/images/${img.id}.image`;
                          images.push({
                            url: imageUrl,
                            proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                            period: frame.sv || frameList.sv || img.period || '',
                            content_type: 'image/gif',
                            product: parsedText.product || '',
                            frame_info: {
                              start_validity: frame.sv || frameList.sv,
                              end_validity: frame.ev || frameList.ev,
                              created: img.created
                            },
                            metadata: {
                              original: item,
                              parsedText,
                              source: 'frame_lists_nav_canada'
                            }
                          });
                          console.log('✅ [ImageParser] Added NAV Canada image:', imageUrl);
                        }
                      }
                    }
                  }
                }
                // Handle direct frame URLs (alternative format)
                else if (frameList.url || frameList.image_url) {
                  const imageUrl = frameList.url || frameList.image_url;
                  images.push({
                    url: imageUrl,
                    proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                    period: frameList.period || frameList.sv || '',
                    content_type: 'image/gif',
                    product: parsedText.product || '',
                    frame_info: {
                      start_validity: frameList.sv,
                      end_validity: frameList.ev
                    },
                    metadata: {
                      original: item,
                      parsedText,
                      source: 'frame_lists_direct_url'
                    }
                  });
                  console.log('✅ [ImageParser] Added direct frame URL:', imageUrl);
                }
              }
            }
            // Check if parsedText has a direct URL
            else if (parsedText.url || parsedText.image_url || parsedText.src) {
              const imageUrl = parsedText.url || parsedText.image_url || parsedText.src;
              images.push({
                url: imageUrl,
                proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                period: parsedText.valid_time || parsedText.time || parsedText.period || item.valid_time || '',
                content_type: parsedText.content_type || 'image/gif',
                product: parsedText.product || '',
                metadata: {
                  original: item,
                  parsedText,
                  source: 'parsed_text_direct_url'
                }
              });
              console.log('✅ [ImageParser] Added image from direct URL:', imageUrl);
            }
            // Check if parsedText is an array of image objects
            else if (Array.isArray(parsedText)) {
              for (const img of parsedText) {
                if (img && (img.url || img.image_url || img.src)) {
                  const imageUrl = img.url || img.image_url || img.src;
                  images.push({
                    url: imageUrl,
                    proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                    period: img.valid_time || img.time || img.period || '',
                    content_type: img.content_type || 'image/gif',
                    product: img.product || '',
                    metadata: {
                      original: item,
                      parsedText,
                      source: 'parsed_text_array'
                    }
                  });
                  console.log('✅ [ImageParser] Added image from array:', imageUrl);
                }
              }
            }
            // Check if parsedText has nested image data
            else if (parsedText.images && Array.isArray(parsedText.images)) {
              for (const img of parsedText.images) {
                if (img && (img.url || img.image_url || img.src)) {
                  const imageUrl = img.url || img.image_url || img.src;
                  images.push({
                    url: imageUrl,
                    proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
                    period: img.valid_time || img.time || img.period || '',
                    content_type: img.content_type || 'image/gif',
                    product: img.product || '',
                    metadata: {
                      original: item,
                      parsedText,
                      source: 'parsed_text_nested_images'
                    }
                  });
                  console.log('✅ [ImageParser] Added image from nested images:', imageUrl);
                }
              }
            }
            // Try to find URLs in stringified parsedText as last resort
            else {
              const stringified = JSON.stringify(parsedText);
              const urlMatches = stringified.match(/https?:\/\/[^\s"]+\.(gif|png|jpg|jpeg)/gi);
              if (urlMatches && urlMatches.length > 0) {
                for (const url of urlMatches) {
                  images.push({
                    url,
                    proxy_url: `${CORS_PROXY}${encodeURIComponent(url)}`,
                    period: item.valid_time || item.time || '',
                    content_type: 'image/' + url.split('.').pop(),
                    metadata: {
                      original: item,
                      parsedText,
                      source: 'parsed_text_url_search'
                    }
                  });
                  console.log('✅ [ImageParser] Added image from URL search:', url);
                }
              }
            }
          }
        }
        // If no text field, check if the item itself has image data
        else if (item.url || item.image_url || item.src) {
          const imageUrl = item.url || item.image_url || item.src;
          images.push({
            url: imageUrl,
            proxy_url: `${CORS_PROXY}${encodeURIComponent(imageUrl)}`,
            period: item.valid_time || item.time || item.period || '',
            content_type: item.content_type || 'image/gif',
            product: item.product || '',
            metadata: {
              original: item,
              source: 'direct_item_url'
            }
          });
          console.log('✅ [ImageParser] Added image from direct item:', imageUrl);
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
      structure: typeof data === 'object' ? Object.keys(data) : 'primitive',
      dataArrayLength: Array.isArray(data?.data) ? data.data.length : 'not array',
      firstDataItem: Array.isArray(data?.data) && data.data.length > 0 ? data.data[0] : null
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
