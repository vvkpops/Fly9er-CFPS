// services/weatherFetchingService.js

import { fetchIndividualAlpha, fetchIndividualImage, fetchIndividualGFA } from './api/weatherApi.js';
import { gfaRegionMapping } from '../utils/constants/gfaRegions.js';

export const useWeatherFetching = (config, selectedData, weatherData, scrapingState) => {
  
  const fetchSiteData = async (site) => {
    const gfaRegion = gfaRegionMapping[site.toUpperCase()];
    let siteResult = {
      site,
      gfa_region: gfaRegion,
      alpha_data: {},
      image_data: {},
      fetch_summary: {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
      }
    };

    const requests = [];

    // Prepare alpha data requests
    (selectedData.alpha || []).forEach(alpha => {
      requests.push({ type: 'alpha', site, product: alpha });
    });

    // Prepare image data requests
    (selectedData.image || []).forEach(image => {
      requests.push({ type: 'image', site, product: image, gfaRegion });
    });

    siteResult.fetch_summary.total_requests = requests.length;

    // Process requests with delays
    for (const request of requests) {
      try {
        let data;
        if (request.type === 'alpha') {
          data = await fetchIndividualAlpha(request.site, request.product);
          siteResult.alpha_data[request.product] = data;
        } else if (request.type === 'image') {
          if (request.product.includes('GFA') && request.gfaRegion) {
            data = await fetchIndividualGFA(request.site, request.gfaRegion, request.product);
          } else {
            data = await fetchIndividualImage(request.site, request.product);
          }
          siteResult.image_data[request.product] = data;
        }
        
        if (data && !data.error) {
          siteResult.fetch_summary.successful_requests++;
        } else {
          siteResult.fetch_summary.failed_requests++;
        }
      } catch (error) {
        siteResult.fetch_summary.failed_requests++;
        if (request.type === 'alpha') {
          siteResult.alpha_data[request.product] = { error: error.message };
        } else {
          siteResult.image_data[request.product] = { error: error.message };
        }
      }
      // Add delay between requests
      if (config.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.requestDelay));
      }
    }
    
    return siteResult;
  };

  const fetchWeatherData = async () => {
    const sitesToFetch = [config.primarySite, ...config.additionalSites].filter(Boolean);
    const uniqueSites = [...new Set(sitesToFetch.map(s => s.toUpperCase()))];
    
    if (uniqueSites.length === 0) {
      scrapingState.endFetching('No sites configured.', 'warning');
      return;
    }

    scrapingState.startFetching(`Fetching data for ${uniqueSites.length} site(s)...`);

    const allSitePromises = uniqueSites.map(site => fetchSiteData(site));
    const allSiteResults = await Promise.all(allSitePromises);

    const finalResults = {};
    allSiteResults.forEach(result => {
      finalResults[result.site] = result;
    });

    const sessionData = {
      timestamp: new Date().toISOString(),
      data: finalResults,
    };
    
    weatherData.setSessionData(sessionData);
    
    const totalFailed = allSiteResults.reduce((acc, site) => acc + site.fetch_summary.failed_requests, 0);
    if (totalFailed > 0) {
      scrapingState.endFetching('Fetch complete with some errors.', 'warning');
    } else {
      scrapingState.endFetching('Fetch complete.', 'success');
    }
  };

  return { fetchWeatherData };
};