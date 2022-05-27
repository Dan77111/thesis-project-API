import { Indicator } from '../models/indicator';
import { Description } from '../models/description';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Logger from '../lib/logger';
import R from 'r-script';

export const elaboratedRoute = (req: Request, res: Response) => {
  /*
  const indicators = req.params.inds.split(',');
  const locations = req.params.locations.split(',');
  const std = req.params.std.split(',');
  const method = req.params.method.split(',');

  // TODO: CHECK PARAMS

  // TODO: GET THE DATA FROM THE DB
  const data = [1, 2, 3, 4, 5];

  Logger.info(indicators);
  Logger.info(locations);
  Logger.info(std);
  Logger.info(method);

  // TODO: PASS THE DATA TO THE R SCRIPT
  R('../scripts/elaborate.R')
    .data({
      indicator_codes: indicators,
      location_codes: locations,
      standardization_data: std,
      analysis_method: method,
      indicator_values: data,
    })
    .call((err, output) => {
      if (err) throw err;
      // TODO: COLLECT THE R SCRIPT OUTPUT AND RETURN IT TO THE CLIENT
      Logger.info(output);
    });
    */
  res.status(200).json('WIP');
};

// TODO: THIS WILL HAVE TO BE TESTED ON AN UNIX MACHINE BECAUSE IT DOESN'T WORK ON WINDOWS
// THE ALTERNATIVE IS CREATING A PSEUDO-API IN R WITH PLUMBER OR USING OPENCPU
//https://github.com/rstudio/plumber
//https://www.opencpu.org/api.html#api-package
//https://github.com/ColinFay/hordes
