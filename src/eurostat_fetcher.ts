import fetch from 'node-fetch';
import { eurostatIndicators } from './eurostat_indicators';
import Logger from './lib/logger';
import { Description } from './models/description';
const eurostatApiRoot: string = process.env.EUROSTAT_API;
import { Indicator } from './models/indicator';

type ESIndicator = {
  combined_parameter: string;
  combining_operation: CombinationFunction;
  composition_operation: CompositionFunction;
  endpoint: string;
  additional_data: ESIndicator;
  desc: string;
  [key: string]:
    | string
    | ESIndicator
    | CompositionFunction
    | CombinationFunction
    | string[];
};

type CompositionFunction = (main: number, additional: number) => number;

type CombinationFunction = (parameterList: number[]) => number;

type JSONDimension = {
  [key: string]: {
    [key: string]: { [key: string]: { [key: string]: string } };
  };
};

type JSONSize = {
  [key: number | string]: number;
};

type JSONId = {
  [key: number | string]: string;
};

type JSONValue = {
  [key: number]: number;
};

type YearList = {
  [key: string]: string;
};

type LocationList = {
  [key: string]: [string, string];
};

type ESIndicatorData = {
  [key: string]: { [key: string]: number };
};

/**
 * Get the year present in year_array closest to the target_year,
 * in case of ties the most recent is returned
 * @param {number[]} yearArray The array with the years in which to find the best match
 * @param {number} targetYear The target in relation to which to find the closest year
 * @returns {number} the year present in yearArray closest to targetYear
 */
const getClosestYear = (yearArray: string[], targetYear: string): string => {
  let minYear: number = Number(yearArray[0]);
  yearArray.forEach((year: string) => {
    if (
      Math.abs(Number(year) - Number(targetYear)) <=
      Math.abs(minYear - Number(targetYear))
    ) {
      minYear = Number(year);
    }
  });
  return minYear.toString();
};

/**
 * Get the data needed before the fetch operation on the combined parameter
 * @param {ESIndicator} indicator The object containing all the data on the current indicator
 * @returns {string, string[], CombinationFunction} The Object containing the name of the combined parameter, all of its values as an Array
 *  and the function to combine the values, can be destructured to
 *  {combined_parameter, combined_parameter_instances, combining_operation}
 */
const getCombinedParameterData = (indicator: ESIndicator) => {
  let combinedParameter: string;
  let combinedParameterInstances: string[];
  let combiningOperation: CombinationFunction;
  if (indicator.combined_parameter) {
    combinedParameter = indicator.combined_parameter;
    // @ts-ignore
    combinedParameterInstances = indicator[combinedParameter];
    combiningOperation = indicator.combining_operation;
  }
  return {
    combinedParameter,
    combinedParameterInstances,
    combiningOperation,
  };
};

/**
 * Build the query string needed for the fetch requests
 * @param {ESIndicator} indicator The object containing all the data on the current indicator, mostly parameters to be added to the query
 * @param {string} combinedParameter The name of the parameter that is present in multiple instances in the same indicator
 *  and will have to be combined after the fetch
 * @param {string[]} combinedParameterInstances All the values of the combined parameter necessary for this indicator
 * @returns {string} The query string based on entered parameters
 */
const buildQueryString = (
  indicator: ESIndicator,
  combinedParameter: string,
  combinedParameterInstances: string[]
) => {
  // Get all the needed parameters and remove those added by me to help with the rest of the logic
  const keys: string[] = Object.keys(indicator).filter((e) => {
    return (
      e !== 'desc' &&
      e !== 'endpoint' &&
      e !== 'composite' &&
      e !== 'composition_operation' &&
      e !== 'additional_data' &&
      e !== 'combined_parameter' &&
      e !== 'combining_operation' &&
      e !== indicator.combined_parameter
    );
  });

  // Build the query string
  let queryStr: string = '';
  keys.forEach((key: string) => {
    queryStr += `${key}=${indicator[key]}&`;
  });
  if (combinedParameter) {
    combinedParameterInstances.forEach((instance) => {
      queryStr += `${combinedParameter}=${instance}&`;
    });
  }
  queryStr += 'geoLevel=nuts2&precision=1&filterNonGeo=1';
  return queryStr;
};

