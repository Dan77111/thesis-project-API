import { Indicator } from '../models/indicator';
import { Description } from '../models/description';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Logger from '../lib/logger';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const analysisRoute = async (req: Request, res: Response) => {
  try {
    const indicatorNames = req.body.indicatorNames;
    const locationNames = req.body.locationNames;
    const selectedYears = req.body.selectedYears;
    const yearsList = req.body.yearsList;
    const indicatorValues = req.body.indicatorValues;
    const standardizationData = req.body.standardizationData;
    const analysisData = req.body.analysisData;

    const completeApiUrl = `http://${process.env.R_API_URI}:${process.env.R_API_PORT}/analysis`;
    fetch(completeApiUrl, {
      method: 'post',
      body: JSON.stringify({
        indicatorNames,
        locationNames,
        selectedYears,
        yearsList,
        indicatorValues,
        standardizationData,
        analysisData,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((json) => {
        res.status(200).json({
          indicatorNames: json.indicatorNames,
          locationNames: json.locationNames,
          selectedYears: json.selectedYears,
          analysisResults: json.analysisResults,
        });
      });
  } catch (error) {
    res.status(500).json('Error in the data analysis');
  }
};

// TODO:
// THE ALTERNATIVES TO CONSIDER FOR THE R PART
// https://github.com/rstudio/plumber               API BUILT IN R
// https://www.opencpu.org/api.html#api-package     ONLINE R API
// https://github.com/ColinFay/hordes               PSEUDO R API TO QUERY FROM WITHIN JS
