const mongoose = require("mongoose");

const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication" },
    medicationName: { type: String, trim: true }, // snapshot at time of prescribing
    dosage: { type: String, trim: true },
    instructions: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },

    // Visit info
    visitType: { type: mongoose.Schema.Types.ObjectId, ref: "VisitType", required: true },
    visitTypeName: { type: String, trim: true }, // snapshot
    condition: { type: mongoose.Schema.Types.ObjectId, ref: "Condition", required: true },
    conditionName: { type: String, trim: true }, // snapshot
    date: { type: Date, required: true },

    // Clinical notes
    chiefComplaint: { type: String, trim: true, default: "" }, // "Pt c/o" - New Patient
    currentlyTaking: { type: String, trim: true, default: "" },
    feeling: { type: String, trim: true, default: "" },
    sssScore: { type: Number },

    // Blood test reference (link to an existing report on this patient, optional)
    linkedReport: { type: mongoose.Schema.Types.ObjectId, default: null },

    // Ultrasound (relevant mainly for Hashimoto's review)
    ultrasoundNotes: { type: String, trim: true, default: "" },

    allergy: { type: String, trim: true, default: "" },
    currentMedicines: { type: String, trim: true, default: "" },

    // On Examination
    bp: { type: String, trim: true, default: "" },
    pulse: { type: Number },
    spo2: { type: Number },

    // Plan
    planNotes: { type: String, trim: true, default: "" },
    consentGiven: { type: Boolean, default: false },

    prescriptions: { type: [prescriptionItemSchema], default: [] },

    dietaryRestrictions: { type: String, trim: true, default: "Gluten and Dairy free diet" },

    supplements: {
      zinc: { type: Boolean, default: false },
      selenium: { type: Boolean, default: false },
      vitD3K2: { type: Boolean, default: false },
      custom: { type: String, trim: true, default: "" },
    },

    immuneModulation: { type: String, trim: true, default: "" },

    reviewAfter: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);
