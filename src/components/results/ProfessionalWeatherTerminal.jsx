// src/components/results/ProfessionalWeatherTerminal.jsx

import React, { useState, useEffect } from 'react';
import { 
  Radio, RefreshCw, Copy, CheckCircle, XCircle, Minus, AlertTriangle, Clock, ServerCrash, Image as ImageIcon, FileText
} from 'lucide-react';
import { parseRawAlpha } from '../../utils/parsers/alphaParsers.js';
import { regionNames } from '../../utils/constants/gfaRegions.js';
import WeatherImageryViewer from './WeatherImageryViewer.jsx';

const ProfessionalWeatherTerminal = ({ weatherData, isLoading, onRefresh, status }) => {
  const [selectedStation, setSelectedStation] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  
  const availableStations = weatherData ? Object.keys(weatherData) : [];

  useEffect(() => {
    if (availableStations.length > 0 && !availableStations.includes(selectedStation)) {
      setSelectedStation(availableStations[0]);
    }
  }, [availableStations, selectedStation]);

  const stationData = weatherData?.[selectedStation];

  const getDataStatus = (data) => {
    if (!data) return { status: 'missing', text: 'NO DATA', Icon: Minus, color: 'text-gray-400' };
    if (data.error) return { status: 'error', text: 'ERROR', Icon: XCircle, color: 'text-red-500' };
    if (data.raw || data.data || data.images || (typeof data === 'object' && !data.error)) {
      return { status: 'available', text: 'OK', Icon: CheckCircle, color: 'text-green-500' };
    }
    return { status: 'unknown', text: 'UNK', Icon: AlertTriangle, color: 'text-yellow-500' };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Fetching Weather Data...</h3>
        {status && status.message && (
          <p className="text-gray-500">{status.message}</p>
        )}
      </div>
    );
  }

  if (!stationData) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <ServerCrash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Station Data Loaded</h3>
        <p className="text-gray-500">Configure sites and fetch data to begin, or check the console for errors.</p>
      </div>
    );
  }

  const dataTypes = ['metar', 'taf', 'notam', 'sigmet', 'airmet', 'pirep'];

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
      {/* Terminal Header */}
      <header className="bg-gray-800 text-green-400 p-4 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Radio className="w-6 h-6" />
            <h2 className="text-xl font-bold">WEATHER TERMINAL</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="station-select" className="text-sm">STN:</label>
              <select
                id="station-select"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-green-400 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                {availableStations.map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div>GFA: {stationData.gfa_region || 'N/A'}</div>
              <div>{new Date().toUTCString().replace('GMT', 'Z')}</div>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-gray-900 font-bold rounded hover:bg-green-500 transition-colors"
              aria-label="Refresh weather data"
            >
              <RefreshCw className="w-4 h-4" />
              REFRESH
            </button>
          </div>
        </div>
      </header>

      {/* Station Status Bar */}
      <div className="bg-gray-100 border-y border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold font-mono text-gray-900">{selectedStation}</h3>
            <p className="font-mono text-sm text-gray-600">
              {regionNames[stationData.gfa_region] || 'Unknown Region'}
            </p>
          </div>
          <div className="grid grid-cols-6 gap-3 font-mono text-xs text-center">
            {dataTypes.map(type => {
              const { Icon, text, color } = getDataStatus(stationData.alpha_data?.[type]);
              return (
                <div key={type}>
                  <div className="font-bold text-gray-600">{type.toUpperCase()}</div>
                  <div className={`flex items-center justify-center gap-1 font-bold ${color}`}>
                    <Icon className="w-3 h-3" />
                    <span>{text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'text'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            TEXT REPORTS
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'images'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            WEATHER IMAGERY
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-gray-50/50">
        {activeTab === 'text' && <TextReportsTab alphaData={stationData.alpha_data} />}
        {activeTab === 'images' && <WeatherImageryViewer imageData={stationData.image_data} getDataStatus={getDataStatus} />}
      </div>
    </div>
  );
};

const TextReportsTab = ({ alphaData }) => {
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!alphaData || Object.keys(alphaData).length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Text Data Available</h3>
        <p className="text-gray-500">No alphanumeric weather reports were found for this station.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(alphaData).map(([dataType, data]) => {
        const displayText = parseRawAlpha(data) || (data?.error ? `Error: ${data.error}` : 'No valid data found.');
        const isError = !!data?.error;

        return (
          <div key={dataType} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <header className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-mono font-bold text-lg text-gray-800">{dataType.toUpperCase()}</h4>
              {!isError && (
                <button
                  onClick={() => copyToClipboard(displayText, dataType)}
                  className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copiedField === dataType ? 'Copied!' : 'Copy'}
                </button>
              )}
            </header>
            <div className="p-4">
              <pre className={`font-mono text-sm p-4 rounded-md border whitespace-pre-wrap break-words ${
                isError 
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-black border-gray-600 text-green-400'
              }`}>
                {displayText}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfessionalWeatherTerminal;