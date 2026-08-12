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

// "Currently taking" is now a multi-select of medications (previously free text) —
// snapshot the name at save time, same pattern as prescriptionItemSchema.
const currentlyTakingItemSchema = new mongoose.Schema(
  {
    medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication" },
    medicationName: { type: String, trim: true },
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
    currentlyTaking: { type: String, trim: true, default: "" }, // deprecated free-text (kept for old records)
    currentlyTakingMeds: { type: [currentlyTakingItemSchema], default: [] }, // multi-select, current field
    feeling: { type: String, trim: true, enum: ["", "Worse", "Better", "Good", "Very Good"], default: "" },
    sssScore: { type: Number, min: 0, max: 50 },

    // Blood test reference(s) — 1 report = single view, 2 reports = comparison view.
    // `linkedReport` kept for backward compatibility with older consultations.
    linkedReport: { type: mongoose.Schema.Types.ObjectId, default: null },
    linkedReports: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 2,
        message: "You can link at most 2 reports (for comparison).",
      },
    },

    // Thyroid Ultrasound — condition-independent (any consultation can record this)
    thyroidUSDone: { type: String, trim: true, enum: ["", "Yes", "No"], default: "" },
    ultrasoundNotes: { type: String, trim: true, default: "" }, // "Findings"
    referForThyroidUS: { type: String, trim: true, enum: ["", "Yes", "No"], default: "" },

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
      magnesium: { type: Boolean, default: false },
      custom: { type: String, trim: true, default: "" },
    },

    immuneModulation: { type: String, trim: true, default: "" },

    reviewAfter: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);