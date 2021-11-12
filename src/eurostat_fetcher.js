const fetch = require('node-fetch');
const eurostat_indicators = require('./eurostat_indicators').eurostat_indicators;
const eurostat_api_root = process.env.EUROSTAT_API;
const Indicator = require('./models/indicator');

/**
 * Get the year present in year_array closest to the target_year,
 * in case of ties the most recent is returned
 * @param {number[]} year_array
 * @param {number} target_year
 * @returns {number} a year present in year_array
 */
const get_closest_year = (year_array, target_year) => {
  let min_year = year_array[0];
  year_array.forEach((year) => {
    if (Math.abs(year - target_year) <= Math.abs(min_year - target_year)) {
      min_year = year;
    }
  });
  return min_year;
};

/**
 * Get the data needed before the fetch operation on the combined parameter
 * @param {object} indicator The object containing all the data on the current indicator
 * @returns {string, Array, function} The Object containing the name of the combined parameter, all of its values as an Array
 *  and the function to combine the values, can be destructured to
 *  {combined_parameter, combined_parameter_instances, combining_operation}
 */
const get_combined_parameter_data = (indicator) => {
  let combined_parameter;
  let combined_parameter_instances;
  let combining_operation;
  if (indicator.combined_parameter) {
    combined_parameter = indicator.combined_parameter;
    combined_parameter_instances = indicator[combined_parameter];
    combining_operation = indicator.combining_operation;
  }
  return {
    combined_parameter,
    combined_parameter_instances,
    combining_operation,
  };
};

/**
 * Build the query string needed for the fetch requests
 * @param {object} indicator The object containing all the data on the current indicator, mostly parameters to be added to the query
 * @param {string} combined_parameter The name of the parameter that is present in multiple instances in the same indicator
 *  and will have to be combined after the fetch
 * @param {object} combined_parameter_instances All the values of the combined parameter necessary for this indicator
 * @returns {string} The query string based on entered parameters
 */
