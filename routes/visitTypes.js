const express = require("express");
const VisitType = require("../models/VisitType");
const auth = require("../middleware/auth");

const router = express.Router();

// @route  GET /api/visit-types
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const visitTypes = await VisitType.find(filter).sort({ name: 1 });
    res.json(visitTypes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/visit-types
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Visit type name is required" });
    }
    const existing = await VisitType.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "Visit type already exists" });

    const visitType = await VisitType.create({ name: name.trim() });
    res.status(201).json(visitType);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  PUT /api/visit-types/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (isActive !== undefined) update.isActive = isActive;

    const visitType = await VisitType.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!visitType) return res.status(404).json({ message: "Visit type not found" });
    res.json(visitType);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/visit-types/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const visitType = await VisitType.findByIdAndDelete(req.params.id);
    if (!visitType) return res.status(404).json({ message: "Visit type not found" });
    res.json({ message: "Visit type deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
