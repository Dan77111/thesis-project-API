import mongoose from 'mongoose';

const DataInstanceSchema = new mongoose.Schema({
  data: { type: Map, required: true },
  date: { type: Date, required: true },
});

const DataInstance = mongoose.model(
  'data_instance',
  DataInstanceSchema,
  'snapshots'
);

export { DataInstance };