const build_query_string = (
  indicator,
  combined_parameter,
  combined_parameter_instances
) => {
  //Get all the needed parameters and remove those added by me to help with the rest of the logic
  const keys = Object.keys(indicator).filter((e) => {
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

  //Build the query string
  let query_str = '';
  keys.forEach((key) => {
    query_str += `${key}=${indicator[key]}&`;
  });
  if (combined_parameter) {
    combined_parameter_instances.forEach((instance) => {
      query_str += `${combined_parameter}=${instance}&`;
    });
  }
  query_str += 'geoLevel=nuts2&precision=1&filterNonGeo=1';
  return query_str;
};

/**
 * Get the indexed list of values for the combined parameter
 * @param {object} json_dimension The dimension attribute of the json response from the API
 * @param {string} combined_parameter The name of the parameter to be combined
 * @returns {object} The indexed list of values for the combined parameter
 */
const get_combined_parameter_values = (json_dimension, combined_parameter) => {
  let combined_parameter_values;
  let combined_parameter_codes;
  if (combined_parameter) {
    //Get a list of all the values for the parameter in the dataset that has to be combined
    combined_parameter_codes = Object.keys(
      json_dimension[combined_parameter].category.index
    );
    combined_parameter_values = {};
    combined_parameter_codes.forEach((combined_parameter_code) => {
      combined_parameter_values[
        json_dimension[combined_parameter].category.index[combined_parameter_code]
      ] = combined_parameter_code;
    });
  }
  return combined_parameter_values;
};

/**
 * Get an object with all of the years and location in the dataset of the current indicator along with their index
 * @param {object} json_dimension The dimension attribute of the json response from the API
 * @returns {object} The Objects containing the years and locations in the dataset of the current indicator, indexed,
 *  can be destructured in {years, locations}
 */
const get_years_and_locations = (json_dimension) => {
  //Get a list of all the years in the dataset
  const year_codes = Object.keys(json_dimension.time.category.index);
  const years = {};
  year_codes.forEach((year_code) => {
    years[json_dimension.time.category.index[year_code]] =
      json_dimension.time.category.label[year_code];
  });
  //Get a list of all the locations in the dataset
  const location_codes = Object.keys(json_dimension.geo.category.index);
  const locations = {};
  location_codes.forEach((location_code) => {
    locations[json_dimension.geo.category.index[location_code]] = [
      location_code,
      json_dimension.geo.category.label[location_code],
    ];
  });
  return { years, locations };
};

/**
 * Get all the data on the given indicator and return it as an Object
 * @param {object} years The Object with all the indexed years
 * @param {object} locations The Object with all the indexed locations
 * @param {object} json_size The size attribute of the json response from the API
 * @param {object} json_id The id attribute of the json response from the API
 * @param {object} json_value The value attribute of the json response from the API
 * @param {string} combined_parameter The name of the combined parameter
 * @param {object} combined_parameter_values The indexed values of the combined parameter
 * @param {function} combining_operation The operation used to combine the values
 * @returns {object} All the data on the given indicator, ready to be saved or composited
 */
const get_indicator_data = (
  years,
  locations,
  json_size,
  json_id,
  json_value,
  combined_parameter,
  combined_parameter_values,
  combining_operation
) => {
  const data = {};
  Object.keys(locations).forEach((location_index) => {
    data[locations[location_index][0]] = {};
    //Get how many locations are in the dataset
    const number_of_locations =
      json_size[Object.keys(json_id).filter((e) => json_id[e] === 'geo')[0]];
    Object.keys(years).forEach((year_index) => {
      //Get how many years are in the dataset
      const number_of_years =
        json_size[Object.keys(json_id).filter((e) => json_id[e] === 'time')[0]];
      //Current index is (optional) (combined_parameter_index * n_of_locations) +
      //                  location_index * n_of_different_years +
      //                  year_index
      let current_index =
        parseInt(location_index) * number_of_years + parseInt(year_index);
      if (combined_parameter) {
        //This is the case for indicators that need combined parameters
        let combined_parameters_list = [];
        Object.keys(combined_parameter_values).forEach(
          (combined_parameter_index) => {
            combined_parameter_current_index =
              combined_parameter_index * number_of_locations * number_of_years +
              current_index;
            //If data is present, copy it in an array, null if missing, apply the combination
            //(sum, but flexible because of function saved in the object), otherwise use null to mark it as missing
            //If other operations are added null has to be taken into account
            combined_parameters_list.push(
              json_value[combined_parameter_current_index]
            );
          }
        );
        const combined_parameters_result = combining_operation(
          combined_parameters_list
        );
        data[locations[location_index][0]][years[year_index]] =
          combined_parameters_result ? combined_parameters_result : null;
      } else {
        //This is the case for indicators that don't need combined parameters
        //If data is present, copy it, otherwise use null to mark it as missing
        data[locations[location_index][0]][years[year_index]] = json_value[
          current_index
        ]
          ? json_value[current_index]
          : null;
      }
    });
  });
  return data;
};

/**
 * Returns an object with the data from the main indicator composed with the data from the additional indicator
 * composed via the composition operation
 * @param {object} main_indicator_data The data from the main indicator
 * @param {object} data_for_composite_indicator The data to be composed with the main indicator data
 * @param {function} composition_operation The operation used to compose the data
 * @returns {object} The object with the composed data
 */
const compose_indicator = (
  main_indicator_data,
  data_for_composite_indicator,
  composition_operation
) => {
  //Some datasets have a different amount of years of data so there has to be some kind of matching
  //At the moment the chosen method is to use the closest with a non null value
  //To do so I create an array with the years with a non-null value and call the get_closest_year function
  //which returns the year in the array (first parameter) closest to the target year (second parameter)
  //In case of ties it returns the most recent year
  const composite_data = {};
  Object.keys(main_indicator_data).forEach((location_name) => {
    composite_data[location_name] = {};
    if (data_for_composite_indicator[location_name]) {
      additional_data_years_for_current_location = Object.keys(
        data_for_composite_indicator[location_name]
      ).filter((e) => data_for_composite_indicator[location_name][e] !== null);

      Object.keys(main_indicator_data[location_name]).forEach((year) => {
        const closest_year = get_closest_year(
          additional_data_years_for_current_location,
          year
        );

        //composite_data[location_name][year] is calculated by the operator function
        //and it becomes the composite version of the data
        composite_data[location_name][year] = composition_operation(
          main_indicator_data[location_name][year],
          data_for_composite_indicator[location_name][closest_year]
        );
      });
    } else {
      //If a location doesn't have any value in the additional_data dataset every year for that location is set to null
      Object.keys(main_indicator_data[location_name]).forEach((year) => {
        composite_data[location_name][year] = null;
      });
    }
  });
  return composite_data;
};

const save_indicator = (indicator_name, indicator_data) => {
  const currentIndicator = new Indicator({
    name: indicator_name,
    json_dump: JSON.stringify(indicator_data),
  });
  Indicator.deleteOne({ name: indicator_name });
  currentIndicator.save();
};

const fetch_all_indicators = () => {
  //Iterate over indicator categories
  Object.keys(eurostat_indicators).forEach((category_name) => {
    const root_endpoint = eurostat_indicators[category_name].endpoint;
    const indicators = eurostat_indicators[category_name].indicators;
    //Iterate over indicators for every category
    Object.keys(indicators).forEach((indicator_name) => {
      //Get the indicator from its name
      const indicator =
        eurostat_indicators[category_name].indicators[indicator_name];

      //Initialize object for current indicator
      //Endpoint can be common for all indicators of a category, have a common root for all indicators of a category
      //or have the root indicator for a category be empty and be different for every indicator
      const endpoint = indicator.endpoint
        ? root_endpoint + indicator.endpoint
        : root_endpoint;
      //Combined parameter and combination operator are for indicators that need multiple values for the same parameter
      //(e.g. different age values) and combine them with some operation before using them (e.g. sum of age values to create
      //custom age intervals)
      const {
        combined_parameter,
        combined_parameter_instances,
        combining_operation,
      } = get_combined_parameter_data(indicator);

      //Build the query string with all the needed parameters
      const query_str = build_query_string(
        indicator,
        combined_parameter,
        combined_parameter_instances
      );
      var main_indicator_data = {};
      var data_for_composite_indicator = {};
      var composite_data = {};
      //Request the data from the API and transform it into a json object
      fetch(`${eurostat_api_root}${endpoint}?${query_str}`)
        .then((res) => res.json())
        .then((json) => {
          //Get the info needed for combined parameters (if present)
          const combined_parameter_values = get_combined_parameter_values(
            json.dimension,
            combined_parameter
          );

          //Get the data on years and locations present in the JSON response
          const { years, locations } = get_years_and_locations(json.dimension);

          //Get the indicator data from the JSON response
          main_indicator_data = get_indicator_data(
            years,
            locations,
            json.size,
            json.id,
            json.value,
            combined_parameter,
            combined_parameter_values,
            combining_operation
          );
        })
        .then(() => {
          if (!indicator.composite) {
            //Return main indicator data if not composite
            save_indicator(indicator_name, main_indicator_data);
          } else {
            //Composite indicators require 2 queries to the Eurostat API and an operation between the correspondent data from the 2 resulting datasets
            //The required operation is in the composition_operation parameter of the additional_data Object. It is stored as a function

            //additional_data contains the data for the second query needed for composite indicators
            //The rest of the code works roughly the same way as that for the main query
            const additional_data_endpoint = indicator.additional_data.endpoint;

            //Get the operation used to compose the datasets
            const composition_operation =
              indicator.additional_data.composition_operation;

            //Combined parameter and combination operator are for indicators that need multiple values for the same parameter
            //(e.g. different age values) and combine them with some operation before using them (e.g. sum of age values to create
            //custom age intervals)
            const {
              combined_parameter,
              combined_parameter_instances,
              combining_operation,
            } = get_combined_parameter_data(indicator.additional_data);

            //Build the query string with all the necessary parameters
            const query_str = build_query_string(
              indicator.additional_data,
              combined_parameter,
              combined_parameter_instances
            );

            //Fetch the data from the API and transform it into a JSON object
            fetch(`${eurostat_api_root}${additional_data_endpoint}?${query_str}`)
              .then((res) => res.json())
              .then((json) => {
                //Get the info needed for combined parameters (if present)
                const combined_parameter_values = get_combined_parameter_values(
                  json.dimension,
                  combined_parameter
                );

                //Get the data on years and locations present in the JSON response
                const { years, locations } = get_years_and_locations(json.dimension);

                //Get the indicator data from the JSON response
                data_for_composite_indicator = get_indicator_data(
                  years,
                  locations,
                  json.size,
                  json.id,
                  json.value,
                  combined_parameter,
                  combined_parameter_values,
                  combining_operation
                );
                //Compose the two previously fetched indicators and return the resulting object
                composite_data = compose_indicator(
                  main_indicator_data,
                  data_for_composite_indicator,
                  composition_operation
                );
              })
              .then(() => {
                save_indicator(indicator_name, composite_data);
              });
          }
        });
    });
    //THIS IS MOSTLY DONE
    //TODO: ADD EMPTY FIELDS FOR THE LOCATIONS THAT DON'T HAVE VALUES FOR THE CURRENT INDICATORS (USUALLY NON-EU COUNTRIES)
    //      WILL BE DONE IF NEEDED
    //TODO: TEST WITH ALL OF THE INDICATORS AND COMPARE WITH DATA IN EXCEL FILE
    //      IN PROGRESS
  });
};

// EUROPEAN QUALITY OF GOVERNMENT INDEX MISSING

module.exports = {
  /**
   * Run all the needed queries for all of the indicators
   * @returns {Object} The data object with all of the data from all of the indicators
   */
  fetch_all: fetch_all_indicators,
};

//EUROSTAT API JSON FORMAT (For GDP Indicator, the other ones are slightly different in the nmber of parameters and status codes):
//version (dataset version)
//label (dataset description)
//href (api address)
//source (data source)
//updated (last update date)
//status: (status for every location/year couple datapoint) !!!IMPORTANT!!! This may vary between datasets
//  #: : / b / p / u / e / d
//  legend:
//  # = location_index * n_of_different_years + year_index
//  : = not available
//  b = break in time series
//  p = provisional
//  u = low reliability
//  e = estimated
//  d = definition differs (see metadata)
//extension (dataset info)
//value: (values for every location/year couple datapoint except the ones marked by : in status)
//  #: value
//  legend:
//  # = location_index * n_of_different_years + year_index
//dimension:
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
//id:
//  0: "unit"
//  1: "geo"
//  2: "time"
//size:
//  0: number_of_units
//  1: number_of_locations
//  2: number_of_years

/* DB STRUCTURE
current: {
  indicator: {
    location: {
      year: {
        value
      },
      ...
    },
    ...
  }, 
  ...
},
snapshots: {
  date: {
    indicator: {
      location: {
        year: {
          value
        },
        ...
      },
      ...
    },
    ...
  }, 
  ...
}
*/
