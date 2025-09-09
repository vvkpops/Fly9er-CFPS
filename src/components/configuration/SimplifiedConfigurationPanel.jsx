// src/components/configuration/SimplifiedConfigurationPanel.jsx

import React from 'react';
import { ChevronDown, ChevronRight, Settings, RefreshCw } from 'lucide-react';
import { alphaOptions, imageCategories } from '../../utils/constants/dataTypes.js';

const SimplifiedConfigurationPanel = ({ 
  config, 
  setConfig, 
  selectedData, 
  setSelectedData,
  isExpanded, 
  setExpanded, 
  onFetch, 
  isLoading,
  lastUpdate 
}) => {
  const essentialAlpha = alphaOptions.filter(opt => opt.essential).map(opt => opt.value);
  const essentialImage = Object.values(imageCategories).flat().filter(opt => opt.essential).map(opt => opt.value);
  const allAlpha = alphaOptions.map(opt => opt.value);
  const allImage = Object.values(imageCategories).flat().map(opt => opt.value);

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b rounded-t-xl"
        onClick={() => setExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
            <span className="hidden sm:inline text-sm text-gray-500">
              ({config.primarySite} + {config.additionalSites.length} more)
            </span>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="hidden md:inline text-sm text-gray-500">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFetch();
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Fetch Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-gray-50/50 rounded-b-xl">
          {/* Site Configuration */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Site Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Site</label>
                <input
                  type="text"
                  value={config.primarySite}
                  onChange={(e) => setConfig({...config, primarySite: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CYYT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Sites (comma-separated)</label>
                <input
                  type="text"
                  value={config.additionalSites.join(',')}
                  onChange={(e) => setConfig({
                    ...config, 
                    additionalSites: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CYUL,CYVR,CYYZ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Delay (ms)</label>
                <input
                  type="number"
                  value={config.requestDelay}
                  onChange={(e) => setConfig({...config, requestDelay: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="100" max="5000" step="50"
                />
              </div>
            </div>
          </div>

          {/* Data Selection Summary & Controls */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Data Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-800 mb-2">Text Reports ({selectedData.alpha.length} selected)</h4>
                <div className="text-xs text-green-700 flex flex-wrap gap-1">
                  {selectedData.alpha.map(item => (
                    <span key={item} className="bg-green-100 px-2 py-0.5 rounded-full">
                      {item.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Weather Images ({selectedData.image.length} selected)</h4>
                <div className="text-xs text-purple-700 flex flex-wrap gap-1">
                  {selectedData.image.map(item => (
                    <span key={item} className="bg-purple-100 px-2 py-0.5 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedData({ alpha: essentialAlpha, image: essentialImage })}
                className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
              >
                ⭐ Essentials Only
              </button>
              <button
                onClick={() => setSelectedData({ alpha: allAlpha, image: allImage })}
                className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
              >
                ✅ Select All
              </button>
              <button
                onClick={() => setSelectedData({ alpha: [], image: [] })}
                className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
              >
                ❌ Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedConfigurationPanel;