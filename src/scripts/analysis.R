library(plumber)
library(jsonlite)
future::plan("multisession")


prepare_for_analysis <- function(indicators, locations, years, values){
  #This function takes the data as a vector of values and transforms it into a list of lists of lists like: {indicator_name = {location_name = {year = value, ...}, ...}, ...}
  prepared_values <- list()
  n_locations = length(locations)
  n_years = length(years)
  for (indicator_index in 1:length(indicators)) {
    single_indicator <- list()
    for (location_index in 1:n_locations) {
      single_location <- list()
      for(year_index in 1:n_years){
        single_location[[years[year_index]]] = values[((indicator_index-1)*n_locations*n_years)+((location_index-1)*n_years)+year_index]
      }
      single_indicator[[locations[location_index]]] = single_location
    }
    prepared_values[[indicators[indicator_index]]] = single_indicator
  }
  return(prepared_values)
}

prepare_for_endpoint <- function(results, locations){
  #This function takes the data as {location_name = calculated_index, ...} and transforms to a vector of numbers, which is better suited for passing it to the API
  return_value <- c()
  for (loc in locations){
    return_value <- append(return_value,results[[loc]])
  }
  return(return_value)
}

#* @get /methods
function(req, res) {
  promises::future_promise({
    #Here should be the list of available standardization and analysis methods
    #It should always include all of the methods managed in the analysis part and not any more than that
    standardizationMethods <- c("None", "Method 1")
    analysisMethods <- c("Geometric Mean", "Method 2")
    
    #The two options below depend on the requirements for the analysis method argument
    #Either way one of the two should be deleted or commented out
    #If the different analysis methods require different arguments there should be a list of vectors like below
    analysisArguments <- list("Geometric Mean" = c("Argument1", "Argument2"))
    #If the arguments are the same for every method there should be a vector with the different options for the argument like below
    analysisArguments <- c("Argument1", "Argument2")
    #Otherwise, f the analysis arguments will always be fixed and only have few options they could directly be implemented in the frontend
    
    
    result <- list("standardizationMethods" = standardizationMethods, "analysisMethods" = analysisMethods, "analysisArguments" = analysisArguments)
    return(result)
  })
}

#* @post /analysis
function(req, res) {
  promises::future_promise({
    #This part reads the data from the HTTP POST request
    indicatorNames <- fromJSON(req$body$indicatorNames)
    locationNames <- fromJSON(req$body$locationNames)
    #selectedYears contains in every position the year selected for the indicator in the same position
    selectedYears <- fromJSON(req$body$selectedYears)
    yearsList <- fromJSON(req$body$yearsList)
    indicatorValues <- fromJSON(req$body$indicatorValues)
    standardizationMethod <- fromJSON(req$body$standardizationData)$name
    #analysisData has 5 fields named: name, argument, upperWeightConstraint, lowerWeightConstraint, benchmarkUnitRow
    analysisData <- fromJSON(req$body$analysisData)
    
    #A placeholder/example of the variables
    indicatorNames <- c("indicatorName1", "indicatorName2")
    locationNames <- c("locationName1", "locationName2")
    #This means that the selected year for indicatorName1 is 2017 and for indicatorName2 it's 2018
    selectedYears <- c("2017", "2018")
    yearsList <- c("2016", "2017", "2018", "2019")
    #This is how the values are received by the script, they are transformed the next line
    #The values include values for all the years included in the eurostat API 
    #(even if the specific indicator does not have any in that specific year), 
    #for the selected indicators and locations
    #There are some null values that have to be filled in
    indicatorValues <- c(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)
    standardizationMethod <- "std1"
    analysisData <- list("name" = "mtd1", "argument" = 800, "upperWeightConstraint" = 0.9,"lowerWeightConstraint" = 0.1,"benchmarkUnitRow" = 2)
    
    #This is the list of lists of lists containing the values in this format {indicator_name = {location_name = {year = value, ...}, ...}, ...}
    #Note that year is a string, but this can be changed if necessary
    #Value is either a number or null
    preparedValues <- prepare_for_analysis(indicatorNames, locationNames, yearsList, indicatorValues)
    
    #Here should go the analysis part, it should include
    # - A part to fill in the missing data
    # - A part that checks which standardization method the user chose and applies it
    # - A part that checks which analysis method the user chose and applies it with the parameters chosen by the user
    #The script should include a case for each one of the standardization and analysis methods included in the @get /methods function defined above
    #The order of indicators, locations, years and values in the respective vectors is important
    
    
    
    #This is a placeholder for the variable that will contain the results of the analysis, it should be in the same format
    resultValues <- list("locationName1" = 1, "locationName2" = 2)
    #The result variable is transformed to a better format for the endpoint
    analysisResults <- prepare_for_endpoint(resultValues, locationNames)
    #The data is returned to the Express API
    result <- list("indicatorNames" = indicatorNames, "locationNames" = locationNames, "selectedYears" = selectedYears, "analysisResults" = analysisResults)
    return(result)
  })
}