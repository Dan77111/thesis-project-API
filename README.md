# thesis-project-API
The API part of my thesis project for CMCC-RAAS
## What it does
This API fetches data from the Eurostat JSON API every hour and reformats it to be more easily usable by the frontend part of the project. Then it saves it in a MongoDB cluster. Every month it saves a snapshot of all the indicators' data.
## Endpoints
- /api/v1/current
  - Returns the current data for all the indicators
- /api/v1/snapshots/list
  - Returns the list of all month-year pairs that have an available data snapshot
- /api/v1/snapshots/:month-:year
  - Returns the data for all the indicators as it was during the given date
