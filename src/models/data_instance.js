const mongoose = require('mongoose');

const DataInstance = mongoose.model(
  'data_instance',
  {
    data: { type: Map, required: true },
    date: { type: Date, required: true },
  },
  'snapshots'
);

module.exports = DataInstance;
