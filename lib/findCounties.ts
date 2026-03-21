import countiesData from "../data.json";

/**
 * Gets the counties (NYC boroughs) that contain the given neighborhoods
 * @param targetAreas - Array of neighborhood names to check
 * @returns Array of county names that contain those neighborhoods
 */
export const getCountiesForNeighborhoods = (targetAreas: string[]): string[] => {
  if (!targetAreas || targetAreas.length === 0) return [];

  const matchingCounties = new Set<string>();

  targetAreas?.forEach((area) => {
    countiesData.counties.forEach((county) => {
      if (county.neighborhoods.some((neighborhood) => neighborhood.toLowerCase() === area.toLowerCase())) {
        matchingCounties.add(county.name);
      }
    });
  });

  return Array.from(matchingCounties);
};

/**
 * Gets all neighborhoods for a given county
 * @param countyName - Name of the county (e.g., "Manhattan", "Brooklyn")
 * @returns Array of neighborhood names in that county
 */
export const getNeighborhoodsForCounty = (countyName: string): string[] => {
  const county = countiesData.counties.find((c) => c.name.toLowerCase() === countyName.toLowerCase());
  return county ? county.neighborhoods : [];
};

/**
 * Checks if a neighborhood exists in any county
 * @param neighborhoodName - Name of the neighborhood to check
 * @returns Boolean indicating if the neighborhood exists
 */
export const isValidNeighborhood = (neighborhoodName: string): boolean => {
  return countiesData.counties.some((county) =>
    county.neighborhoods.some((neighborhood) => neighborhood.toLowerCase() === neighborhoodName.toLowerCase())
  );
};

/**
 * Gets all available counties
 * @returns Array of all county names
 */
export const getAllCounties = (): string[] => {
  return countiesData.counties.map((county) => county.name);
};

/**
 * Gets all neighborhoods across all counties
 * @returns Array of all neighborhood names
 */
export const getAllNeighborhoods = (): string[] => {
  return countiesData.counties.flatMap((county) => county.neighborhoods);
};
