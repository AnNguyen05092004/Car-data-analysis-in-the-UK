const mongoose = require('mongoose');

const serviceHistorySchema = new mongoose.Schema({
  service_id: String,
  date: Date,
  type: String,
  cost: Number
}, { _id: false });

const accidentHistorySchema = new mongoose.Schema({
  accident_id: String,
  date: Date,
  description: String,
  severity: String,
  cost_of_repair: Number
}, { _id: false });

const carSchema = new mongoose.Schema({
  _id: String,
  manufacturer: String,
  model: String,
  specifications: {
    engine_size: Number,
    fuel_type: String,
    year_of_manufacturing: Number
  },
  status: {
    mileage: Number,
    price: Number
  },
  dealer_id: String,
  features: [String],
  service_history: [serviceHistorySchema],
  accident_history: [accidentHistorySchema]
}, { collection: 'cars' });

module.exports = mongoose.model('Car', carSchema);