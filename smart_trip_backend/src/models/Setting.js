const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true
  }
);

const Setting = mongoose.model('Setting', SettingSchema);

module.exports = Setting;
