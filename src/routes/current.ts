import { Indicator } from '../models/indicator';
import { Description } from '../models/description';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Logger from '../lib/logger';

export const currentRoute = (req: Request, res: Response) => {
  // Get all the indicator values from DB
  Indicator.find({}, (indicatorDataErr, indicatorData) => {
    if (indicatorDataErr) {
      res.status(500).json({ error: 'DB Error' });
    } else {
      // Get all the indicator names:description pairs from DB
      Description.findOne(
        { name: 'indicators' },
        (
          indicatorDescErr: mongoose.NativeError,
          indicatorDescriptions: { name: string; data: Map<string, string> }
        ) => {
          if (indicatorDescErr) {
            res.status(500).json({ error: 'DB Error' });
          } else {
            // Get all the location names:description pairs from DB
            Description.findOne(
              { name: 'locations' },
              (
                locationDescErr: mongoose.NativeError,
                locationDescriptions: { name: string; data: Map<string, string> }
              ) => {
                if (locationDescErr) {
                  res.status(500).json({ error: 'DB Error' });
                } else {
                  // Create a map to store the name:description pairs for both indicators and locations
                  const desc: Map<string, { [name: string]: string }> = new Map();
                  // Create a map to store the index of all the indicator/location/year values inside the values array
                  const keys: Map<string, string[]> = new Map();
                  // Fill the desc map
                  desc.set(
                    'indicators',
                    Object.fromEntries(indicatorDescriptions.data)
                  );
                  desc.set(
                    'locations',
                    Object.fromEntries(locationDescriptions.data)
                  );

                  // Create the arrays to put inside the keys map
                  const values: number[] = [];
                  const yearOrder: string[] = [];
                  const order = ['indicators', 'locations', 'years'];

                  // Create a map to temporarily store all the indicator values (this is done because indicatorData is not ordered,
                  // the alternative would be a find by name function or a DB query for each indicator)
                  const indicatorDataMap: Map<
                    string,
                    { [location: string]: { [year: string]: number } }
                  > = new Map();
                  indicatorData.forEach((indicator) => {
                    const data: {
                      [location: string]: { [year: string]: number };
                    } = JSON.parse(indicator.json_dump);
                    indicatorDataMap.set(indicator.name, data);
                    Object.values(data).forEach((years) => {
                      Object.keys(years).forEach((year) => {
                        if (!yearOrder.includes(year)) {
                          yearOrder.push(year);
                        }
                      });
                    });
                  });

                  // Fill the keys map
                  keys.set('order', order);
                  keys.set(
                    'indicators',
                    Array.from(indicatorDescriptions.data.keys())
                  );
                  keys.set(
                    'locations',
                    Array.from(locationDescriptions.data.keys())
                  );
                  keys.set('years', yearOrder);

                  // Fill the values array following the order stored in the keys map
                  keys.get('indicators').forEach((indicator) => {
                    keys.get('locations').forEach((location) => {
                      keys.get('years').forEach((year) => {
                        const currentIndicatorValues =
                          indicatorDataMap.get(indicator);
                        if (
                          currentIndicatorValues &&
                          currentIndicatorValues[location]
                        ) {
                          values.push(
                            currentIndicatorValues[location][year] || null
                          );
                        } else {
                          values.push(null);
                        }
                      });
                    });
                  });
                  res.status(200).json({
                    desc: Object.fromEntries(desc),
                    keys: Object.fromEntries(keys),
                    values,
                  });
                }
              }
            );
          }
        }
      );
    }
  });
};
