// hooks/useWeatherData.js
import { useState } from 'react';

export const useWeatherData = () => {
  const [results, setResults] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const setSessionData = (sessionData) => {
    setResults(sessionData.data);
    setLastUpdate(new Date(sessionData.timestamp));
  };

  const clearData = () => {
    setResults({});
    setLastUpdate(null);
  };

  return { results, lastUpdate, setSessionData, clearData };
};