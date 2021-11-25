import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import schedule from 'node-schedule';
import mongoose from 'mongoose';
import cors from 'cors';
import Logger from './lib/logger';
import { DataInstance } from './models/data_instance';
import { Indicator } from './models/indicator';
import { currentRoute } from './routes/current';

import { fetchAll } from './eurostat_fetcher';
const app = express();

// @ts-ignore
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

const fetchData: schedule.Job = schedule.scheduleJob('0 0 * * 0', () => {
  // Get all necessary data from eurostat API and save in DB as current data
  // This happens every day
  // PROBLEM: Rarely the fetchAll fails due to ECONNRESET,
  // REASON: maybe eurostat is restricting queries from my IP for too many requests during testing?
  // SOLUTION: It will probably not be a problem once the fetchAll happens only once a day
  fetchAll();
});

const saveSnapshot: schedule.Job = schedule.scheduleJob('0 0 1 * *', () => {
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

app.use(cors());

app.use('/api/v1/current', currentRoute);

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

//This will have to be changed to comply to the same format as the /current route but for now it's not needed in building the React app
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
