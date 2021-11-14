import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import schedule from 'node-schedule';
import mongoose from 'mongoose';
import Logger from './lib/logger';
import { DataInstance } from './models/data_instance';
import { Indicator } from './models/indicator';

import { fetch_all } from './eurostat_fetcher';
const app = express();

// @ts-ignore
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

const fetchData: schedule.Job = schedule.scheduleJob('0 * * * *', () => {
  // Get all necessary data from eurostat API and save in DB as current data
  // This happens every hour
  fetch_all();
});

const saveSnapshot: schedule.Job = schedule.scheduleJob('* * 1 * *', () => {
  // Save data in DB as historic data snapshot
  // This should happen every month on the 1st
  Indicator.find({}, (err, data) => {
    if (err) {
      Logger.error('DB Error');
    } else {
      const dataObject: Map<string, string> = new Map();
      data.forEach((indicator) => {
        dataObject.set(indicator.name, indicator.json_dump);
      });
      const dataSnaphot = new DataInstance({ data: dataObject, date: new Date() });
      dataSnaphot.save();
    }
  });
});

app.use('/api/v1/current', (req, res) => {
  Indicator.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ error: 'DB Error' });
    } else {
      const dataObject: Map<string, any> = new Map();
      data.forEach((indicator) => {
        dataObject.set(indicator.name, JSON.parse(indicator.json_dump));
      });
      res.status(200).json(Object.fromEntries(dataObject));
    }
  });
});

app.use('/api/v1/snapshots/list', (req, res) => {
  DataInstance.find({}, (err, dataInstances) => {
    if (err) {
      res.status(500).json({ error: 'DB Error' });
    } else {
      const dataObject: Map<number, string> = new Map();
      dataInstances.forEach((dataInstance, index) => {
        dataObject.set(
          index,
          `${dataInstance.date.getFullYear()}-${dataInstance.date.getMonth()}`
        );
      });
      res.status(200).json(Object.fromEntries(dataObject));
    }
  });
});

app.use('/api/v1/snapshots/:month-:year', (req, res) => {
  const month = req.params.month;
  const year = req.params.year;
  DataInstance.findOne(
    { date: { $gte: `${year}-${month}-1`, $lt: `${year}-${Number(month) + 1}-1` } },
    (err: mongoose.NativeError, dataInstance: any) => {
      if (err) {
        res.status(500).json({ error: 'DB Error' });
      } else {
        const dataObject: Map<string, any> = new Map();
        dataInstance.data.forEach((jsonString: string, indicatorName: string) => {
          dataObject.set(indicatorName, JSON.parse(jsonString));
        });
        res.status(200).json(Object.fromEntries(dataObject));
      }
    }
  );
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };
