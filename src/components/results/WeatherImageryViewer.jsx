// src/components/results/WeatherImageryViewer.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Cloud, Zap } from 'lucide-react';

const WeatherImageryViewer = ({ imageData, getDataStatus }) => {
  const [selectedCategory, setSelectedCategory] = useState('');

  if (!imageData || Object.keys(imageData).length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Imagery Data</h3>
        <p className="text-gray-500">No weather imagery was found for this station.</p>
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
    }
  }, [availableCategories, selectedCategory]);

  const categoryIcons = { satellite: '🛰️', radar: '📡', gfa: '🗺️', sigwx: '⚡' };
  const categoryNames = { satellite: 'Satellite', radar: 'Radar', gfa: 'GFA Charts', sigwx: 'SIG WX' };

  return (
    <div className="space-y-6">
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
      <div className="space-y-4">
        {Object.entries(categories[selectedCategory] || {}).map(([imageType, data]) => {
          const { Icon, text, color } = getDataStatus(data);
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
                {data?.error ? (
                  <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">Error: {data.error}</div>
                ) : data?.images && data.images.length > 0 ? (
                  <ImageViewer images={data.images} imageType={imageType} />
                ) : (
                  <div className="text-center py-8 text-gray-500">No images available for this type.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ImageViewer = ({ images, imageType }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gfaMode, setGfaMode] = useState('clouds'); // For GFA charts

  const isGFA = imageType.includes('GFA');
  
  // Separate GFA images into clouds/weather and icing/turbulence
  const gfaCloudImages = isGFA ? images.filter(img => img.product === 'cldwx' || img.content_type?.includes('cldwx')) : [];
  const gfaIcingImages = isGFA ? images.filter(img => img.product === 'turbc' || img.content_type?.includes('turbc')) : [];

  const displayImages = isGFA ? (gfaMode === 'clouds' ? gfaCloudImages : gfaIcingImages) : images;

  useEffect(() => {
    setCurrentIndex(0);
  }, [gfaMode, images]);

  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isGFA ? `No images available for GFA ${gfaMode} view.` : `No images available.`}
      </div>
    );
  }

  const currentImage = displayImages[currentIndex];
  const nextImage = () => setCurrentIndex(prev => (prev + 1) % displayImages.length);
  const prevImage = () => setCurrentIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);

  return (
    <div className="space-y-4">
      {isGFA && (gfaCloudImages.length > 0 || gfaIcingImages.length > 0) && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setGfaMode('clouds')}
            disabled={gfaCloudImages.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              gfaMode === 'clouds' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Cloud className="w-5 h-5" /> Clouds & WX
          </button>
          <button
            onClick={() => setGfaMode('icing')}
            disabled={gfaIcingImages.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              gfaMode === 'icing' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Zap className="w-5 h-5" /> Icing & Turb
          </button>
        </div>
      )}

      <div className="flex flex-col items-center space-y-3">
        <div className="relative w-full max-w-2xl">
          <div className="aspect-w-4 aspect-h-3 bg-gray-900 rounded-lg border-4 border-gray-700 flex items-center justify-center overflow-hidden">
            <img
              key={currentImage.proxy_url || currentImage.url}
              src={currentImage.proxy_url || currentImage.url}
              alt={`${imageType} - ${currentImage.period || currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg font-mono text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{currentImage.period ? `T+${currentImage.period}H` : `IMG ${currentIndex + 1}`}</span>
          </div>
          {displayImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity" aria-label="Previous image"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity" aria-label="Next image"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          {displayImages.length > 1 && displayImages.map((_, index) => (
            <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}`} aria-label={`Go to image ${index + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherImageryViewer;