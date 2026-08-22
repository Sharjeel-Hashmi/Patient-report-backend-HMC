require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const labRoutes = require("./routes/labs");
const dashboardRoutes = require("./routes/dashboard");
const visitTypeRoutes = require("./routes/visitTypes");
const conditionRoutes = require("./routes/conditions");
const medicationRoutes = require("./routes/medications");
const consultationRoutes = require("./routes/consultations");

const app = express();

connectDB();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like Postman/curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "HMC Thyroid Tracker API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patients", consultationRoutes); // adds /api/patients/:patientId/consultations
app.use("/api/labs", labRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/visit-types", visitTypeRoutes);
app.use("/api/conditions", conditionRoutes);
app.use("/api/medications", medicationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;