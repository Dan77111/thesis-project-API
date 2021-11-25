import mongoose from 'mongoose';

const DescriptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: Map, required: true },
});

const Description = mongoose.model('description', DescriptionSchema, 'descriptions');

export { Description };
