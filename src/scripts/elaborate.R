#============IMPORTANT==============
#ALL THE USED LIBRARIES NEED TO BE INSTALLED SEPARATELY
#R HAS TO BE ADDED TO PATH ENV VARIABLE IF ON WINDOWS
needs(dplyr)
#The input from the Express API is attached so it can be accessed directly
attach(input)

#The data is in the following arrays:
#indicator_codes - contains the name of the indicators that were selected
#location_codes - contains the locations that were selected
#indicator_values - contains the values
#standardization_data - contains the data for the standardization, format TBD
#analysis_method - contains the data for the analysis method, format TBD

print(indicator_codes)
#The output of the final expression is returned to the Express API