/**
 * Get the indexed list of values for the combined parameter
 * @param {JSONDimension} jsonDimension The dimension attribute of the json response from the API
 * @param {string} combinedParameter The name of the parameter to be combined
 * @returns {string[]} The indexed list of values for the combined parameter
 */
const getCombinedParameterCodes = (
  jsonDimension: JSONDimension,
  combinedParameter: string
) => {
  let combinedParameterCodes: string[];
  if (combinedParameter) {
    // Get a list of all the values for the parameter in the dataset that has to be combined
    combinedParameterCodes = Object.keys(
      jsonDimension[combinedParameter].category.index
    );
  }
  return combinedParameterCodes;
};

/**
 * Get an object with all of the years and location in the dataset of the current indicator along with their index
 * @param {JSONDimension} jsonDimension The dimension attribute of the json response from the API
 * @returns {object} The Objects containing the years and locations in the dataset of the current indicator, indexed,
 *  can be destructured in {years, locations}
 */
const getYearsAndLocations = (jsonDimension: JSONDimension) => {
  // Get a list of all the years in the dataset
  const yearCodes: string[] = Object.keys(jsonDimension.time.category.index);
  const years: YearList = {};
  yearCodes.forEach((yearCode) => {
    years[jsonDimension.time.category.index[yearCode]] =
      jsonDimension.time.category.label[yearCode];
  });
  // Get a list of all the locations in the dataset
  const locationCodes: string[] = Object.keys(jsonDimension.geo.category.index);
  const locations: LocationList = {};
  locationCodes.forEach((locationCode: string) => {
    locations[jsonDimension.geo.category.index[locationCode]] = [
      locationCode,
      jsonDimension.geo.category.label[locationCode],
    ];
  });
  return { years, locations };
};

/**
 * Get all the data on the given indicator and return it as an Object
 * @param {YearList} years The Object with all the indexed years
 * @param {LocationList} locations The Object with all the indexed locations
 * @param {JSONSize} jsonSize The size attribute of the json response from the API
 * @param {JSONId} jsonId The id attribute of the json response from the API
 * @param {JSONValue} jsonValue The value attribute of the json response from the API
 * @param {string} combinedParameter The name of the combined parameter
 * @param {string[]} combinedParameterCodes The codes of the combined parameter
 * @param {CombinationFunction} combiningOperation The operation used to combine the values
 * @returns {ESIndicatorData} All the data on the given indicator, ready to be saved or composited
 */
const getIndicatorData = (
  years: YearList,
  locations: LocationList,
  jsonSize: JSONSize,
  jsonId: JSONId,
  jsonValue: JSONValue,
  combinedParameter: string,
  combinedParameterCodes: string[],
  combiningOperation: CombinationFunction
) => {
  const data: ESIndicatorData = {};
  Object.keys(locations).forEach((locationIndex) => {
    data[locations[locationIndex][0]] = {};
    // Get how many locations are in the dataset
    const numberOfLocations: number =
      jsonSize[Object.keys(jsonId).filter((e) => jsonId[e] === 'geo')[0]];
    Object.keys(years).forEach((yearIndex) => {
      // Get how many years are in the dataset
      const numberOfYears: number =
        jsonSize[Object.keys(jsonId).filter((e) => jsonId[e] === 'time')[0]];
      // Current index is (optional) (combined_parameter_index * n_of_locations) +
      //                  location_index * n_of_different_years +
      //                  year_index
      const currentIndex: number =
        Number(locationIndex) * numberOfYears + Number(yearIndex);
      if (combinedParameter) {
        // This is the case for indicators that need combined parameters
        const combinedParametersList: number[] = [];
        combinedParameterCodes.forEach(
          (combinedParameterCode: string, combinedParameterIndex: number) => {
            const combinedParameterCurrentIndex: number =
              combinedParameterIndex * numberOfLocations * numberOfYears +
              currentIndex;
            // If data is present, copy it in an array, null if missing, apply the combination
            // (sum, but flexible because of function saved in the object), otherwise use null to mark it as missing
            // If other operations are added null has to be taken into account
            combinedParametersList.push(jsonValue[combinedParameterCurrentIndex]);
          }
        );
        const combinedParametersResult: number = combiningOperation(
          combinedParametersList
        );
        data[locations[locationIndex][0]][years[yearIndex]] =
          combinedParametersResult ? combinedParametersResult : null;
      } else {
        // This is the case for indicators that don't need combined parameters
        // If data is present, copy it, otherwise use null to mark it as missing
        data[locations[locationIndex][0]][years[yearIndex]] = jsonValue[currentIndex]
          ? jsonValue[currentIndex]
          : null;
      }
    });
  });
  return data;
};

