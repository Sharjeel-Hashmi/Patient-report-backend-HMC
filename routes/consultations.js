const express = require("express");
const Consultation = require("../models/Consultation");
const Patient = require("../models/Patient");
const VisitType = require("../models/VisitType");
const Condition = require("../models/Condition");
const Medication = require("../models/Medication");
const auth = require("../middleware/auth");

const router = express.Router();

// Resolves visitType / condition / prescriptions refs and snapshots their current
// names onto the consultation, so old consultations stay readable even if the
// master list is edited/renamed/removed later.
async function buildConsultationPayload(body) {
  const {
    visitType,
    condition,
    date,
    chiefComplaint,
    currentlyTakingMeds,
    feeling,
    sssScore,
    linkedReports,
    thyroidUSDone,
    ultrasoundNotes,
    referForThyroidUS,
    allergy,
    currentMedicines,
    bp,
    pulse,
    spo2,
    planNotes,
    consentGiven,
    prescriptions,
    dietaryRestrictions,
    supplements,
    immuneModulation,
    reviewAfter,
  } = body;

  if (!visitType) throw new Error("Visit type is required");
  if (!condition) throw new Error("Condition is required");
  if (!date) throw new Error("Date is required");

  const visitTypeDoc = await VisitType.findById(visitType);
  if (!visitTypeDoc) throw new Error("Selected visit type not found");
  const conditionDoc = await Condition.findById(condition);
  if (!conditionDoc) throw new Error("Selected condition not found");

  let resolvedPrescriptions = [];
  if (Array.isArray(prescriptions)) {
    resolvedPrescriptions = await Promise.all(
      prescriptions
        .filter((p) => p && p.medication)
        .map(async (p) => {
          const medDoc = await Medication.findById(p.medication);
          return {
            medication: p.medication,
            medicationName: medDoc ? medDoc.name : "",
            dosage: p.dosage || "",
            instructions: p.instructions || "",
          };
        })
    );
  }

  // "Currently taking" — multi-select of medications, same snapshot pattern as prescriptions.
  let resolvedCurrentlyTakingMeds = [];
  if (Array.isArray(currentlyTakingMeds)) {
    resolvedCurrentlyTakingMeds = await Promise.all(
      currentlyTakingMeds
        .filter((m) => m) // accepts either an id string or { medication: id }
        .map(async (m) => {
          const medId = typeof m === "string" ? m : m.medication;
          if (!medId) return null;
          const medDoc = await Medication.findById(medId);
          return { medication: medId, medicationName: medDoc ? medDoc.name : "" };
        })
    );
    resolvedCurrentlyTakingMeds = resolvedCurrentlyTakingMeds.filter(Boolean);
  }

  // Linked blood test report(s) — 1 = single view, 2 = comparison view.
  const resolvedLinkedReports = Array.isArray(linkedReports)
    ? linkedReports.filter(Boolean).slice(0, 2)
    : [];

  return {
    visitType: visitTypeDoc._id,
    visitTypeName: visitTypeDoc.name,
    condition: conditionDoc._id,
    conditionName: conditionDoc.name,
    date,
    chiefComplaint,
    currentlyTakingMeds: resolvedCurrentlyTakingMeds,
    feeling,
    sssScore: sssScore === "" || sssScore === undefined ? undefined : Number(sssScore),
    linkedReports: resolvedLinkedReports,
    thyroidUSDone,
    ultrasoundNotes,
    referForThyroidUS,
    allergy,
    currentMedicines,
    bp,
    pulse: pulse === "" || pulse === undefined ? undefined : Number(pulse),
    spo2: spo2 === "" || spo2 === undefined ? undefined : Number(spo2),
    planNotes,
    consentGiven: Boolean(consentGiven),
    prescriptions: resolvedPrescriptions,
    dietaryRestrictions,
    supplements,
    immuneModulation,
    reviewAfter,
  };
}

// @route  GET /api/patients/:patientId/consultations
router.get("/:patientId/consultations", auth, async (req, res) => {
  try {
    const consultations = await Consultation.find({ patient: req.params.patientId }).sort({ date: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  GET /api/patients/:patientId/consultations/:consultationId
router.get("/:patientId/consultations/:consultationId", auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.consultationId,
      patient: req.params.patientId,
    });
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/patients/:patientId/consultations
router.post("/:patientId/consultations", auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const payload = await buildConsultationPayload(req.body);
    const consultation = await Consultation.create({ ...payload, patient: patient._id });
    res.status(201).json(consultation);
  } catch (err) {
    res.status(400).json({ message: err.message || "Server error" });
  }
});

// @route  PUT /api/patients/:patientId/consultations/:consultationId
router.put("/:patientId/consultations/:consultationId", auth, async (req, res) => {
  try {
    const payload = await buildConsultationPayload(req.body);
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.consultationId, patient: req.params.patientId },
      payload,
      { new: true }
    );
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });
    res.json(consultation);
  } catch (err) {
    res.status(400).json({ message: err.message || "Server error" });
  }
});

// @route  DELETE /api/patients/:patientId/consultations/:consultationId
router.delete("/:patientId/consultations/:consultationId", auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndDelete({
      _id: req.params.consultationId,
      patient: req.params.patientId,
    });
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });
    res.json({ message: "Consultation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;