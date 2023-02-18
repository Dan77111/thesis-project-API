library(dbplyr)
library(plumber)

# 'plumber.R' is the location of the file shown above
pr("analysis.R") %>% pr_run(port = 3001)