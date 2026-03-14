/**
 * Geocoding utility functions for location services
 */

/**
 * Fetches location suggestions from OpenCage API based on the provided query
 * @param {string} query - The location query to search for
 * @returns {Promise<Array<{formatted: string, lat: number, lng: number}>>} Array of location suggestions
 */
export async function getLocationSuggestions(query) {
  // Safely handle empty queries
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return [];
  }

  const openCageApiKey = localStorage.getItem("openCageApiKey");
  if (!openCageApiKey) {
    console.warn("OpenCage API key not found");
    return [];
  }

  const encodedQuery = encodeURIComponent(query.trim());
  const OPENCAGE_API_ENDPOINT = `https://api.opencagedata.com/geocode/v1/json?q=${encodedQuery}&key=${openCageApiKey}&limit=5&pretty=0&no_annotations=1`;

  try {
    const response = await fetch(OPENCAGE_API_ENDPOINT);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenCage API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return [];
    }

    // Return top 5 results with formatted name, latitude, and longitude
    const processedResults = data.results.slice(0, 5).map(result => ({
      formatted: result.formatted || '',
      lat: result.geometry?.lat || null,
      lng: result.geometry?.lng || null
    })).filter(suggestion =>
      suggestion.formatted &&
      suggestion.lat !== null &&
      suggestion.lng !== null
    );

    // Remove duplicates based on formatted name, keeping the first occurrence
    const seen = new Set();
    return processedResults.filter(suggestion => {
      if (seen.has(suggestion.formatted)) {
        return false;
      }
      seen.add(suggestion.formatted);
      return true;
    });

  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return [];
  }
}

/**
 * Fetches coordinates from OpenCage API based on the provided location query
 * @param {string} locationQuery - The location to geocode
 * @param {string} openCageApiKey - The OpenCage API key (optional, will use from localStorage if not provided)
 * @returns {Promise<{lat: number, lng: number}|null>} Coordinates or null if not found
 */
export async function getCoordinatesFromLocation(locationQuery, openCageApiKey = null) {
  if (!locationQuery || locationQuery.trim() === "") {
    return null;
  }

  const apiKey = openCageApiKey || localStorage.getItem("openCageApiKey");
  if (!apiKey) {
    console.warn("OpenCage API key not found");
    return null;
  }

  const encodedQuery = encodeURIComponent(locationQuery);
  const OPENCAGE_API_ENDPOINT = `https://api.opencagedata.com/geocode/v1/json?q=${encodedQuery}&key=${apiKey}&pretty=0&no_annotations=1`;

  try {
    const response = await fetch(OPENCAGE_API_ENDPOINT);
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`OpenCage API failed: ${response.status} - ${errorBody.status?.message || JSON.stringify(errorBody)}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0].geometry;
      return { lat: firstResult.lat, lng: firstResult.lng };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error calling OpenCage API:", error);
    return null;
  }
}