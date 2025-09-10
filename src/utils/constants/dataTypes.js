// utils/constants/dataTypes.js

export const alphaOptions = [
  { value: 'metar', label: 'METAR - Current Conditions', essential: true },
  { value: 'taf', label: 'TAF - Terminal Forecasts', essential: true },
  { value: 'notam', label: 'NOTAM - Notices to Airmen' },
  { value: 'sigmet', label: 'SIGMET - Significant Meteorology', essential: true },
  { value: 'airmet', label: 'AIRMET - Airmen\'s Meteorological' },
  { value: 'pirep', label: 'PIREP - Pilot Reports', essential: true },
  { value: 'upperwind', label: 'Upper Winds Aloft' },
  { value: 'space_weather', label: 'Space Weather' },
  { value: 'vfr_route', label: 'VFR Route Information' },
  { value: 'area_forecast', label: 'Area Forecasts' }
];

export const imageCategories = {
  satellite: [
    { value: 'SATELLITE/IR', label: 'Infrared Satellite' },
    { value: 'SATELLITE/VIS', label: 'Visible Satellite' },
    { value: 'SATELLITE/WV', label: 'Water Vapor' },
    { value: 'SATELLITE/RGB', label: 'RGB Composite' }
  ],
  radar: [
    { value: 'RADAR/ECHOTOP', label: 'Echo Tops' },
    { value: 'RADAR/CAPPI_RAIN', label: 'CAPPI Rain' },
    { value: 'RADAR/CAPPI_SNOW', label: 'CAPPI Snow' },
    { value: 'RADAR/COMPOSITE', label: 'Radar Composite', essential: true },
    { value: 'RADAR/VELOCITY', label: 'Doppler Velocity' }
  ],
  gfa: [
    { value: 'GFA/CLDWX', label: 'Cloud & Weather', essential: true },
    { value: 'GFA/TURBC', label: 'Icing & Turbulence', essential: true },
    { value: 'GFA/WINDS', label: 'Winds Aloft' },
    { value: 'GFA/FREEZING', label: 'Freezing Level' }
  ],
  sigwx: [
    { value: 'SIG_WX/HIGH_LEVEL', label: 'High Level SIGWX' },
    { value: 'SIG_WX/MID_LEVEL', label: 'Mid Level SIGWX' },
    { value: 'SIG_WX/DEPICTION/SURFACE', label: 'Surface Analysis' },
    { value: 'PROG_CHARTS/SURFACE', label: 'Surface Prognosis' }
  ]
};

export const categoryNames = {
  satellite: 'Satellite Products',
  radar: 'Radar Products', 
  gfa: 'GFA Products',
  sigwx: 'Significant Weather Charts'
};
