const mongoose = require('mongoose');

const Indicator = mongoose.model(
  'indicator',
  {
    name: { type: String, required: true, unique: true },
    json_dump: { type: String, required: true },
  },
  'current'
);

module.exports = Indicator;
