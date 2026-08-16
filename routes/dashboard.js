const express = require("express");
const Patient = require("../models/Patient");
const Consultation = require("../models/Consultation");
const auth = require("../middleware/auth");

const router = express.Router();

const RANGES = {
  tsh: { min: 0.27, max: 4.2 },
  t4: { min: 11.9, max: 21.6 },
  t3: { min: 3.1, max: 6.8 },
  antiTpo: { min: 0, max: 34 },
  antiTg: { min: 15, max: 115 },
};

const getStatus = (key, val) => {
  if (val === undefined || val === null || val === "") return null;
  const r = RANGES[key];
  const v = Number(val);
  if (v < r.min) return "Low";
  if (v > r.max) return "High";
  return "Normal";
};

// @route  GET /api/dashboard
router.get("/", auth, async (req, res) => {
  try {
    const patients = await Patient.find().select(
      "name dob gender createdAt reports.date reports.tsh reports.t4 reports.t3 reports.antiTpo reports.antiTg reports.createdAt"
    );

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let totalReports = 0;
    let reportsThisMonth = 0;
    let newPatientsThisMonth = 0;

    const genderSplit = { Male: 0, Female: 0, Other: 0 };
    const abnormalityCounts = { tsh: 0, t4: 0, t3: 0, antiTpo: 0, antiTg: 0 };
    const followUpDue = [];
    const abnormalAlerts = [];
    const allReportsFlat = [];

    patients.forEach((p) => {
      if (p.createdAt && new Date(p.createdAt) >= monthStart) newPatientsThisMonth++;
      if (p.gender && genderSplit[p.gender] !== undefined) genderSplit[p.gender]++;

      totalReports += p.reports.length;

      const sortedReports = [...p.reports].sort((a, b) => new Date(b.date) - new Date(a.date));

      p.reports.forEach((r) => {
        if (r.date && new Date(r.date) >= monthStart) reportsThisMonth++;
        allReportsFlat.push({
          patientId: p._id,
          patientName: p.name,
          date: r.date,
          createdAt: r.createdAt,
          tsh: r.tsh,
          t4: r.t4,
          t3: r.t3,
          antiTpo: r.antiTpo,
          antiTg: r.antiTg,
        });
      });

      if (sortedReports.length > 0) {
        const latest = sortedReports[0];

        if (new Date(latest.date) < sixMonthsAgo) {
          followUpDue.push({ id: p._id, name: p.name, lastReportDate: latest.date });
        }

        const abnormalParams = [];
        ["tsh", "t4", "t3", "antiTpo", "antiTg"].forEach((key) => {
          const status = getStatus(key, latest[key]);
          if (status === "High" || status === "Low") {
            abnormalParams.push({ param: key, status });
            abnormalityCounts[key]++;
          }
        });
        if (abnormalParams.length > 0) {
          abnormalAlerts.push({ id: p._id, name: p.name, date: latest.date, abnormalParams });
        }
      }
    });

    allReportsFlat.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    const recentActivity = allReportsFlat.slice(0, 5).map((r) => ({
      patientId: r.patientId,
      patientName: r.patientName,
      date: r.date,
      hasAbnormal: ["tsh", "t4", "t3", "antiTpo", "antiTg"].some((k) => {
        const st = getStatus(k, r[k]);
        return st === "High" || st === "Low";
      }),
    }));

    const mostCommonEntry = Object.entries(abnormalityCounts).sort((a, b) => b[1] - a[1])[0];

    const [totalConsultations, consultationsThisMonth] = await Promise.all([
      Consultation.countDocuments(),
      Consultation.countDocuments({ date: { $gte: monthStart } }),
    ]);

    res.json({
      totalPatients: patients.length,
      totalReports,
      totalConsultations,
      newPatientsThisMonth,
      reportsThisMonth,
      consultationsThisMonth,
      followUpDue: followUpDue.sort((a, b) => new Date(a.lastReportDate) - new Date(b.lastReportDate)),
      abnormalAlerts,
      genderSplit,
      abnormalityCounts,
      mostCommonAbnormality: mostCommonEntry && mostCommonEntry[1] > 0 ? { param: mostCommonEntry[0], count: mostCommonEntry[1] } : null,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;