const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    labName: { type: String, trim: true },
    tsh: { type: Number },
    t4: { type: Number },
    t3: { type: Number },
    antiTpo: { type: Number },
    antiTg: { type: Number },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    reports: [reportSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
