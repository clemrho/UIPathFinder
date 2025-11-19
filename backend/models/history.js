const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema({
  time: String,
  location: String,
  activity: String,
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { _id: false });

const PathOptionSchema = new mongoose.Schema({
  title: String,
  schedule: { type: [ScheduleItemSchema], default: [] },
  routeGeo: { type: Object, default: null },
  rank: { type: Number, default: 0 }
}, { _id: false });

const HistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  subtitle: { type: String },
  userRequest: String,
  requestedDate: Date,
  metadata: { type: Object, default: {} },
  pathOptions: { type: [PathOptionSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);
