const express = require("express");
const Condition = require("../models/Condition");
const auth = require("../middleware/auth");

const router = express.Router();

// @route  GET /api/conditions
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {};
    const conditions = await Condition.find(filter).sort({ name: 1 });
    res.json(conditions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/conditions
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Condition name is required" });
    }
    const existing = await Condition.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "Condition already exists" });

    const condition = await Condition.create({ name: name.trim() });
    res.status(201).json(condition);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  PUT /api/conditions/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (isActive !== undefined) update.isActive = isActive;

    const condition = await Condition.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!condition) return res.status(404).json({ message: "Condition not found" });
    res.json(condition);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/conditions/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const condition = await Condition.findByIdAndDelete(req.params.id);
    if (!condition) return res.status(404).json({ message: "Condition not found" });
    res.json({ message: "Condition deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
