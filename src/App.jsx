// src/App.jsx

import React, { useState, useEffect } from 'react';

// Components
import SimplifiedConfigurationPanel from './components/configuration/SimplifiedConfigurationPanel.jsx';
import ProfessionalWeatherTerminal from './components/results/ProfessionalWeatherTerminal.jsx';
import Footer from './components/common/Footer.jsx';

// Hooks
import { useWeatherData } from './hooks/useWeatherData.js';
import { useScrapingState } from './hooks/useScrapingState.js';

// Services
import { useWeatherFetching } from './services/weatherFetchingService.js';

const Weatheredstrip = () => {
  // Default configuration for a typical user session
  const [config, setConfig] = useState({
    primarySite: '',
    additionalSites: [],
    requestDelay: 250, // Reduced for faster fetching
  });

  // Pre-select essential data types for a streamlined experience
  const [selectedData, setSelectedData] = useState({
    alpha: ['metar', 'taf', 'notam', 'sigmet', 'pirep'],
    image: ['GFA/CLDWX', 'GFA/TURBC', 'RADAR/COMPOSITE', 'SATELLITE/IR'],
  });

  const [isConfigExpanded, setConfigExpanded] = useState(true);

  // Custom hooks for state management
  const weatherData = useWeatherData();
  const scrapingState = useScrapingState();

  // Weather fetching service
  const weatherFetching = useWeatherFetching(
    config, 
    selectedData, 
    weatherData, 
    scrapingState
  );

  // Auto-fetch weather data on initial application load
  useEffect(() => {
    // We won't auto-fetch on load anymore since sites are empty by default.
    // The user can initiate the fetch.
  }, []);

  // Handlers for user actions
  const handleFetch = () => {
    if (config.primarySite || config.additionalSites.length > 0) {
      weatherFetching.fetchWeatherData();
    } else {
      // Maybe show a gentle alert to the user to enter a site
      console.warn("No sites configured to fetch data.");
      // In a real app, you might set a status message here.
    }
  };

  const handleRefresh = () => {
    handleFetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Weatheredstrip Terminal
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            A professional weather data interface for aviation.
          </p>
        </header>

        {/* Collapsible Configuration Panel */}
        <SimplifiedConfigurationPanel 
          config={config}
          setConfig={setConfig}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          isExpanded={isConfigExpanded}
          setExpanded={setConfigExpanded}
          onFetch={handleFetch}
          isLoading={scrapingState.isFetching}
          lastUpdate={weatherData.lastUpdate}
        />

        {/* Main Weather Data Terminal */}
        <div className="mt-8">
          <ProfessionalWeatherTerminal 
            weatherData={weatherData.results}
            isLoading={scrapingState.isFetching}
            onRefresh={handleRefresh}
            status={scrapingState.status}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Weatheredstrip;