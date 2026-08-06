const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    dosages: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medication", medicationSchema);