/**
 * Returns an object with the data from the main indicator composed with the data from the additional indicator
 * composed via the composition operation
 * @param {ESIndicatorData} mainIndicatorData The data from the main indicator
 * @param {ESIndicatorData} dataForCompositeIndicator The data to be composed with the main indicator data
 * @param {CompositionFunction} compositionOperation The operation used to compose the data
 * @returns {ESIndicatorData} The object with the composed data
 */
const composeIndicator = (
  mainIndicatorData: ESIndicatorData,
  dataForCompositeIndicator: ESIndicatorData,
  compositionOperation: CompositionFunction
) => {
  // Some datasets have a different amount of years of data so there has to be some kind of matching
  // At the moment the chosen method is to use the closest with a non null value
  // To do so I create an array with the years with a non-null value and call the getClosestYear function
  // which returns the year in the array (first parameter) closest to the target year (second parameter)
  // In case of ties it returns the most recent year
  const compositeData: ESIndicatorData = {};
  Object.keys(mainIndicatorData).forEach((locationName: string) => {
    compositeData[locationName] = {};
    if (dataForCompositeIndicator[locationName]) {
      const additionalDataYearsForCurrentLocation: string[] = Object.keys(
        dataForCompositeIndicator[locationName]
      ).filter((e) => dataForCompositeIndicator[locationName][e] !== null);

      Object.keys(mainIndicatorData[locationName]).forEach((year: string) => {
        const closestYear: string = getClosestYear(
          additionalDataYearsForCurrentLocation,
          year
        );

        // compositeData[locationName][year] is calculated by the operator function
        // and it becomes the composite version of the data
        compositeData[locationName][year] = compositionOperation(
          mainIndicatorData[locationName][year],
          dataForCompositeIndicator[locationName][closestYear]
        );
      });
    } else {
      // If a location doesn't have any value in the additional_data dataset every year for that location is set to null
      Object.keys(mainIndicatorData[locationName]).forEach((year) => {
        compositeData[locationName][year] = null;
      });
    }
  });
  return compositeData;
};

const saveIndicator = (indicatorName: string, indicatorData: ESIndicatorData) => {
  const currentIndicator = new Indicator({
    name: indicatorName,
    json_dump: JSON.stringify(indicatorData),
  });
  Indicator.deleteOne({ name: indicatorName }).then(() => {
    currentIndicator.save();
  });
};

/**
 * Fetch all the indicators and save results in the current collection of the DB
 */
