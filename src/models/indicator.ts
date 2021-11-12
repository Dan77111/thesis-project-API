import mongoose from 'mongoose';

const IndicatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  json_dump: { type: String, required: true },
});

const Indicator = mongoose.model('indicator', IndicatorSchema, 'current');

export { Indicator };
