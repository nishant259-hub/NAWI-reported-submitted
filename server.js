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


// ── API Routes ──────────────────────────────────────────────────

// Save complete test report to database
app.post("/api/save-report", async (req, res) => {
    try {
        const {
            instrument,
            testPlan,
            form0, form0_results,
            form1, form1_results,
            form2, form2_results,
            form3, form3_results,
            form_zero, form_zero_results,
            form_tare, form_tare_results,
            form_tilt, form_tilt_results
        } = req.body;

        const instrument_id = instrument
            ? `${instrument.manufacturer || ""} ${instrument.model || ""}`.trim() || instrument.capacity
            : "Unknown";

        const newReport = new Report({
            instrument_id,
            instrument_data: instrument,
            test_plan:          testPlan,
            form0_data:         form0,
            form0_results,
            form1_data:         form1,
            form1_results,
            form2_data:         form2,
            form2_results,
            form3_data:         form3,
            form3_results,
            form_zero_data:     form_zero,
            form_zero_results,
            form_tare_data:     form_tare,
            form_tare_results,
            form_tilt_data:     form_tilt,
            form_tilt_results
        });

        const savedReport = await newReport.save();
        res.json({ message: "Report saved successfully!", id: savedReport._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all reports (for dashboard)
app.get("/api/history", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id createdAt").sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch a single report by ID
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

// ── Page Routes ─────────────────────────────────────────────────

app.get("/history", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id instrument_data createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results").sort({ createdAt: -1 }).lean();
        
        // Calculate status for each report to use in the frontend
        reports.forEach(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            r.status = isPass ? "PASS" : "FAIL";
            // Get Serial No
            r.serial_no = (r.instrument_data && r.instrument_data.serial_no) ? r.instrument_data.serial_no : "N/A";
            // Get Class
            r.accuracy_class = (r.instrument_data && r.instrument_data.Class_value) ? r.instrument_data.Class_value : "Unknown";
            // Get Instrument Type
            r.instrument_type = (r.instrument_data && r.instrument_data.instrument_type) ? r.instrument_data.instrument_type : "Unknown";
        });

        res.render("history", { reports });
    } catch (err) {
        res.status(500).send("Error loading history");
    }
});

app.get("/",          (req, res) => res.render("index"));
app.get("/login",     (req, res) => res.render("login"));
app.get("/signup",    (req, res) => res.redirect("/login"));
app.get("/home", async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results").sort({ createdAt: -1 }).lean();
        
        let passed = 0;
        let failed = 0;
        
        const recentTests = [];
        reports.forEach((r, idx) => {
            let isPass = true;
            // A report is FAIL if any result explicitly says "FAIL"
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            
            if (isPass) passed++;
            else failed++;
            
            if (idx < 4) {
                recentTests.push({
                    id: r._id.toString().substring(0,8).toUpperCase(),
                    name: r.instrument_id || "Unknown Instrument",
                    status: isPass ? "PASS" : "FAIL"
                });
            }
        });

        res.render("home", { total: reports.length, passed, failed, recentTests });
    } catch (err) {
        res.render("home", { total: 0, passed: 0, failed: 0, recentTests: [] });
    }
});
app.get("/new-test",  (req, res) => res.render("new-test"));
app.get("/test-plan", (req, res) => res.render("test-plan"));
app.get("/tests",     (req, res) => res.render("tests"));
app.get("/report", async (req, res) => {
    try {
        if (!req.query.id) return res.redirect("/history");
        const report = await Report.findById(req.query.id).lean();
        if (!report) {
            return res.status(404).send("Report not found");
        }
        
        let overallPass = true;
        let passCount = 0;
        let failCount = 0;
        let totalTests = 0;
        
        const checkStatus = (resultsObj) => {
            if (!resultsObj) return null;
            totalTests++;
            let isPass = true;
            if (JSON.stringify(resultsObj).includes('"FAIL"')) {
                isPass = false;
            }
            if (isPass) passCount++;
            else { failCount++; overallPass = false; }
            return isPass ? "PASS" : "FAIL";
        };

        const testStatus = {
            visual: checkStatus(report.form0_results),
            weighing: checkStatus(report.form1_results),
            repeatability: checkStatus(report.form2_results),
            eccentricity: checkStatus(report.form3_results),
            zero: checkStatus(report.form_zero_results),
            tare: checkStatus(report.form_tare_results),
            tilt: checkStatus(report.form_tilt_results)
        };
        
        res.render("report", { report, overallPass, passCount, failCount, totalTests, testStatus });
    } catch (err) {
        res.status(500).send("Error loading report: " + err.message);
    }
});

app.get("/report-detailed", async (req, res) => {
    try {
        if (!req.query.id) return res.redirect("/history");
        const report = await Report.findById(req.query.id).lean();
        if (!report) {
            return res.status(404).send("Report not found");
        }
        res.render("report-detailed", { report });
    } catch (err) {
        res.status(500).send("Error loading detailed report: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
