const express = require("express");
const Medication = require("../models/Medication");
const auth = require("../middleware/auth");

const router = express.Router();

// @route  GET /api/medications
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const medications = await Medication.find(filter).sort({ name: 1 });
    res.json(medications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/medications
router.post("/", auth, async (req, res) => {
  try {
    const { name, dosages } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Medication name is required" });
    }
    const existing = await Medication.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "Medication already exists" });

    const cleanDosages = Array.isArray(dosages)
      ? dosages.map((d) => String(d).trim()).filter(Boolean)
      : [];

    const medication = await Medication.create({ name: name.trim(), dosages: cleanDosages });
    res.status(201).json(medication);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  PUT /api/medications/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, dosages, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (dosages !== undefined) {
      update.dosages = Array.isArray(dosages) ? dosages.map((d) => String(d).trim()).filter(Boolean) : [];
    }
    if (isActive !== undefined) update.isActive = isActive;

    const medication = await Medication.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!medication) return res.status(404).json({ message: "Medication not found" });
    res.json(medication);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/medications/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);
    if (!medication) return res.status(404).json({ message: "Medication not found" });
    res.json({ message: "Medication deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
