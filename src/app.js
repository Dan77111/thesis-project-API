require('dotenv').config();
const express = require('express');
const schedule = require('node-schedule');

const app = express();

const fetch_data = schedule.scheduleJob('0 * * * *', function () {
  // TODO: Get all necessary data from eurostat API and save in DB as current data
  console.log('This should happen every hour');
});

const save_snapshot = schedule.scheduleJob('* * 1 * *', function () {
  // TODO: Save data in DB as historic data snapshot
  console.log('This should happen every month on the 1st');
});

const fetcher = require('./eurostat_fetcher');

const data = fetcher.fetch_all();

const sample_route = require('./routes/sample_route.js');

app.use('/api/v1', (req, res) => {
  res.status(200).json(data);
});

app.use('/api/v1/sample_route', sample_route);

app.use(() => {
  res.status = 404;
  res.json({ error: 'Not found' });
});

module.exports = app;