const fetchAll = () => {
  // save a list of all the indicator and location names with their description
  const indicatorDescriptions: Map<string, string> = new Map();

  // Iterate over indicator categories
  Object.keys(eurostatIndicators).forEach((categoryName: string) => {
    // @ts-ignore
    const rootEndpoint: string = eurostatIndicators[categoryName].endpoint;
    // @ts-ignore
    const indicators: ESIndicator[] = eurostatIndicators[categoryName].indicators;
    // Iterate over indicators for every category
    Object.keys(indicators).forEach((indicatorName: string) => {
      // Get the indicator from its name
      const indicator: ESIndicator =
        // @ts-ignore
        eurostatIndicators[categoryName].indicators[indicatorName];

      indicatorDescriptions.set(indicatorName, indicator.desc);

      // Initialize object for current indicator
      // Endpoint can be common for all indicators of a category, have a common root for all indicators of a category
      // or have the root indicator for a category be empty and be different for every indicator
      const endpoint: string = indicator.endpoint
        ? rootEndpoint + indicator.endpoint
        : rootEndpoint;
      // Combined parameter and combination operator are for indicators that need multiple values for the same parameter
      // (e.g. different age values) and combine them with some operation before using them (e.g. sum of age values to create
      // custom age intervals)
      const {
        combinedParameter: combinedParameter,
        combinedParameterInstances: combinedParameterInstances,
        combiningOperation: combiningOperation,
      } = getCombinedParameterData(indicator);

      // Build the query string with all the needed parameters
      const queryStr: string = buildQueryString(
        indicator,
        combinedParameter,
        combinedParameterInstances
      );
      let mainIndicatorData: ESIndicatorData = {};
      let dataForCompositeIndicator: ESIndicatorData = {};
      let compositeData: ESIndicatorData = {};
      // Request the data from the API and transform it into a json object
      fetch(`${eurostatApiRoot}${endpoint}?${queryStr}`)
        .then((res) => res.json())
        .then((json) => {
          // Get the info needed for combined parameters (if present)
          const combinedParameterCodes: string[] = getCombinedParameterCodes(
            json.dimension,
            combinedParameter
          );

          // Get the data on years and locations present in the JSON response
          const { years, locations } = getYearsAndLocations(json.dimension);

          // Get the indicator data from the JSON response
          mainIndicatorData = getIndicatorData(
            years,
            locations,
            json.size,
            json.id,
            json.value,
            combinedParameter,
            combinedParameterCodes,
            combiningOperation
          );
        })
        .then(() => {
          if (!indicator.composite) {
            // Return main indicator data if not composite
            saveIndicator(indicatorName, mainIndicatorData);
          } else {
            // Composite indicators require 2 queries to the Eurostat API and an operation between the correspondent data from the 2 resulting datasets
            // The required operation is in the composition_operation parameter of the additional_data Object. It is stored as a function

            // additional_data contains the data for the second query needed for composite indicators
            // The rest of the code works roughly the same way as that for the main query
            const additionalDataEndpoint: string =
              indicator.additional_data.endpoint;

            // Get the operation used to compose the datasets
            const compositionOperation: CompositionFunction =
              indicator.additional_data.composition_operation;

            // Combined parameter and combination operator are for indicators that need multiple values for the same parameter
            // (e.g. different age values) and combine them with some operation before using them (e.g. sum of age values to create
            // custom age intervals)
            const {
              combinedParameter: additionalDataCombinedParameter,
              combinedParameterInstances: additionalDataCombinedParameterInstances,
              combiningOperation: additionalDataCombiningOperation,
            } = getCombinedParameterData(indicator.additional_data);

            // Build the query string with all the necessary parameters
            const additionalDataQueryStr: string = buildQueryString(
              indicator.additional_data,
              additionalDataCombinedParameter,
              additionalDataCombinedParameterInstances
            );

            // Fetch the data from the API and transform it into a JSON object
            fetch(
              `${eurostatApiRoot}${additionalDataEndpoint}?${additionalDataQueryStr}`
            )
              .then((res) => res.json())
              .then((json) => {
                // Get the info needed for combined parameters (if present)
                const combinedParameterCodes: string[] = getCombinedParameterCodes(
                  json.dimension,
                  additionalDataCombinedParameter
                );

                // Get the data on years and locations present in the JSON response
                const { years, locations } = getYearsAndLocations(json.dimension);

                // Get the indicator data from the JSON response
                dataForCompositeIndicator = getIndicatorData(
                  years,
                  locations,
                  json.size,
                  json.id,
                  json.value,
                  additionalDataCombinedParameter,
                  combinedParameterCodes,
                  additionalDataCombiningOperation
                );
                // Compose the two previously fetched indicators and return the resulting object
                compositeData = composeIndicator(
                  mainIndicatorData,
                  dataForCompositeIndicator,
                  compositionOperation
                );
              })
              .then(() => {
                saveIndicator(indicatorName, compositeData);
              });
          }
        });
    });
    // THIS IS MOSTLY DONE
    // TODO: ADD EMPTY FIELDS FOR THE LOCATIONS THAT DON'T HAVE VALUES FOR THE CURRENT INDICATORS (USUALLY NON-EU COUNTRIES)
    //      WILL BE DONE IF NEEDED
    // TODO: TEST WITH ALL OF THE INDICATORS AND COMPARE WITH DATA IN EXCEL FILE
    //      IN PROGRESS
  });
  const indicatorDescription = new Description({
    name: 'indicators',
    data: indicatorDescriptions,
  });
  Description.deleteOne({ name: 'indicators' }).then(() => {
    indicatorDescription.save();
  });
  // This indicator has a value for every NUTS2 region so it is used to create a list with all of them
  // This is not an optimal solution but I use it for now to start working on the React part
  fetch(
    `${eurostatApiRoot}demo_r_pjangrp3?geoLevel=nuts2&filterNonGeo=1&precision=1&sex=T&lastTimePeriod=1&unit=NR&age=TOTAL`
  )
    .then((res) => res.json())
    .then((json) => {
      const locationDescriptions: Map<string, string> = new Map();
      Object.keys(json.dimension.geo.category.label).forEach((locationCode) => {
        locationDescriptions.set(
          locationCode,
          json.dimension.geo.category.label[locationCode]
        );
      });

      const locationsDescription = new Description({
        name: 'locations',
        data: locationDescriptions,
      });
      Description.deleteOne({ name: 'locations' }).then(() => {
        locationsDescription.save();
      });
    });
};

