const express = require("express");
const Patient = require("../models/Patient");
const Consultation = require("../models/Consultation");
const auth = require("../middleware/auth");

const router = express.Router();

// @route  GET /api/patients
// Supports: ?search=name & ?dob=YYYY-MM-DD & ?reportDate=YYYY-MM-DD & ?page=1 & ?limit=10
router.get("/", auth, async (req, res) => {
  try {
    const { search, dob, reportDate } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (dob) {
      const start = new Date(dob);
      const end = new Date(dob);
      end.setDate(end.getDate() + 1);
      query.dob = { $gte: start, $lt: end };
    }

    let patients = await Patient.find(query).sort({ createdAt: -1 });

    if (reportDate) {
      const start = new Date(reportDate);
      const end = new Date(reportDate);
      end.setDate(end.getDate() + 1);
      patients = patients.filter((p) =>
        p.reports.some((r) => new Date(r.date) >= start && new Date(r.date) < end)
      );
    }

    const totalCount = patients.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const startIndex = (page - 1) * limit;
    const paginatedPatients = patients.slice(startIndex, startIndex + limit);

    // Consultation count + last consultation date for just this page of patients
    const patientIds = paginatedPatients.map((p) => p._id);
    const consultationStats = await Consultation.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $group: { _id: "$patient", count: { $sum: 1 }, lastDate: { $max: "$date" } } },
    ]);
    const statsMap = {};
    consultationStats.forEach((cs) => {
      statsMap[cs._id.toString()] = { count: cs.count, lastDate: cs.lastDate };
    });

    const patientsWithConsultations = paginatedPatients.map((p) => {
      const obj = p.toObject();
      const cs = statsMap[p._id.toString()];
      obj.consultationsCount = cs ? cs.count : 0;
      obj.lastConsultationDate = cs ? cs.lastDate : null;
      return obj;
    });

    res.json({
      patients: patientsWithConsultations,
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  GET /api/patients/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  POST /api/patients
router.post("/", auth, async (req, res) => {
  try {
    const { name, dob, gender, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Patient name is required" });
    }
    const patient = await Patient.create({ name, dob, gender, phone, address });
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  PUT /api/patients/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, dob, gender, phone, address } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, dob, gender, phone, address },
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/patients/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- REPORTS (nested) ----------

// @route  POST /api/patients/:id/reports
router.post("/:id/reports", auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const { date, labName, tsh, t4, t3, antiTpo, antiTg, notes } = req.body;
    if (!date) return res.status(400).json({ message: "Report date is required" });

    patient.reports.push({ date, labName, tsh, t4, t3, antiTpo, antiTg, notes });
    await patient.save();

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  PUT /api/patients/:id/reports/:reportId
router.put("/:id/reports/:reportId", auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const report = patient.reports.id(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const { date, labName, tsh, t4, t3, antiTpo, antiTg, notes } = req.body;
    if (date !== undefined) report.date = date;
    if (labName !== undefined) report.labName = labName;
    if (tsh !== undefined) report.tsh = tsh;
    if (t4 !== undefined) report.t4 = t4;
    if (t3 !== undefined) report.t3 = t3;
    if (antiTpo !== undefined) report.antiTpo = antiTpo;
    if (antiTg !== undefined) report.antiTg = antiTg;
    if (notes !== undefined) report.notes = notes;

    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route  DELETE /api/patients/:id/reports/:reportId
router.delete("/:id/reports/:reportId", auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.reports.id(req.params.reportId).deleteOne();
    await patient.save();

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;