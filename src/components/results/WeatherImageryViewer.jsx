// src/components/results/WeatherImageryViewer.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Cloud, Zap, ImageOff, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { parseImageData, enhanceImageData } from '../../utils/parsers/imageParser.js';

const WeatherImageryViewer = ({ imageData, getDataStatus }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  if (!imageData || Object.keys(imageData).length === 0) {
    return (
      <div className="text-center py-12">
        <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Imagery Data</h3>
        <p className="text-gray-500">No weather imagery was requested or found for this station.</p>
      </div>
    );
  }

  // Categorize images for tab navigation
  const categories = { satellite: {}, radar: {}, gfa: {}, sigwx: {} };
  Object.entries(imageData).forEach(([key, data]) => {
    if (key.includes('SATELLITE')) categories.satellite[key] = data;
    else if (key.includes('RADAR')) categories.radar[key] = data;
    else if (key.includes('GFA')) categories.gfa[key] = data;
    else if (key.includes('SIG_WX')) categories.sigwx[key] = data;
  });

  const availableCategories = Object.entries(categories).filter(([, data]) => Object.keys(data).length > 0);

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(availableCategories[0][0]);
    } else if (availableCategories.length === 0 && selectedCategory) {
      setSelectedCategory('');
    }
  }, [availableCategories, selectedCategory]);

  const categoryIcons = { satellite: '🛰️', radar: '📡', gfa: '🗺️', sigwx: '⚡' };
  const categoryNames = { satellite: 'Satellite', radar: 'Radar', gfa: 'GFA Charts', sigwx: 'SIG WX' };

  if (availableCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Available Imagery</h3>
        <p className="text-gray-500">Could not find any images for the selected data types.</p>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 mx-auto"
        >
          <Eye className="w-4 h-4" />
          {debugMode ? 'Hide' : 'Show'} Debug Info
        </button>
        {debugMode && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <pre>{JSON.stringify(imageData, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Debug
        </button>
      </div>

      {/* Category Tabs */}
      <nav className="flex gap-2 border-b border-gray-200">
        {availableCategories.map(([category, data]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{categoryIcons[category]}</span>
            {categoryNames[category]}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCategory === category ? 'bg-white bg-opacity-20' : 'bg-gray-300'}`}>
              {Object.keys(data).length}
            </span>
          </button>
        ))}
      </nav>

      {/* Category Content */}
      <div className="space-y-4 pt-4">
        {Object.entries(categories[selectedCategory] || {}).map(([imageType, rawData]) => {
          const { Icon, text, color } = getDataStatus(rawData);
          const parsed = parseImageData(rawData);

          return (
            <div key={imageType} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <header className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">{imageType}</h4>
                  <div className={`flex items-center gap-1 font-bold text-sm ${color}`}>
                    <Icon className="w-4 h-4" />
                    <span>{text}</span>
                  </div>
                </div>
              </header>
              <div className="p-4">
                {parsed.error && !parsed.images?.length ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">
                      <div className="font-semibold">Image Parsing Error:</div>
                      <div className="text-sm mt-1">{parsed.error}</div>
                    </div>
                    
                    {debugMode && parsed.debug && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                        <div className="font-semibold text-gray-700 mb-2">Debug Information:</div>
                        <div className="text-xs space-y-1">
                          <div>Data Type: {parsed.debug.dataType}</div>
                          <div>Keys: {parsed.debug.keys.join(', ')}</div>
                          <div>Has Data Array: {parsed.debug.hasData ? 'Yes' : 'No'}</div>
                          <div>Data Array Length: {parsed.debug.dataArrayLength}</div>
                          <div>Has Images Array: {parsed.debug.hasImages ? 'Yes' : 'No'}</div>
                          <div>Has URL: {parsed.debug.hasUrl ? 'Yes' : 'No'}</div>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-gray-600">Raw Data</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(rawData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ) : parsed.images && parsed.images.length > 0 ? (
                  <ImageViewer 
                    images={enhanceImageData(parsed.images)} 
                    imageType={imageType} 
                    debugMode={debugMode}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div>No images available for this type.</div>
                    {debugMode && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-left">
                        <div className="font-semibold mb-2">Raw Data Preview:</div>
                        <pre className="overflow-auto max-h-32">
                          {JSON.stringify(rawData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ImageViewer = ({ images, imageType, debugMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gfaMode, setGfaMode] = useState('clouds');
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [fallbackIndex, setFallbackIndex] = useState({});

  const isGFA = imageType.includes('GFA');
  
  // Separate GFA images into clouds/weather and icing/turbulence
  const gfaCloudImages = isGFA ? images.filter(img => 
    img.product === 'cldwx' || 
    img.content_type?.includes('cldwx') ||
    imageType.includes('CLDWX')
  ) : [];
  
  const gfaIcingImages = isGFA ? images.filter(img => 
    img.product === 'turbc' || 
    img.content_type?.includes('turbc') ||
    imageType.includes('TURBC')
  ) : [];

  const displayImages = isGFA ? (gfaMode === 'clouds' ? gfaCloudImages : gfaIcingImages) : images;

  useEffect(() => {
    setCurrentIndex(0);
    setImageErrors({});
    setImageLoading({});
    setFallbackIndex({});
  }, [gfaMode, images]);

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 space-y-4">
        <div>
          {isGFA ? `No images available for GFA ${gfaMode} view.` : `No valid images found.`}
        </div>
        {debugMode && (
          <div className="text-xs bg-gray-50 p-3 rounded">
            <div>Total images: {images.length}</div>
            {isGFA && (
              <>
                <div>Cloud images: {gfaCloudImages.length}</div>
                <div>Icing images: {gfaIcingImages.length}</div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const currentImage = displayImages[currentIndex];
  const nextImage = () => setCurrentIndex(prev => (prev + 1) % displayImages.length);
  const prevImage = () => setCurrentIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);

  const handleImageLoad = (imageKey) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: false }));
    setImageErrors(prev => ({ ...prev, [imageKey]: false }));
  };

  const handleImageError = (imageKey, imageUrl) => {
    console.error('❌ [ImageViewer] Failed to load image:', imageUrl);
    setImageLoading(prev => ({ ...prev, [imageKey]: false }));
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  const handleImageLoadStart = (imageKey) => {
    setImageLoading(prev => ({ ...prev, [imageKey]: true }));
  };

  const tryNextFallback = (image, imageKey) => {
    const currentFallbackIndex = fallbackIndex[imageKey] || 0;
    const nextIndex = currentFallbackIndex + 1;
    
    if (image.fallback_urls && nextIndex < image.fallback_urls.length) {
      setFallbackIndex(prev => ({ ...prev, [imageKey]: nextIndex }));
      setImageErrors(prev => ({ ...prev, [imageKey]: false }));
      setImageLoading(prev => ({ ...prev, [imageKey]: true }));
      return image.fallback_urls[nextIndex];
    }
    return null;
  };

  const getCurrentImageUrl = (image, imageKey) => {
    const currentFallbackIndex = fallbackIndex[imageKey] || 0;
    if (image.fallback_urls && currentFallbackIndex < image.fallback_urls.length) {
      return image.fallback_urls[currentFallbackIndex];
    }
    return image.proxy_url || image.url;
  };

  return (
    <div className="space-y-4">
      {/* GFA Mode Toggle */}
      {isGFA && (gfaCloudImages.length > 0 || gfaIcingImages.length > 0) && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setGfaMode('clouds')}
            disabled={gfaCloudImages.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              gfaMode === 'clouds' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Cloud className="w-5 h-5" /> Clouds & WX ({gfaCloudImages.length})
          </button>
          <button
            onClick={() => setGfaMode('icing')}
            disabled={gfaIcingImages.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              gfaMode === 'icing' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Zap className="w-5 h-5" /> Icing & Turb ({gfaIcingImages.length})
          </button>
        </div>
      )}

      {/* Image Display */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative w-full max-w-4xl">
          <div className="aspect-w-4 aspect-h-3 bg-gray-900 rounded-lg border-4 border-gray-700 flex items-center justify-center overflow-hidden min-h-[400px]">
            {currentImage?.proxy_url || currentImage?.url ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {imageLoading[currentIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="flex items-center gap-3 text-white">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Loading image...</span>
                    </div>
                  </div>
                )}
                
                {imageErrors[currentIndex] ? (
                  <div className="text-center text-gray-400 p-6">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <p className="mb-2">Failed to load image</p>
                    <p className="text-sm text-gray-500 mb-4 break-all">
                      URL: {getCurrentImageUrl(currentImage, currentIndex)}
                    </p>
                    <div className="space-y-2">
                      {currentImage.fallback_urls && currentImage.fallback_urls.length > 1 && (
                        <button
                          onClick={() => {
                            const nextUrl = tryNextFallback(currentImage, currentIndex);
                            if (!nextUrl) {
                              setImageErrors(prev => ({ ...prev, [currentIndex]: false }));
                              setFallbackIndex(prev => ({ ...prev, [currentIndex]: 0 }));
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Try Alternative Source
                        </button>
                      )}
                      <a
                        href={currentImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Original
                      </a>
                    </div>
                  </div>
                ) : (
                  <img
                    key={`${currentIndex}-${fallbackIndex[currentIndex] || 0}`}
                    src={getCurrentImageUrl(currentImage, currentIndex)}
                    alt={`${imageType} - ${currentImage.period || currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => handleImageLoad(currentIndex)}
                    onError={() => handleImageError(currentIndex, getCurrentImageUrl(currentImage, currentIndex))}
                    onLoadStart={() => handleImageLoadStart(currentIndex)}
                    style={{ display: imageErrors[currentIndex] ? 'none' : 'block' }}
                  />
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>Image URL is missing</p>
                {debugMode && (
                  <div className="mt-2 text-xs bg-gray-800 p-2 rounded">
                    <pre>{JSON.stringify(currentImage, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Info Overlay */}
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg font-mono text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {currentImage.frame_info?.start_validity || currentImage.period ? 
                `${currentImage.frame_info?.start_validity || `T+${currentImage.period}H`}` : 
                `IMG ${currentIndex + 1}`
              }
            </span>
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button 
                onClick={prevImage} 
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity" 
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextImage} 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity" 
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Image Navigation Dots */}
        <div className="flex items-center justify-center gap-2">
          {displayImages.length > 1 && displayImages.map((_, index) => (
            <button 
              key={index} 
              onClick={() => setCurrentIndex(index)} 
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`} 
              aria-label={`Go to image ${index + 1}`} 
            />
          ))}
        </div>

        {/* Debug Information */}
        {debugMode && currentImage && (
          <div className="w-full max-w-4xl bg-gray-50 border rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Image Debug Info:</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium">URLs:</div>
                <div className="break-all">Original: {currentImage.url}</div>
                <div className="break-all">Proxy: {currentImage.proxy_url}</div>
                <div className="break-all">Current: {getCurrentImageUrl(currentImage, currentIndex)}</div>
              </div>
              <div>
                <div className="font-medium">Metadata:</div>
                <div>Period: {currentImage.period || 'N/A'}</div>
                <div>Type: {currentImage.content_type || 'N/A'}</div>
                <div>Product: {currentImage.product || 'N/A'}</div>
                <div>Fallback Index: {fallbackIndex[currentIndex] || 0}</div>
              </div>
            </div>
            {currentImage.frame_info && (
              <div className="mt-2">
                <div className="font-medium text-xs">Frame Info:</div>
                <div className="text-xs space-y-1">
                  <div>Start: {currentImage.frame_info.start_validity}</div>
                  <div>End: {currentImage.frame_info.end_validity}</div>
                  <div>Created: {currentImage.frame_info.created}</div>
                </div>
              </div>
            )}
            {currentImage.fallback_urls && (
              <div className="mt-2">
                <div className="font-medium text-xs">Fallback URLs:</div>
                <div className="text-xs space-y-1 max-h-20 overflow-auto">
                  {currentImage.fallback_urls.map((url, i) => (
                    <div key={i} className={`break-all ${i === (fallbackIndex[currentIndex] || 0) ? 'font-bold text-blue-600' : ''}`}>
                      {i + 1}: {url}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherImageryViewer;