// EUROPEAN QUALITY OF GOVERNMENT INDEX MISSING

export { fetchAll };

// EUROSTAT API JSON FORMAT (For GDP Indicator, the other ones are slightly different in the nmber of parameters and status codes):
// version (dataset version)
// label (dataset description)
// href (api address)
// source (data source)
// updated (last update date)
// status: (status for every location/year couple datapoint) !!!IMPORTANT!!! This may vary between datasets
//  #: : / b / p / u / e / d
//  legend:
//  # = location_index * n_of_different_years + year_index
//  : = not available
//  b = break in time series
//  p = provisional
//  u = low reliability
//  e = estimated
//  d = definition differs (see metadata)
// extension (dataset info)
// value: (values for every location/year couple datapoint except the ones marked by : in status)
//  #: value
//  legend:
//  # = location_index * n_of_different_years + year_index
// dimension:
//  unit:
//    label: "unit"
//    category:
//      index:
//        unit_abbr: unit_index
//      label:
//        unit_abbr: unit_name
//  geo:
//    label: "geo"
//    category:
//      index:
//        location_abbr: location_index
//      label:
//        location_abbr: location_name
//  time:
//    label: "time"
//    category:
//      index:
//        year: year_index
//      label:
//        year: year_name
// id:
//  0: "unit"
//  1: "geo"
//  2: "time"
// size:
//  0: number_of_units
//  1: number_of_locations
//  2: number_of_years

/* DB STRUCTURE
current collection
name: {
json_dump: "{location: {year: {value}, ...}, ...",
...
},
...

snapshots collection

date: {
data: {
  json_dump: "{location: {year: {value}, ...}, ...",
  ...
  },
  ...
},
...
},
...
*/
