const express = require("express");
const Lab = require("../models/Lab");
const auth = require("../middleware/auth");

const router = express.Router();

// @route  GET /api/labs
router.get("/", auth, async (req, res) => {
  try {
    const labs = await Lab.find().sort({ name: 1 });
    res.json(labs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/labs
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Lab name is required" });
    }
    const existing = await Lab.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "Lab already exists" });

    const lab = await Lab.create({ name: name.trim() });
    res.status(201).json(lab);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/labs/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ message: "Lab not found" });
    res.json({ message: "Lab deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
