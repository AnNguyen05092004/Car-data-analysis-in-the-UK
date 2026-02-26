const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  _id: String,
  name: String,
  city: String,
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [Number]
  }
}, { collection: 'dealers' });

dealerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Dealer', dealerSchema);