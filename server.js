require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Report = require("./model/reportSchema");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log("✅ Connected to MongoDB");
    }).catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });


// API Routes
app.post("/api/save-report", async (req, res) => {
    try {
        const {
            instrument,
            form1, form1_results,
            form2, form2_results,
            form3, form3_results
        } = req.body;

        const instrument_id = instrument ? instrument.capacity : "Unknown";

        const newReport = new Report({
            instrument_id,
            instrument_data: instrument,
            form1_data: form1,
            form1_results,
            form2_data: form2,
            form2_results,
            form3_data: form3,
            form3_results
        });

        const savedReport = await newReport.save();
        res.json({ message: "Report saved successfully!", id: savedReport._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/history", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id createdAt").sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/report/:id", async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route 

app.get("/dashboard", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id instrument_data createdAt").sort({ createdAt: -1 });
        res.render("dashboard", { reports });
    } catch (err) {
        res.status(500).send("Error loading dashboard");
    }
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/new-test", (req, res) => {
    res.render("new-test");
});

app.get("/tests", (req, res) => {
    res.render("tests");
});

app.get("/report", (req, res) => {
    res.render("report");
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
