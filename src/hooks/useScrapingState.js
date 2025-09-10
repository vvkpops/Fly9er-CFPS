// hooks/useScrapingState.js
import { useState } from 'react';

export const useScrapingState = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState({ message: 'Ready to fetch weather data.', type: 'info' });

  const startFetching = (message) => {
    setIsFetching(true);
    setStatus({ message, type: 'info' });
  };

  const endFetching = (message, type) => {
    setIsFetching(false);
    setStatus({ message, type });
  };

  const updateStatus = (message, type = 'info') => {
    setStatus({ message, type });
  };

  return { isFetching, status, startFetching, endFetching, updateStatus };
};