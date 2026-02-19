// Geocoding Service
// Handles reverse geocoding using AMap (Gaode Map) API

import dotenv from 'dotenv';

dotenv.config();

const AMAP_API_KEY = process.env.AMAP_WEB_SERVICE_KEY;
const AMAP_REGEO_URL = 'https://restapi.amap.com/v3/geocode/regeo';

/**
 * Reverse geocode - Convert coordinates to address information
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object|null>} Address information object, or null on failure
 */
export async function reverseGeocode(latitude, longitude) {
  if (!AMAP_API_KEY) {
    console.error('AMap API key is not configured');
    return null;
  }

  // Validate coordinates
  if (!latitude || !longitude ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
    console.error('Invalid coordinates:', { latitude, longitude });
    return null;
  }

  try {
    // AMap API expects format: "longitude,latitude"
    const location = `${longitude},${latitude}`;
    const url = `${AMAP_REGEO_URL}?location=${location}&key=${AMAP_API_KEY}&extensions=base`;

    const response = await fetch(url);
    const data = await response.json();

    // Check API response status
    if (data.status !== '1' || data.infocode !== '10000') {
      console.error('AMap API error:', data);
      return null;
    }

    const regeocode = data.regeocode;
    const addressComponent = regeocode.addressComponent;

    // Return standardized address information
    return {
      formatted_address: regeocode.formatted_address,
      province: addressComponent.province,
      city: Array.isArray(addressComponent.city) ? '' : addressComponent.city, // Handle municipality case
      district: addressComponent.district,
      township: addressComponent.township,
      street: addressComponent.streetNumber?.street || '',
      street_number: addressComponent.streetNumber?.number || '',
      adcode: addressComponent.adcode,
      citycode: addressComponent.citycode,
      country: addressComponent.country
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Batch reverse geocoding (for future use if needed)
 * Note: AMap free tier doesn't support batch requests, must call individually
 * @param {Array<{latitude: number, longitude: number}>} locations
 * @returns {Promise<Array<Object|null>>}
 */
export async function batchReverseGeocode(locations) {
  const results = [];

  for (const location of locations) {
    const result = await reverseGeocode(location.latitude, location.longitude);
    results.push(result);

    // Avoid API rate limiting, wait 100ms between calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export default {
  reverseGeocode,
  batchReverseGeocode
};
