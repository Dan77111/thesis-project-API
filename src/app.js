require('dotenv').config();
const express = require('express');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const DataInstance = require('./models/data_instance');
const Indicator = require('./models/indicator');

const fetcher = require('./eurostat_fetcher');
const app = express();

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

const fetch_data = schedule.scheduleJob('0 * * * *', function () {
  //Get all necessary data from eurostat API and save in DB as current data
  //This happens every hour
  fetcher.fetch_all();
});

const save_snapshot = schedule.scheduleJob('* * 1 * *', function () {
  //Save data in DB as historic data snapshot
  //This should happen every month on the 1st
  Indicator.find({}, (err, data) => {
    if (err) {
      console.log('DB Error');
    } else {
      const dataObject = {};
      data.forEach((indicator) => {
        dataObject[indicator.name] = indicator.json_dump;
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
      const dataObject = {};
      data.forEach((indicator) => {
        dataObject[indicator.name] = JSON.parse(indicator.json_dump);
      });
      res.status(200).json(dataObject);
    }
  });
});

app.use('api/v1/snapshots/list', (req, res) => {
  DataInstance.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ error: 'DB Error' });
    } else {
      const dataObject = {};
      data.forEach((dataInstance, index) => {
        dataObject[
          index
        ] = `${dataInstance.date.getFullYear()}-${dataInstance.date.getMonth()}`;
      });
      res.status(200).json(dataObject);
    }
  });
});

app.use('/api/v1/snapshots/:date', (req, res) => {
  const date = JSON.parse(req.params.date);
  const month = date.month;
  const year = date.year;
  DataInstance.findOne(
    { date: { $gte: `${year}-${month}-1`, $lte: `${year}-${month + 1}-1` } },
    (err, data) => {
      if (err) {
        res.status(500).json({ error: 'DB Error' });
      } else {
        const dataObject = {};
        Object.keys(data.data).forEach((indicator_name) => {
          dataObject[indicator_name] = JSON.parse(data.data[indicator_name]);
        });
        res.status(200).json(dataObject);
      }
    }
  );
});

app.use((req, res) => {
  res.status = 404;
  res.json({ error: 'Not found' });
});

module.exports = app;
